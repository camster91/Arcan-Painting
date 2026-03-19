/**
 * POST /api/local-auth/login
 *
 * DEPRECATED: Password-based login is no longer supported.
 * Use /api/local-auth/request-code + /api/local-auth/verify-code instead.
 *
 * This endpoint now returns a 410 Gone response to guide old clients.
 */
export async function POST(request) {
  return Response.json(
    {
      error:
        "Password-based login is no longer supported. Please use the magic code flow: POST /api/local-auth/request-code then POST /api/local-auth/verify-code.",
      upgrade_required: true,
    },
    { status: 410 }
  );
}
