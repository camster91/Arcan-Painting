import { getCurrentUser } from "@/app/api/utils/auth";

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Me error:", error);
    return Response.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
