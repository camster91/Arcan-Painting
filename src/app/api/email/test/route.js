import { sendEmail } from "@/app/api/utils/send-email";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to, subject, message } = await request.json();

    if (!to || !subject || !message) {
      return Response.json(
        { error: "Missing required fields: to, subject, message" },
        { status: 400 },
      );
    }

    // Create HTML email content with updated styling
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">✅ Email Test Successful!</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Arcan Painting & Sons</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
          <h2 style="color: #1f2937; margin-top: 0;">Test Message</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #374151;">${message}</p>
          </div>
          
          <div style="margin: 20px 0; padding: 15px; background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px;">
            <strong style="color: #047857;">✓ Email system is working correctly!</strong>
            <p style="margin: 8px 0 0 0; color: #065f46;">
              This test email was sent at ${new Date().toLocaleString()} from your Painting CRM system.
            </p>
          </div>
          
          <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">System Information</h3>
            <ul style="margin: 0; color: #1e3a8a; font-size: 14px;">
              <li>From: info@arcanpainting.ca</li>
              <li>Email logging: Active</li>
              <li>Templates: Available</li>
              <li>Workflows: Configured</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d;">
            <p style="margin: 0;">
              <strong>System Details:</strong><br>
              Sent from: ${process.env.APP_URL || "Painting CRM"}<br>
              Email Provider: Resend<br>
              Test initiated by: ${session.user?.email || "Admin"}
            </p>
          </div>
        </div>
      </div>
    `;

    const text = `
Email Test Successful - Arcan Painting & Sons

Test Message:
${message}

✓ Email system is working correctly!

This test email was sent at ${new Date().toLocaleString()} from your Painting CRM system.

System Information:
- From: info@arcanpainting.ca
- Email logging: Active  
- Templates: Available
- Workflows: Configured

System Details:
Sent from: ${process.env.APP_URL || "Painting CRM"}
Email Provider: Resend
Test initiated by: ${session.user?.email || "Admin"}
    `;

    const result = await sendEmail({
      to,
      subject,
      html,
      text,
      templateName: "test_email",
      relatedType: "email_test",
      userId: session.user?.id,
      metadata: {
        test_type: "manual",
        admin_initiated: true,
        initiated_by: session.user?.email,
      },
    });

    return Response.json({
      success: true,
      message: "Test email sent successfully",
      details: {
        id: result.id,
        from: "info@arcanpainting.ca",
        to,
        subject,
        sent_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Test email failed:", error);
    return Response.json(
      {
        error: error.message || "Failed to send test email",
        details: error.toString(),
      },
      { status: 500 },
    );
  }
}
