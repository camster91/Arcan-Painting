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

export default function PremiumInquiry({ initialService = "interior" }) {
  const id = useId();
  const [service, setService] = useState(initialService);
  const [preferredContact, setPreferredContact] = useState("email");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
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
    const payload = {
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
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (
        !response.ok ||
        result?.success !== true ||
        result?.lead_saved === false
      ) {
        throw new Error(
          "We couldn’t save your enquiry. Please try again or contact us directly.",
        );
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
    } catch {
      try {
        trackEvent("lead_submit_error", {
          source: "premium_inquiry",
          service_type: service,
        });
      } catch {
        /* Optional analytics. */
      }
      setError(
        "We couldn’t save your enquiry. Your details are still here. Please try again or call 416 727 2148.",
      );
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
            placeholder="Your preferred start or completion date"
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
