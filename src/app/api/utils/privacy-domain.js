export const RETENTION_POLICY = Object.freeze({
  financial_and_signed_contract_years: 7,
  inactive_lead_years: 2,
  audit_log_years: 2,
  expired_portal_token_days: 30,
});

export function anonymizationConfirmation(leadId) {
  return `ANONYMIZE ${Number(leadId)}`;
}

export function privacyHoldReason(facts = {}) {
  if (Number(facts.unsettled_invoices || 0) > 0) return "Customer has an unsettled invoice";
  if (Number(facts.active_projects || 0) > 0) return "Customer has an active project";
  if (Number(facts.signed_contracts || 0) > 0 || Number(facts.financial_records || 0) > 0) {
    return `Legal and financial records must be retained for ${RETENTION_POLICY.financial_and_signed_contract_years} years`;
  }
  return null;
}
