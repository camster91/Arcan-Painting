import { useState, useMemo, useCallback } from "react";
import {
  Mail,
  Phone,
  Send,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTheme } from "@/utils/useTheme";

export default function ContactSection() {
  useTheme();

  // Quiz-style state
  const [step, setStep] = useState(0);
  const [serviceType, setServiceType] = useState("");
  const [fullName, setFullName] = useState("");
  const [preferredContact, setPreferredContact] = useState(""); // "phone" | "email"
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectDescription, setProjectDescription] = useState(""); // optional at end
  const [error, setError] = useState(null);

  // Derived values for UI
  const stepsTotal = useMemo(() => 5, []); // 0..4
  const progressPercent = useMemo(
    () => Math.round(((step + 1) / stepsTotal) * 100),
    [step, stepsTotal],
  );

  // Simple validators
  const isEmailValid = useCallback(
    (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    [],
  );
  const isPhoneValid = useCallback(
    (value) => /^[\d\s()+-]+$/.test(value),
    [],
  );

  const canGoNext = useMemo(() => {
    if (step === 0) return !!serviceType;
    if (step === 1) return fullName.trim().length > 1;
    if (step === 2)
      return preferredContact === "phone" || preferredContact === "email";
    if (step === 3) {
      if (preferredContact === "email") return isEmailValid(email);
      if (preferredContact === "phone")
        return isPhoneValid(phone) && phone.trim().length >= 7;
      return false;
    }
    if (step === 4) return true; // optional notes
    return false;
  }, [
    step,
    serviceType,
    fullName,
    preferredContact,
    email,
    phone,
    isEmailValid,
    isPhoneValid,
  ]);

  // Allow optional force to skip validation when user taps a choice button
  const next = useCallback(
    (force = false) => {
      setError(null);
      if (!force && !canGoNext) return;
      setStep((s) => Math.min(s + 1, stepsTotal - 1));
    },
    [canGoNext, stepsTotal],
  );

  const back = useCallback(() => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  // Submission via react-query
  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: fullName,
        email: preferredContact === "email" ? email : "",
        phone: preferredContact === "phone" ? phone : "",
        serviceType,
        projectDescription,
        preferredContact,
      };
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Failed to submit");
      }
      return { result, payload };
    },
    onSuccess: ({ payload }) => {
      const params = new URLSearchParams({
        name: payload.name || "",
        email: payload.email || "",
        phone: payload.phone || "",
        serviceType: payload.serviceType || "",
      });
      if (typeof window !== "undefined") {
        window.location.href = `/thank-you?${params.toString()}`;
      }
    },
    onError: (e) => {
      console.error(e);
      setError(e?.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault?.();
      setError(null);
      submitMutation.mutate();
    },
    [submitMutation],
  );

  // Reusable button styles - simplified for light mode only
  const optionBtn =
    "min-h-[48px] px-4 py-3 rounded-sm border transition-colors text-sm sm:text-base font-medium";
  const optionBtnActive = "border-ink bg-ink text-paper";
  const optionBtnIdle =
    "border-line bg-white text-ink-soft hover:border-ink hover:text-ink";

  // QUIZ CONTENT by step
  let stepTitle = "";
  let stepBody = null;

  if (step === 0) {
    stepTitle = "What do you need painted?";
    const options = [
      { key: "interior", label: "Interior" },
      { key: "exterior", label: "Exterior" },
      { key: "commercial", label: "Commercial" },
      { key: "specialty", label: "Specialty Finishes" },
      { key: "consultation", label: "Color Consultation" },
      { key: "other", label: "Other" },
    ];
    stepBody = (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="group" aria-label="Service type selection">
        {options.map((opt) => {
          const isActive = serviceType === opt.key;
          const cls = isActive
            ? `${optionBtn} ${optionBtnActive}`
            : `${optionBtn} ${optionBtnIdle}`;
          return (
            <button
              type="button"
              key={opt.key}
              aria-pressed={isActive}
              onClick={() => {
                setServiceType(opt.key);
                next(true); // auto-advance on selection
              }}
              className={`${cls} text-center min-h-[48px] flex items-center justify-center`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  } else if (step === 1) {
    stepTitle = "What's your name?";
    stepBody = (
      <div>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && fullName.trim().length > 1) {
              next();
            }
          }}
          className="w-full px-4 py-3 border border-line rounded-sm focus:ring-2 focus:ring-ink focus:border-transparent bg-white text-ink transition-all duration-150 text-base"
          placeholder="Full name"
          aria-label="Full name"
          name="name"
          id="contact-name"
          autoComplete="name"
        />
      </div>
    );
  } else if (step === 2) {
    stepTitle = "How should we contact you?";
    stepBody = (
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setPreferredContact("phone");
            next(true); // auto-advance
          }}
          className={`${optionBtn} ${preferredContact === "phone" ? optionBtnActive : optionBtnIdle}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Phone size={18} />
            <span>Phone</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => {
            setPreferredContact("email");
            next(true); // auto-advance
          }}
          className={`${optionBtn} ${preferredContact === "email" ? optionBtnActive : optionBtnIdle}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Mail size={18} />
            <span>Email</span>
          </div>
        </button>
      </div>
    );
  } else if (step === 3) {
    stepTitle =
      preferredContact === "email"
        ? "What's your email?"
        : "What's your phone number?";
    const inputProps =
      preferredContact === "email"
        ? {
            type: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            placeholder: "you@email.com",
            ariaLabel: "Email",
            isValid: isEmailValid(email),
            name: "email",
            id: "contact-email",
            autoComplete: "email",
            inputMode: undefined,
          }
        : {
            type: "tel",
            value: phone,
            onChange: (e) => setPhone(e.target.value),
            placeholder: "(555) 123-4567",
            ariaLabel: "Phone",
            isValid: isPhoneValid(phone) && phone.trim().length >= 7,
            name: "tel",
            id: "contact-tel",
            autoComplete: "tel",
            inputMode: "tel",
          };
    stepBody = (
      <div>
        <input
          type={inputProps.type}
          value={inputProps.value}
          onChange={inputProps.onChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && inputProps.isValid) {
              next();
            }
          }}
          className="w-full px-4 py-3 border border-line rounded-sm focus:ring-2 focus:ring-ink focus:border-transparent bg-white text-ink transition-all duration-150 text-base"
          placeholder={inputProps.placeholder}
          aria-label={inputProps.ariaLabel}
          name={inputProps.name}
          id={inputProps.id}
          autoComplete={inputProps.autoComplete}
          inputMode={inputProps.inputMode}
        />
        <p className="text-xs text-muted mt-2">
          We only need one contact method.
        </p>
      </div>
    );
  } else if (step === 4) {
    stepTitle = "Anything else we should know? (optional)";
    stepBody = (
      <div>
        <textarea
          rows={4}
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          className="w-full px-4 py-3 border border-line rounded-sm focus:ring-2 focus:ring-ink focus:border-transparent bg-white text-ink transition-all duration-150 text-base resize-none"
          placeholder="Tell us about your project, size, timing, or any special requests..."
        />
        <div className="flex items-center gap-2 text-ink-soft bg-paper border border-line rounded-sm p-3 mt-3 text-sm">
          <CheckCircle2 size={18} />
          <span>Your details are used to respond to this request. See our <a href="/privacy" className="underline font-medium">Privacy Notice</a>.</span>
        </div>
      </div>
    );
  }

  return (
    <section id="contact" className="border-t border-line bg-paper">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-20 sm:px-6 md:px-10 lg:grid-cols-12 lg:gap-16 lg:py-28">
        {/* Intro + direct contact */}
        <div className="lg:col-span-5">
          <p className="eyebrow mb-5">Start a project</p>
          <h2 className="font-display text-4xl leading-[1.08] tracking-[-0.015em] text-ink sm:text-5xl">
            Tell us about the space.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
            Five short questions, about a minute. We'll reply using the contact
            method you choose — nothing else.
          </p>

          <dl className="mt-12 divide-y divide-line border-y border-line">
            <div className="flex items-baseline justify-between gap-6 py-5">
              <dt className="text-sm text-muted">Phone</dt>
              <dd>
                <a href="tel:+14167272148" className="font-display text-2xl text-ink hover:text-brand-deep">
                  (416) 727-2148
                </a>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-6 py-5">
              <dt className="text-sm text-muted">Email</dt>
              <dd>
                <a href="mailto:info@arcanpainting.ca" className="font-display text-2xl text-ink hover:text-brand-deep">
                  info@arcanpainting.ca
                </a>
              </dd>
            </div>
          </dl>

          <div className="mt-10">
            <p className="text-sm font-medium text-ink">Useful to include</p>
            <ul className="mt-3 space-y-2 text-ink-soft">
              <li>— Rooms or surfaces, and their current condition</li>
              <li>— Colours or finishes you have in mind</li>
              <li>— Any dates you need to work around</li>
            </ul>
          </div>
        </div>

        {/* Quiz form */}
        <div className="lg:col-span-7">
          <div className="rounded-sm border border-line bg-white p-6 sm:p-10">
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between text-sm text-muted">
                <span className="font-medium" aria-live="polite" aria-atomic="true">
                  Step {step + 1} of {stepsTotal}
                </span>
                <span aria-hidden="true">{progressPercent}%</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={step + 1}
                aria-valuemin={1}
                aria-valuemax={stepsTotal}
                aria-label={`Form progress: step ${step + 1} of ${stepsTotal}`}
                className="h-1 w-full overflow-hidden rounded-full bg-paper-deep"
              >
                <div
                  className="h-full bg-brand transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="mb-10">
              <h3 className="mb-6 font-display text-2xl text-ink sm:text-3xl">{stepTitle}</h3>
              {stepBody}
              {error && (
                <div className="mt-4 rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
              <button
                type="button"
                onClick={back}
                disabled={step === 0 || submitMutation.isLoading}
                aria-label="Back"
                className="inline-flex items-center gap-2 px-2 py-3 font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
              >
                <ChevronLeft size={18} aria-hidden="true" /> Back
              </button>

              {step < stepsTotal - 1 ? (
                <button
                  type="button"
                  onClick={() => next()}
                  disabled={!canGoNext || submitMutation.isLoading}
                  aria-label="Go to next step"
                  className="btn-solid disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ChevronRight size={18} aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitMutation.isLoading}
                  aria-busy={submitMutation.isLoading}
                  className="btn-brand disabled:opacity-50"
                >
                  {submitMutation.isLoading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink border-t-transparent" aria-hidden="true" />
                      <span>Submitting…</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} aria-hidden="true" /> Send details
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
