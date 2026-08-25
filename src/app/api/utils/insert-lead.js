/**
 * Shared lead insertion helper. Used by:
 *   - /api/contact       (public contact form, no session)
 *   - /api/lead-webhook/meta (Meta Lead Ads webhook, no session)
 *
 * Both paths previously went through /api/leads (with no auth and no CSRF),
 * which was a security hole — a public endpoint with no auth was the
 * only path to write to the leads table. Now /api/leads POST requires
 * an admin session + CSRF, and these two public paths insert directly
 * via SQL.
 *
 * Field shape matches the /api/leads INSERT so the admin lead table
 * looks identical regardless of source.
 */
import sql from "./sql.js";

const PUBLIC_LEAD_FIELD_LIMITS = {
  name: 255,
  email: 255,
  phone: 50,
  serviceType: 100,
  projectDescription: 4_000,
  address: 2_000,
};

export function validateLeadInput({
  name,
  email,
  phone,
  serviceType,
  service_type,
  projectDescription,
  project_description,
  address,
}) {
  const fields = [
    ["Name", name, PUBLIC_LEAD_FIELD_LIMITS.name],
    ["Email", email, PUBLIC_LEAD_FIELD_LIMITS.email],
    ["Phone", phone, PUBLIC_LEAD_FIELD_LIMITS.phone],
    ["Service type", serviceType ?? service_type, PUBLIC_LEAD_FIELD_LIMITS.serviceType],
    ["Project description", projectDescription ?? project_description, PUBLIC_LEAD_FIELD_LIMITS.projectDescription],
    ["Address", address, PUBLIC_LEAD_FIELD_LIMITS.address],
  ];

  for (const [label, value, limit] of fields) {
    if (value == null || value === "") continue;
    if (typeof value !== "string") return `${label} must be text`;
    if (value.length > limit) return `${label} must be ${limit} characters or fewer`;
  }

  return null;
}

export async function insertLead({
  name,
  email,
  phone,
  serviceType,
  service_type,
  projectDescription,
  project_description,
  preferredContact,
  preferred_contact,
  address,
  leadSource,
  lead_source,
  metaLeadId,
  meta_lead_id,
}) {
  const validationError = validateLeadInput({
    name,
    email,
    phone,
    serviceType,
    service_type,
    projectDescription,
    project_description,
    address,
  });
  if (validationError) throw new Error(validationError);

  // Allow camelCase or snake_case, but the route callers are responsible
  // for passing one or the other.
  const _name = (name || "").trim();
  const _email = (email || "").trim();
  const _phone = (phone || "").trim();
  const _serviceType = serviceType || service_type;
  const _projectDescription = projectDescription ?? project_description ?? null;
  const _preferredContact = preferredContact || preferred_contact || (_email ? "email" : "phone");
  const _address = address || null;
  const _leadSource = leadSource || lead_source || "website";
  const _metaLeadId = metaLeadId || meta_lead_id || null;

  if (!_name) {
    throw new Error("name is required");
  }
  if (!_email && !_phone) {
    throw new Error("Either email or phone is required");
  }

  return sql.transaction(async (tx) => {
    const result = await tx`
      INSERT INTO leads (
        name, email, phone, service_type, project_description,
        preferred_contact, address, status, lead_source, meta_lead_id
      ) VALUES (
        ${_name},
        ${_email},
        ${_phone},
        ${_serviceType},
        ${_projectDescription},
        ${_preferredContact},
        ${_address},
        'new',
        ${_leadSource},
        ${_metaLeadId}
      )
      RETURNING id
    `;
    const leadId = result[0]?.id ?? null;
    if (!leadId) return null;

    // This is the durable CRM signal for a new inquiry. External email and
    // Telegram delivery are optional integrations, so they must not be the
    // sole way the business learns about a saved lead.
    await tx`
      INSERT INTO notifications (
        type, title, message, email, related_id, related_type,
        is_read, send_email, data, created_at
      ) VALUES (
        'new_lead',
        'New lead received',
        ${`${_name} requested ${_serviceType || "a painting estimate"}.`},
        ${_email || null},
        ${leadId},
        'lead',
        false,
        false,
        ${JSON.stringify({ source: _leadSource })}::jsonb,
        CURRENT_TIMESTAMP
      )
    `;

    return leadId;
  });
}
