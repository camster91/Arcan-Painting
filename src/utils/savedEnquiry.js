// The API confirms the lead and durable CRM notification before returning this contract.
export function isSavedEnquiry(result) {
  return result?.success === true && result?.lead_saved === true &&
    /^(?:[1-9]\d*)$/.test(String(result?.lead_id ?? ""));
}
