/**
 * Fetch the customer-facing link for an estimate or invoice and copy it.
 * Returns a message for the page to show.
 */
export async function copyCustomerLink(kind, id) {
  const res = await fetch(`/api/${kind}/${id}/link`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) return data.error || "Could not create the customer link";
  try {
    await navigator.clipboard.writeText(data.url);
    return `Customer link copied: ${data.url}`;
  } catch {
    window.prompt("Copy the customer link:", data.url);
    return "Customer link ready";
  }
}
