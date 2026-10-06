// Native dialogs make the background inert; wrap Tab at the content edges so
// keyboard users keep a predictable focus cycle within the active dialog.
export function containDialogFocus(event) {
  if (event.key !== "Tab") return;
  event.stopPropagation();
  const dialog = event.currentTarget;
  const controls = Array.from(dialog.querySelectorAll(
    'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex], [contenteditable="true"]',
  )).filter((element) =>
    element.closest("dialog") === dialog &&
    !element.matches(":disabled, [hidden], [aria-hidden='true']") &&
    element.tabIndex >= 0 && element.getClientRects().length > 0,
  );
  const first = controls[0];
  const last = controls[controls.length - 1];
  const active = document.activeElement;
  if (!first) {
    event.preventDefault();
    dialog.focus();
  } else if (event.shiftKey && (active === first || active === dialog)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || active === dialog)) {
    event.preventDefault();
    first.focus();
  }
}
