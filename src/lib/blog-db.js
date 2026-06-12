/**
 * Blog post database operations — wraps the blog_posts table.
 * All functions return plain objects (not raw pg rows).
 */
import sql from "@/app/api/utils/sql.js";

export async function getAllPosts({ status } = {}) {
  if (status) {
    const rows = await sql`
      SELECT
        bp.id, bp.slug, bp.title, bp.excerpt, bp.cover_image_url,
        bp.status, bp.published_at, bp.meta_description, bp.tags,
        bp.created_at, bp.updated_at,
        au.username AS author_username
      FROM blog_posts bp
      LEFT JOIN auth_users au ON au.id = bp.author_id
      WHERE bp.status = ${status}
      ORDER BY bp.published_at DESC NULLS LAST, bp.created_at DESC
    `;
    return rows.map((r) => ({ ...r, tags: r.tags || [] }));
  }

  const rows = await sql`
    SELECT
      bp.id, bp.slug, bp.title, bp.excerpt, bp.cover_image_url,
      bp.status, bp.published_at, bp.meta_description, bp.tags,
      bp.created_at, bp.updated_at,
      au.username AS author_username
    FROM blog_posts bp
    LEFT JOIN auth_users au ON au.id = bp.author_id
    ORDER BY bp.published_at DESC NULLS LAST, bp.created_at DESC
  `;
  return rows.map((r) => ({ ...r, tags: r.tags || [] }));
}

export async function getPublishedPosts() {
  const rows = await sql`
    SELECT
      bp.id, bp.slug, bp.title, bp.excerpt, bp.cover_image_url,
      bp.published_at, bp.meta_description, bp.tags,
      bp.created_at,
      au.username AS author_username
    FROM blog_posts bp
    LEFT JOIN auth_users au ON au.id = bp.author_id
    WHERE bp.status = 'published'
    ORDER BY bp.published_at DESC
  `;
  return rows.map((r) => ({ ...r, tags: r.tags || [] }));
}

export async function getPostById(id) {
  const [row] = await sql`
    SELECT
      bp.*,
      au.username AS author_username
    FROM blog_posts bp
    LEFT JOIN auth_users au ON au.id = bp.author_id
    WHERE bp.id = ${id}
  `;
  if (!row) return null;
  return { ...row, tags: row.tags || [] };
}

export async function getPostBySlug(slug) {
  const [row] = await sql`
    SELECT
      bp.*,
      au.username AS author_username
    FROM blog_posts bp
    LEFT JOIN auth_users au ON au.id = bp.author_id
    WHERE bp.slug = ${slug}
  `;
  if (!row) return null;
  return { ...row, tags: row.tags || [] };
}

export async function getRelatedPosts({ category, currentSlug, limit = 3 }) {
  // Use the tags[1] as a simple category stand-in for DB posts
  const rows = await sql`
    SELECT
      bp.id, bp.slug, bp.title, bp.excerpt, bp.cover_image_url,
      bp.published_at, bp.meta_description, bp.tags,
      au.username AS author_username
    FROM blog_posts bp
    LEFT JOIN auth_users au ON au.id = bp.author_id
    WHERE bp.status = 'published'
      AND bp.slug != ${currentSlug}
      AND bp.tags[1] = ${category}
    ORDER BY bp.published_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ ...r, tags: r.tags || [] }));
}

export async function createPost(data) {
  const {
    slug, title, excerpt, body, cover_image_url,
    author_id, status = "draft", meta_description, tags = [],
  } = data;

  const [row] = await sql`
    INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, author_id, status, meta_description, tags)
    VALUES (${slug}, ${title}, ${excerpt}, ${body}, ${cover_image_url}, ${author_id}, ${status}, ${meta_description}, ${tags})
    RETURNING *
  `;
  return { ...row, tags: row.tags || [] };
}

export async function updatePost(id, data) {
  const {
    slug, title, excerpt, body, cover_image_url,
    status, meta_description, tags,
  } = data;

  const [row] = await sql`
    UPDATE blog_posts SET
      slug = COALESCE(${slug}, slug),
      title = COALESCE(${title}, title),
      excerpt = COALESCE(${excerpt}, excerpt),
      body = COALESCE(${body}, body),
      cover_image_url = COALESCE(${cover_image_url}, cover_image_url),
      status = COALESCE(${status}, status),
      meta_description = COALESCE(${meta_description}, meta_description),
      tags = COALESCE(${tags}, tags),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `;
  if (!row) return null;
  return { ...row, tags: row.tags || [] };
}

export async function deletePost(id) {
  const [row] = await sql`
    DELETE FROM blog_posts WHERE id = ${id} RETURNING id
  `;
  return row != null;
}

export async function slugExists(slug, excludeId = null) {
  if (excludeId) {
    const [row] = await sql`
      SELECT id FROM blog_posts WHERE slug = ${slug} AND id != ${excludeId}
    `;
    return row != null;
  }
  const [row] = await sql`
    SELECT id FROM blog_posts WHERE slug = ${slug}
  `;
  return row != null;
}
