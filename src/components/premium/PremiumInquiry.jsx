import { useEffect, useId, useRef, useState } from "react";
import { getAttribution, trackEvent } from "@/utils/analytics";

const SERVICES = [
  ["interior", "Premium Painting"],
  ["exterior", "Exterior Painting"],
  ["wallpaper", "High-end Wallpaper"],
  ["specialty", "Luxury Finishes"],
  ["commercial", "Commercial Interiors"],
  ["other", "A combination / To be discussed"],
];

function createSubmissionId() {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
  if (typeof cryptoApi?.getRandomValues !== "function") return "";
  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function PremiumInquiry({ initialService = "interior" }) {
  const id = useId();
  const [service, setService] = useState(initialService);
  const [preferredContact, setPreferredContact] = useState("email");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const submissionId = useRef("");
  const errorRef = useRef(null);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function submit(event) {
    event.preventDefault();
    if (submitting.current || !event.currentTarget.reportValidity()) return;
    submitting.current = true;
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const text = (key) => String(data.get(key) || "").trim();
    if (!submissionId.current) submissionId.current = createSubmissionId();
    const payload = {
      ...(submissionId.current ? { submissionId: submissionId.current } : {}),
      name: text("name"),
      email: text("email"),
      phone: text("phone"),
      serviceType: service,
      preferredContact,
      address: text("address"),
      projectDescription: [
        `Project scope: ${text("scope")}`,
        `Preferred timing: ${text("timing") || "To be discussed"}`,
        `Approximate budget (CAD): ${text("budget") || "To be discussed"}`,
        "",
        text("projectDescription"),
      ].join("\n"),
      attribution: getAttribution(),
    };
    let response;
    let result;
    try {
      response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      result = await response.json().catch(() => null);
      if (
        !response.ok ||
        result?.success !== true ||
        result?.lead_saved !== true
      ) {
        if (response.status === 409) submissionId.current = "";
        const message = response.status === 503
          ? "We couldn’t confirm whether your enquiry was saved. Please wait a moment before trying again, or contact us directly."
          : result?.error || "We couldn’t save your enquiry. Please check the details and try again.";
        throw new Error(message);
      }
      // Analytics contains categories only; contact details never enter events or URLs.
      try {
        trackEvent("lead_submit_success", {
          source: "premium_inquiry",
          service_type: service,
          preferred_contact: preferredContact,
        });
      } catch {
        /* Analytics must not interrupt a saved enquiry. */
      }
      globalThis.location.assign("/thank-you");
    } catch (submissionError) {
      try {
        trackEvent("lead_submit_error", {
          source: "premium_inquiry",
          service_type: service,
        });
      } catch {
        /* Optional analytics. */
      }
      setError(submissionError instanceof Error
        ? submissionError.message
        : "We couldn’t confirm whether your enquiry was saved. Please wait a moment before trying again, or contact us directly.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form
      className="p-form"
      id={`${id}-inquiry`}
      action="/api/contact"
      method="post"
      onSubmit={submit}
      aria-busy={pending}
    >
      <div className="p-fields">
        <label className="p-field" htmlFor={`${id}-name`}>
          Your name
          <input
            id={`${id}-name`}
            name="name"
            autoComplete="name"
            maxLength={255}
            required
          />
        </label>
        <label className="p-field" htmlFor={`${id}-service`}>
          Service
          <select
            id={`${id}-service`}
            name="serviceType"
            value={service}
            onChange={(event) => setService(event.target.value)}
          >
            {SERVICES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="p-field" htmlFor={`${id}-preference`}>
        How would you prefer us to respond?
        <select
          id={`${id}-preference`}
          name="preferredContact"
          value={preferredContact}
          onChange={(event) => setPreferredContact(event.target.value)}
        >
          <option value="email">Email</option>
          <option value="phone">Phone call</option>
        </select>
      </label>
      <div className="p-fields">
        <label className="p-field" htmlFor={`${id}-email`}>
          Email address{preferredContact !== "email" && " (optional)"}
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            maxLength={255}
            required={preferredContact === "email"}
          />
        </label>
        <label className="p-field" htmlFor={`${id}-phone`}>
          Phone number{preferredContact !== "phone" && " (optional)"}
          <input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            minLength={7}
            maxLength={50}
            pattern={"[0-9\\s\\(\\)\\+\\-]+"}
            required={preferredContact === "phone"}
          />
        </label>
      </div>
      <label className="p-field" htmlFor={`${id}-address`}>
        Project location
        <input
          id={`${id}-address`}
          name="address"
          autoComplete="address-level2"
          maxLength={255}
          placeholder="Town or city"
          required
        />
      </label>
      <div className="p-fields">
        <label className="p-field" htmlFor={`${id}-scope`}>
          Project scope
          <select id={`${id}-scope`} name="scope">
            <option>Complete residence</option>
            <option>Multi-room renovation</option>
            <option>Commercial / hospitality</option>
            <option>Specialist wall finishes</option>
            <option>Other / To be discussed</option>
          </select>
        </label>
        <label className="p-field" htmlFor={`${id}-timing`}>
          Preferred estimate date / timing (optional)
          <input
            id={`${id}-timing`}
            name="timing"
            maxLength={120}
            placeholder="When would you prefer an estimate?"
          />
        </label>
      </div>
      <label className="p-field" htmlFor={`${id}-budget`}>
        Approximate budget (optional)
        <input
          id={`${id}-budget`}
          name="budget"
          maxLength={120}
          placeholder="CAD — or to be discussed"
        />
      </label>
      <label className="p-field" htmlFor={`${id}-description`}>
        Tell us about your project
        <textarea
          id={`${id}-description`}
          name="projectDescription"
          rows={4}
          maxLength={3000}
          placeholder="Spaces, surfaces and finishes you have in mind"
          required
        />
      </label>
      {error && (
        <p className="p-error" role="alert" ref={errorRef} tabIndex={-1}>
          {error}
        </p>
      )}
      <p className="p-form-fallback">
        Prefer to reach us directly? <a href="mailto:info@arcanpainting.ca">Email info@arcanpainting.ca</a> or <a href="tel:+14167272148">call 416 727 2148</a>.
      </p>
      <p>
        By submitting, you agree that Arcan may contact you about this enquiry.{" "}
        <a href="/privacy">Privacy policy</a>.
      </p>
      <button className="p-button" type="submit" disabled={!ready || pending}>
        {pending ? "Sending your enquiry…" : "Send project enquiry"}
      </button>
      <noscript>
        <p>
          Please <a href="mailto:info@arcanpainting.ca">email Arcan</a> or call{" "}
          <a href="tel:+14167272148">416 727 2148</a> to discuss your project.
        </p>
      </noscript>
    </form>
  );
}
