/**
 * Lead Scoring Utility for Arcan Painting
 * Calculates a priority score (0-100) locally to save tokens.
 */

export function calculateLeadScore(lead) {
  let score = 0;

  // 1. Service Type (High value services get more points)
  const service = (lead.service_type || lead.serviceType || "").toLowerCase();
  if (service.includes("cabinet")) score += 40;
  else if (service.includes("exterior")) score += 30;
  else if (service.includes("commercial")) score += 35;
  else if (service.includes("interior")) score += 20;
  else score += 10;

  // 2. Location (High value areas in GTA)
  const location = (lead.location || lead.city || "").toLowerCase();
  const highValueAreas = ["oakville", "burlington", "mississauga", "toronto", "vaughan", "markham"];
  if (highValueAreas.some(area => location.includes(area))) {
    score += 25;
  } else {
    score += 10;
  }

  // 3. Property Type
  const property = (lead.property_type || lead.propertyType || "").toLowerCase();
  if (property.includes("commercial")) score += 20;
  else if (property.includes("residential")) score += 10;

  // 4. Budget / Project Size (if available)
  if (lead.estimated_value > 5000) score += 15;
  else if (lead.estimated_value > 2000) score += 5;

  // Cap at 100
  return Math.min(score, 100);
}

export function getLeadPriority(score) {
  if (score >= 80) return { label: "Critical", color: "text-red-600 bg-red-50" };
  if (score >= 60) return { label: "High", color: "text-orange-600 bg-orange-50" };
  if (score >= 40) return { label: "Medium", color: "text-blue-600 bg-blue-50" };
  return { label: "Low", color: "text-gray-600 bg-gray-50" };
}
