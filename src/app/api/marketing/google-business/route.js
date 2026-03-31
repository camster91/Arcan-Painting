import { getCurrentUser } from "../../utils/auth.js";
import sql from "../../utils/sql.js";

// Helper: get valid Google access token with auto-refresh
async function getGoogleAccessToken() {
  const rows = await sql(
    `SELECT access_token, refresh_token, token_expiry FROM marketing_connections WHERE platform = 'google' AND is_active = true LIMIT 1`
  );
  if (!rows.length) return null;

  const { access_token, refresh_token, token_expiry } = rows[0];

  if (token_expiry && new Date(token_expiry) > new Date(Date.now() + 5 * 60 * 1000)) {
    return access_token;
  }

  if (!refresh_token) return null;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) return null;

    const tokens = await res.json();
    const newExpiry = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    await sql(
      `UPDATE marketing_connections SET access_token = $1, token_expiry = $2, updated_at = CURRENT_TIMESTAMP WHERE platform = 'google'`,
      [tokens.access_token, newExpiry]
    );

    return tokens.access_token;
  } catch (err) {
    console.error("[gbp] token refresh error:", err);
    return null;
  }
}

async function gbpRequest(method, url, token, body = null) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "GBP API error");
  }
  return data;
}

export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getGoogleAccessToken();
  if (!token) {
    return Response.json({ error: "Google not connected" }, { status: 400 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  try {
    // 1. List Accounts
    if (action === "listAccounts") {
      const data = await gbpRequest("GET", "https://mybusinessaccountmanagement.googleapis.com/v1/accounts", token);
      return Response.json(data);
    }

    // 2. List Locations for an account
    if (action === "listLocations") {
      const accountName = url.searchParams.get("accountName");
      if (!accountName) return Response.json({ error: "accountName required" }, { status: 400 });
      
      const data = await gbpRequest(
        "GET", 
        `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storeCode,metadata`, 
        token
      );
      return Response.json(data);
    }

    // 3. Get Reviews for a location
    if (action === "getReviews") {
      const locationName = url.searchParams.get("locationName");
      if (!locationName) return Response.json({ error: "locationName required" }, { status: 400 });

      const data = await gbpRequest(
        "GET",
        `https://mybusinessreviews.googleapis.com/v1/${locationName}/reviews`,
        token
      );
      return Response.json(data);
    }

    // 4. Get Insights (Performance)
    const formatDate = (d) => ({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate()
    });

    if (action === "getInsights") {
      const locationName = url.searchParams.get("locationName");
      if (!locationName) return Response.json({ error: "locationName required" }, { status: 400 });

      // Daily metrics
      // https://developers.google.com/my-business/reference/business-performance/rest/v1/locations/fetchMultiDailyMetricsTimeSeries
      const now = new Date();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      const data = await gbpRequest(
        "POST",
        `https://businessperformanceinsight.googleapis.com/v1/${locationName}:fetchMultiDailyMetricsTimeSeries`,
        token,
        {
          dailyMetrics: [
            "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
            "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
            "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
            "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
            "BUSINESS_CONVERSIONS_CALLS",
            "BUSINESS_CONVERSIONS_MESSAGES",
            "BUSINESS_CONVERSIONS_DIRECTIONS",
            "BUSINESS_CONVERSIONS_WEBSITE"
          ],
          dailyRange: {
            startDate: formatDate(sixtyDaysAgo),
            endDate: formatDate(now)
          }
        }
      );
      return Response.json(data);
    }

    // Default: Get summary if location is already connected
    const connRows = await sql`SELECT metadata FROM marketing_connections WHERE platform = 'google' AND is_active = true LIMIT 1`;
    const metadata = connRows[0]?.metadata || {};
    const locationName = metadata.gbp_location_name;

    if (!locationName) {
      return Response.json({ error: "No GBP location connected", code: "NO_LOCATION" });
    }

    // Fetch summary (reviews + insights)
    const [reviews, insights] = await Promise.all([
      gbpRequest("GET", `https://mybusinessreviews.googleapis.com/v1/${locationName}/reviews?pageSize=5`, token),
      gbpRequest("POST", `https://businessperformanceinsight.googleapis.com/v1/${locationName}:fetchMultiDailyMetricsTimeSeries`, token, {
        dailyMetrics: ["BUSINESS_IMPRESSIONS_MOBILE_SEARCH", "BUSINESS_CONVERSIONS_WEBSITE"],
        dailyRange: {
          startDate: formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
          endDate: formatDate(new Date())
        }
      }).catch(() => ({ multiDailyMetricTimeSeries: [] }))
    ]);

    return Response.json({ 
      locationName,
      reviews: reviews.reviews || [],
      insights: insights.multiDailyMetricTimeSeries || []
    });

  } catch (err) {
    console.error("[gbp] API error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getGoogleAccessToken();
  if (!token) return Response.json({ error: "Google not connected" }, { status: 400 });

  const body = await request.json();
  const { action, locationName, metadata } = body;

  try {
    // Connect a location
    if (action === "connectLocation") {
      if (!locationName) return Response.json({ error: "locationName required" }, { status: 400 });
      
      await sql(
        `UPDATE marketing_connections 
         SET metadata = metadata || $1::jsonb, updated_at = CURRENT_TIMESTAMP 
         WHERE platform = 'google'`,
        [JSON.stringify({ gbp_location_name: locationName, gbp_metadata: metadata })]
      );
      return Response.json({ success: true });
    }

    // Create a Local Post
    if (action === "createPost") {
      const { text, mediaUrl, callToAction } = body;
      if (!locationName) return Response.json({ error: "locationName required" }, { status: 400 });
      
      const postBody = {
        languageCode: "en-US",
        summary: text,
        topicType: "STANDARD",
      };

      if (callToAction) {
        postBody.callToAction = {
          actionType: callToAction.type || "LEARN_MORE",
          url: callToAction.url || "https://arcanpainting.ca"
        };
      }

      if (mediaUrl) {
        postBody.media = [{
          mediaFormat: "PHOTO",
          sourceUrl: mediaUrl
        }];
      }

      const data = await gbpRequest(
        "POST",
        `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}/localPosts`,
        token,
        postBody
      );
      return Response.json(data);
    }

    // Reply to Review
    if (action === "replyReview") {
      const { reviewName, replyText } = body;
      if (!reviewName || !replyText) return Response.json({ error: "reviewName and replyText required" }, { status: 400 });

      const data = await gbpRequest(
        "PUT",
        `https://mybusinessreviews.googleapis.com/v1/${reviewName}/reply`,
        token,
        { comment: replyText }
      );
      return Response.json(data);
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[gbp] POST error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
