import sql from "@/app/api/utils/sql";
import { sendEmail } from "@/app/api/utils/send-email";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    // Filter by read status
    if (status === "read") {
      whereConditions.push("is_read = true");
    } else if (status === "unread") {
      whereConditions.push("is_read = false");
    }

    // Search in title, message, and email
    if (search && search.trim()) {
      paramCount++;
      whereConditions.push(`(
        LOWER(title) LIKE LOWER($${paramCount}) OR 
        LOWER(message) LIKE LOWER($${paramCount}) OR 
        LOWER(email) LIKE LOWER($${paramCount})
      )`);
      params.push(`%${search.trim()}%`);
    }

    // Date range filters
    if (startDate) {
      paramCount++;
      whereConditions.push(`created_at >= $${paramCount}`);
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereConditions.push(`created_at <= $${paramCount}`);
      params.push(endDate);
    }

    const whereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    const notifications = await sql(
      `
      SELECT 
        id,
        type,
        title as subject,
        message,
        email as to_email,
        is_read as read,
        created_at as sent_at,
        'sent' as status
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 100
    `,
      params,
    );

    return Response.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return Response.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      type,
      title,
      message,
      user_id,
      email,
      related_id,
      related_type,
      send_email = false,
      data = {},
    } = body;

    if (!type || !title || !message) {
      return Response.json(
        {
          error: "Type, title, and message are required",
        },
        { status: 400 },
      );
    }

    // Create notification record
    const notification = await sql`
      INSERT INTO notifications (
        type, title, message, user_id, email, related_id, related_type, 
        is_read, send_email, data, created_at
      ) VALUES (
        ${type}, ${title}, ${message}, ${user_id}, ${email}, ${related_id}, 
        ${related_type}, false, ${send_email}, ${JSON.stringify(data)}, 
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    // Send email if requested
    if (send_email && email) {
      try {
        await sendEmail({
          to: email,
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Arcan Painting & Sons</h1>
              </div>
              <div style="padding: 20px; background: #ffffff;">
                <h2 style="color: #334155; margin-bottom: 16px;">${title}</h2>
                <div style="color: #475569; line-height: 1.6;">
                  ${message.replace(/\n/g, "<br>")}
                </div>
                ${
                  data.action_url
                    ? `
                  <div style="margin-top: 24px; text-align: center;">
                    <a href="${data.action_url}" 
                       style="background: #f59e0b; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                      ${data.action_text || "View Details"}
                    </a>
                  </div>
                `
                    : ""
                }
              </div>
              <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 14px; color: #64748b;">
                <p>Thank you for choosing Arcan Painting & Sons</p>
                <p>If you have any questions, please contact us at info@arcanpainting.com</p>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Error sending notification email:", emailError);
        // Don't fail the notification creation if email fails
      }
    }

    return Response.json({ notification: notification[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return Response.json(
      { error: "Failed to create notification" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, is_read } = body;

    if (!id) {
      return Response.json(
        { error: "Notification ID is required" },
        { status: 400 },
      );
    }

    const result = await sql`
      UPDATE notifications 
      SET is_read = ${is_read}, read_at = ${is_read ? "CURRENT_TIMESTAMP" : null}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    return Response.json({ notification: result[0] });
  } catch (error) {
    console.error("Error updating notification:", error);
    return Response.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}

// Helper function to send automated notifications based on business events
export async function sendAutomatedNotification(eventType, data) {
  try {
    const notifications = [];

    switch (eventType) {
      case "new_lead":
        notifications.push({
          type: "new_lead",
          title: "New Lead Received",
          message: `New inquiry from ${data.name} for ${data.service_type}`,
          email: data.admin_email,
          related_id: data.lead_id,
          related_type: "lead",
          send_email: true,
          data: {
            action_url: `${process.env.APP_URL}/admin/leads`,
            action_text: "View Lead",
          },
        });
        break;

      case "appointment_scheduled":
        notifications.push({
          type: "appointment",
          title: "Appointment Scheduled",
          message: `Your appointment for ${data.service_type} has been scheduled for ${data.appointment_date}`,
          email: data.customer_email,
          related_id: data.appointment_id,
          related_type: "appointment",
          send_email: true,
          data: {
            action_url: `${process.env.APP_URL}/appointment-confirmation`,
            action_text: "View Appointment",
          },
        });
        break;

      case "estimate_ready":
        notifications.push({
          type: "estimate",
          title: "Your Estimate is Ready",
          message: `We've prepared your estimate for ${data.project_title}. Total: $${data.total_cost}`,
          email: data.customer_email,
          related_id: data.estimate_id,
          related_type: "estimate",
          send_email: true,
          data: {
            action_url: `${process.env.APP_URL}/estimate/${data.estimate_number}`,
            action_text: "View Estimate",
          },
        });
        break;

      case "project_started":
        notifications.push({
          type: "project",
          title: "Project Started",
          message: `Your painting project "${data.project_name}" has begun. Our team will keep you updated on progress.`,
          email: data.customer_email,
          related_id: data.project_id,
          related_type: "project",
          send_email: true,
        });
        break;

      case "project_completed":
        notifications.push({
          type: "project",
          title: "Project Completed",
          message: `Your painting project "${data.project_name}" has been completed! Please let us know if you have any questions.`,
          email: data.customer_email,
          related_id: data.project_id,
          related_type: "project",
          send_email: true,
          data: {
            action_url: `${process.env.APP_URL}/feedback/${data.project_id}`,
            action_text: "Leave Feedback",
          },
        });
        break;

      case "invoice_sent":
        notifications.push({
          type: "invoice",
          title: "Invoice Sent",
          message: `Invoice #${data.invoice_number} for $${data.total_amount} has been sent to ${data.customer_email}`,
          email: data.admin_email,
          related_id: data.invoice_id,
          related_type: "invoice",
          send_email: false,
        });
        break;

      case "payment_received":
        notifications.push({
          type: "payment",
          title: "Payment Received",
          message: `Payment of $${data.amount} received for invoice #${data.invoice_number}`,
          email: data.admin_email,
          related_id: data.payment_id,
          related_type: "payment",
          send_email: true,
        });
        break;

      case "task_reminder":
        notifications.push({
          type: "task",
          title: "Task Reminder",
          message: `Task "${data.task_title}" is due ${data.due_date}`,
          email: data.assignee_email,
          related_id: data.task_id,
          related_type: "task",
          send_email: true,
          data: {
            action_url: `${process.env.APP_URL}/admin/tasks`,
            action_text: "View Tasks",
          },
        });
        break;

      default:
        console.warn(`Unknown notification event type: ${eventType}`);
        return [];
    }

    // Send each notification
    for (const notification of notifications) {
      await fetch(`${process.env.APP_URL}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notification),
      });
    }

    return notifications;
  } catch (error) {
    console.error("Error sending automated notification:", error);
    throw error;
  }
}
