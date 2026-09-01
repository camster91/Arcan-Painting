import sql from "@/app/api/utils/sql";
import { getCurrentUser, unauthorizedResponse } from "@/app/api/utils/auth";

export function calculatePeriodChange(current, previous) {
  const currentValue = Number(current) || 0;
  const previousValue = Number(previous) || 0;
  if (previousValue === 0) return currentValue === 0 ? 0 : null;
  return Math.round(((currentValue - previousValue) / previousValue) * 100);
}

export async function GET(request) {
  try {
    // Auth check
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Get query parameters for date range
    const url = new URL(request.url);
    const range = url.searchParams.get("range") || "30"; // default 30 days

    const requestedDays = parseInt(range, 10);
    const daysAgo = [7, 30, 90, 365].includes(requestedDays) ? requestedDays : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    const startDateString = startDate.toISOString();
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysAgo);
    const previousStartDateString = previousStartDate.toISOString();

    // Aggregate metrics from multiple tables
    const [
      leadsStats,
      projectsStats,
      estimatesStats,
      appointmentsStats,
      paymentsStats,
      recentActivities,
      todaysTasks,
    ] = await Promise.all([
      // Leads metrics
      sql`
        SELECT 
          COUNT(*) as total_leads,
          COUNT(CASE WHEN created_at >= ${startDateString} THEN 1 END) as new_leads,
          COUNT(CASE WHEN created_at >= ${previousStartDateString} AND created_at < ${startDateString} THEN 1 END) as previous_new_leads,
          COUNT(CASE WHEN status = 'new' OR status = 'contacted' OR status = 'estimate_scheduled' THEN 1 END) as active_leads,
          COUNT(CASE WHEN status = 'won' THEN 1 END) as won_leads,
          AVG(estimated_value) as avg_lead_value
        FROM leads
      `,

      // Projects metrics
      sql`
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status = 'in_progress' OR status = 'scheduled' THEN 1 END) as active_projects,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
          COUNT(CASE WHEN status = 'completed' AND end_date >= ${startDateString} THEN 1 END) as recently_completed,
          COUNT(CASE WHEN created_at >= ${startDateString} THEN 1 END) as new_projects,
          COUNT(CASE WHEN created_at >= ${previousStartDateString} AND created_at < ${startDateString} THEN 1 END) as previous_new_projects,
          SUM(CASE WHEN status = 'completed' THEN final_cost ELSE 0 END) as total_revenue,
          SUM(CASE WHEN status = 'completed' AND end_date >= ${startDateString} THEN final_cost ELSE 0 END) as recent_revenue
        FROM projects
      `,

      // Estimates metrics
      sql`
        SELECT 
          COUNT(*) as total_estimates,
          COUNT(CASE WHEN status = 'sent' OR status = 'draft' THEN 1 END) as pending_estimates,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_estimates,
          COUNT(CASE WHEN created_at >= ${startDateString} THEN 1 END) as new_estimates,
          COUNT(CASE WHEN created_at >= ${previousStartDateString} AND created_at < ${startDateString} THEN 1 END) as previous_new_estimates,
          AVG(total_cost) as avg_estimate_value
        FROM estimates
      `,

      // Appointments metrics - simplified to avoid JOIN issues
      sql`
        SELECT 
          COUNT(*) as total_appointments,
          COUNT(CASE WHEN created_at >= ${startDateString} THEN 1 END) as new_appointments
        FROM appointments
        WHERE status = 'booked'
      `,

      // Collected cash is the authoritative revenue measure for this dashboard.
      sql`
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE status = 'cleared' AND payment_date >= ${startDateString}), 0) AS collected_revenue,
          COALESCE(SUM(amount) FILTER (WHERE status = 'cleared' AND payment_date >= ${previousStartDateString} AND payment_date < ${startDateString}), 0) AS previous_collected_revenue
        FROM payments
      `,

      // Recent activities
      sql`
        SELECT 
          'lead' as type,
          l.id,
          l.name as title,
          CONCAT('New ', l.service_type, ' inquiry') as description,
          l.created_at
        FROM leads l
        WHERE l.created_at >= ${startDateString}
        ORDER BY l.created_at DESC
        LIMIT 5
      `,

      // Today's tasks (from internal_tasks table)
      sql`
        SELECT 
          id,
          title,
          description,
          priority,
          (status = 'completed') as completed
        FROM internal_tasks
        WHERE (due_date = CURRENT_DATE OR due_date IS NULL)
        AND status != 'completed'
        ORDER BY 
          CASE priority 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            WHEN 'low' THEN 3 
            ELSE 4 
          END,
          created_at ASC
        LIMIT 5
      `,
    ]);



    // Extract values with proper null handling
    const activeLeads = parseInt(leadsStats[0]?.active_leads) || 0;
    const pendingEstimates =
      parseInt(estimatesStats[0]?.pending_estimates) || 0;
    const activeProjects = parseInt(projectsStats[0]?.active_projects) || 0;
    const monthlyRevenue = parseFloat(paymentsStats[0]?.collected_revenue) || 0;

    // Build response that matches component expectations
    const response = {
      stats: {
        activeLeads,
        pendingEstimates,
        activeProjects,
        monthlyRevenue,
        leadsChange: calculatePeriodChange(leadsStats[0]?.new_leads, leadsStats[0]?.previous_new_leads),
        estimatesChange: calculatePeriodChange(estimatesStats[0]?.new_estimates, estimatesStats[0]?.previous_new_estimates),
        projectsChange: calculatePeriodChange(projectsStats[0]?.new_projects, projectsStats[0]?.previous_new_projects),
        revenueChange: calculatePeriodChange(monthlyRevenue, paymentsStats[0]?.previous_collected_revenue),
        comparisonDays: daysAgo,
        // Today's tasks with proper null handling
        todaysTasks: (todaysTasks || []).map((task) => ({
          id: task.id,
          title: task.title || "Untitled Task",
          description: task.description || "No description",
          priority: task.priority || "medium",
          completed: Boolean(task.completed),
        })),
      },
      recentActivity: (recentActivities || []).map((activity) => ({
        id: activity.id,
        type: activity.type,
        title: `New lead: ${activity.title}`,
        description: activity.description || "No description",
        createdAt: activity.created_at,
      })),
    };



    return Response.json(response);
  } catch (error) {
    console.error("Dashboard API error:", error);
    console.error("Error stack:", error.stack);
    return Response.json(
      {
        error: "Failed to fetch dashboard data",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
