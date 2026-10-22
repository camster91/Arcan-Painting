// The API confirms the lead and durable CRM notification before returning this contract.
export function isSavedEnquiry(result) {
  const id = result?.lead_id;
  const validId = (typeof id === "number" && Number.isSafeInteger(id) && id > 0) ||
    (typeof id === "string" && /^[1-9]\d*$/.test(id));
  return result?.success === true && result?.lead_saved === true &&
    validId;
}
