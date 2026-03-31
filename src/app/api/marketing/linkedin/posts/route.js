import { getCurrentUser } from "../../utils/auth.js";
import sql from "../../../utils/sql.js";

async function getLinkedInToken() {
  const rows = await sql`
    SELECT access_token, token_expiry, metadata
    FROM marketing_connections
    WHERE platform = 'linkedin' AND is_active = true
    LIMIT 1
  `;
  if (!rows.length) return null;

  const conn = rows[0];
  if (conn.token_expiry && new Date(conn.token_expiry) < new Date()) {
    return null; // Token expired — user needs to reconnect
  }

  const metadata = typeof conn.metadata === "string" ? JSON.parse(conn.metadata) : conn.metadata;
  return { accessToken: conn.access_token, memberId: metadata?.memberId };
}

// GET — list posts with optional status filter
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

  let query = "SELECT * FROM linkedin_posts";
  const params = [];

  if (status) {
    query += ` WHERE status = $${params.length + 1}`;
    params.push(status);
  }
  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const posts = await sql(query, params);

  // Stats
  const stats = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'draft')::int AS draft_count,
      COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled_count,
      COUNT(*) FILTER (WHERE status = 'posted')::int AS posted_count,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_count,
      COUNT(*)::int AS total
    FROM linkedin_posts
  `;

  return Response.json({ posts, stats: stats[0] });
}

// POST — create draft, publish, or schedule a post
export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action = "save" } = body;

  if (action === "save") {
    return handleSave(body);
  }
  if (action === "publish") {
    return handlePublish(body);
  }
  if (action === "schedule") {
    return handleSchedule(body);
  }

  return Response.json({ error: "Invalid action. Use 'save', 'publish', or 'schedule'." }, { status: 400 });
}

async function handleSave({ content, media_url, post_type = "text" }) {
  if (!content) return Response.json({ error: "Content is required" }, { status: 400 });

  const post = await sql`
    INSERT INTO linkedin_posts (content, media_url, post_type, status)
    VALUES (${content}, ${media_url || null}, ${post_type}, 'draft')
    RETURNING *
  `;
  return Response.json({ post: post[0] });
}

async function handleSchedule({ content, media_url, post_type = "text", scheduled_for }) {
  if (!content) return Response.json({ error: "Content is required" }, { status: 400 });
  if (!scheduled_for) return Response.json({ error: "scheduled_for is required" }, { status: 400 });

  const post = await sql`
    INSERT INTO linkedin_posts (content, media_url, post_type, status, scheduled_for)
    VALUES (${content}, ${media_url || null}, ${post_type}, 'scheduled', ${scheduled_for})
    RETURNING *
  `;
  return Response.json({ post: post[0] });
}

async function handlePublish({ id, content, media_url, post_type = "text" }) {
  const li = await getLinkedInToken();
  if (!li?.accessToken || !li?.memberId) {
    return Response.json(
      { error: "LinkedIn not connected or token expired. Please reconnect." },
      { status: 400 }
    );
  }

  // If publishing an existing draft, load its content
  let postContent = content;
  let postId = id;

  if (id && !content) {
    const rows = await sql`SELECT * FROM linkedin_posts WHERE id = ${id}`;
    if (!rows.length) return Response.json({ error: "Post not found" }, { status: 404 });
    postContent = rows[0].content;
    media_url = rows[0].media_url;
    post_type = rows[0].post_type;
  }

  if (!postContent) return Response.json({ error: "Content is required" }, { status: 400 });

  try {
    // LinkedIn UGC Post API
    const postBody = {
      author: `urn:li:person:${li.memberId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: postContent },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    // If there's a media URL, include it as an article share
    if (media_url) {
      postBody.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "ARTICLE";
      postBody.specificContent["com.linkedin.ugc.ShareContent"].media = [
        {
          status: "READY",
          originalUrl: media_url,
        },
      ];
    }

    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${li.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || JSON.stringify(err));
    }

    const result = await res.json();
    const platformPostId = result.id;

    // Upsert — update existing draft or create new record
    let saved;
    if (postId) {
      saved = await sql`
        UPDATE linkedin_posts
        SET status = 'posted', platform_post_id = ${platformPostId}, posted_at = CURRENT_TIMESTAMP,
            content = ${postContent}, media_url = ${media_url || null}
        WHERE id = ${postId}
        RETURNING *
      `;
    } else {
      saved = await sql`
        INSERT INTO linkedin_posts (content, media_url, post_type, status, platform_post_id, posted_at)
        VALUES (${postContent}, ${media_url || null}, ${post_type}, 'posted', ${platformPostId}, CURRENT_TIMESTAMP)
        RETURNING *
      `;
    }

    return Response.json({
      success: true,
      post: saved[0],
      message: "Post published to LinkedIn successfully!",
    });
  } catch (err) {
    console.error("[linkedin/posts] publish error:", err);

    // Save as failed if we have a draft
    if (postId) {
      await sql`UPDATE linkedin_posts SET status = 'failed' WHERE id = ${postId}`;
    }

    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PUT — update a draft post
export async function PUT(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, content, media_url, post_type, status } = await request.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const fields = [];
  const params = [];

  if (content !== undefined) {
    params.push(content);
    fields.push(`content = $${params.length}`);
  }
  if (media_url !== undefined) {
    params.push(media_url);
    fields.push(`media_url = $${params.length}`);
  }
  if (post_type !== undefined) {
    params.push(post_type);
    fields.push(`post_type = $${params.length}`);
  }
  if (status !== undefined) {
    params.push(status);
    fields.push(`status = $${params.length}`);
  }

  if (!fields.length) return Response.json({ error: "No fields to update" }, { status: 400 });

  params.push(id);
  const query = `UPDATE linkedin_posts SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING *`;
  const updated = await sql(query, params);

  if (!updated.length) return Response.json({ error: "Post not found" }, { status: 404 });
  return Response.json({ post: updated[0] });
}

// DELETE — remove a post
export async function DELETE(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const rows = await sql`DELETE FROM linkedin_posts WHERE id = ${id} RETURNING id`;
  if (!rows.length) return Response.json({ error: "Post not found" }, { status: 404 });

  return Response.json({ success: true });
}
