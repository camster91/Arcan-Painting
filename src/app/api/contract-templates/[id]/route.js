import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return Response.json(
        { error: "Template ID is required" },
        { status: 400 },
      );
    }

    const template = await sql`
      SELECT * FROM contract_templates 
      WHERE id = ${parseInt(id)}
    `;

    if (template.length === 0) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    return Response.json(template[0]);
  } catch (error) {
    console.error("Error fetching contract template:", error);
    return Response.json(
      { error: "Failed to fetch template" },
      { status: 500 },
    );
  }
}
