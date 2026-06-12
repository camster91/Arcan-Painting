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

  const result = await sql`
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
  return result[0]?.id ?? null;
}
