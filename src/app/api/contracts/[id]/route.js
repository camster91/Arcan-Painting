import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// GET /api/contracts/[id] - Get contract details
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const [contract] = await sql`
      SELECT 
        c.*,
        l.name as client_name,
        l.email as client_email,
        l.phone as client_phone,
        l.address as client_address,
        e.estimate_number,
        e.project_description as estimate_description,
        p.project_name,
        p.status as project_status
      FROM contracts c
      LEFT JOIN leads l ON c.lead_id = l.id
      LEFT JOIN estimates e ON c.estimate_id = e.id
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.id = ${id}
    `;

    if (!contract) {
      return Response.json({ error: "Contract not found" }, { status: 404 });
    }

    return Response.json(contract);
  } catch (error) {
    console.error("Error fetching contract:", error);
    return Response.json(
      { error: "Failed to fetch contract" },
      { status: 500 },
    );
  }
}

// PUT /api/contracts/[id] - Update contract
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Check if contract exists
    const [existingContract] = await sql`
      SELECT id, status FROM contracts WHERE id = ${id}
    `;

    if (!existingContract) {
      return Response.json({ error: "Contract not found" }, { status: 404 });
    }

    // Prevent editing signed contracts
    if (
      existingContract.status === "signed" ||
      existingContract.status === "completed"
    ) {
      return Response.json(
        {
          error: "Cannot edit signed or completed contracts",
        },
        { status: 400 },
      );
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    const allowedFields = [
      "title",
      "description",
      "scope_of_work",
      "terms_and_conditions",
      "payment_terms",
      "warranty_terms",
      "total_amount",
      "deposit_percentage",
      "start_date",
      "completion_date",
      "estimated_duration_days",
      "notes",
      "status",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        paramCount++;
        updateFields.push(`${field} = $${paramCount}`);
        values.push(body[field]);
      }
    }

    // Recalculate deposit amount if total_amount or deposit_percentage changed
    if (
      body.total_amount !== undefined ||
      body.deposit_percentage !== undefined
    ) {
      const total = body.total_amount || existingContract.total_amount;
      const percentage =
        body.deposit_percentage || existingContract.deposit_percentage || 25;
      const deposit_amount = (parseFloat(total) * percentage) / 100;

      paramCount++;
      updateFields.push(`deposit_amount = $${paramCount}`);
      values.push(deposit_amount);
    }

    if (updateFields.length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Add updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    // Add WHERE clause
    paramCount++;
    values.push(id);

    const query = `
      UPDATE contracts 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const [updatedContract] = await sql(query, values);

    return Response.json(updatedContract);
  } catch (error) {
    console.error("Error updating contract:", error);
    return Response.json(
      { error: "Failed to update contract" },
      { status: 500 },
    );
  }
}

// DELETE /api/contracts/[id] - Delete contract
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check if contract exists and can be deleted
    const [contract] = await sql`
      SELECT id, status FROM contracts WHERE id = ${id}
    `;

    if (!contract) {
      return Response.json({ error: "Contract not found" }, { status: 404 });
    }

    // Prevent deleting signed or completed contracts
    if (contract.status === "signed" || contract.status === "completed") {
      return Response.json(
        {
          error: "Cannot delete signed or completed contracts",
        },
        { status: 400 },
      );
    }

    await sql`DELETE FROM contracts WHERE id = ${id}`;

    return Response.json({ message: "Contract deleted successfully" });
  } catch (error) {
    console.error("Error deleting contract:", error);
    return Response.json(
      { error: "Failed to delete contract" },
      { status: 500 },
    );
  }
}
