import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
} from "lucide-react";

export default function LeadFormPopup({ isOpen, onClose }) {
  // Quiz-style state
  const [step, setStep] = useState(0);
  const [serviceType, setServiceType] = useState("");
  const [fullName, setFullName] = useState("");
  const [preferredContact, setPreferredContact] = useState(""); // "phone" | "email"
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectDescription, setProjectDescription] = useState(""); // optional at end
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
    (value) => /^[\d\s\-\(\)\+]+$/.test(value),
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

  // Reset form when popup opens
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setServiceType("");
      setFullName("");
      setPreferredContact("");
      setEmail("");
      setPhone("");
      setProjectDescription("");
      setError(null);
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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

  // Submission logic
  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setError(null);
      setIsSubmitting(true);

      try {
        // Map to API's expected camelCase keys
        const payload = {
          name: fullName,
          email: preferredContact === "email" ? email : "",
          phone: preferredContact === "phone" ? phone : "",
          serviceType: serviceType,
          projectDescription: projectDescription,
          preferredContact: preferredContact,
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

        // Redirect to thank-you page with params (match ContactSection behavior)
        const params = new URLSearchParams({
          name: fullName || "",
          email: preferredContact === "email" ? email : "",
          phone: preferredContact === "phone" ? phone : "",
          serviceType: serviceType || "",
        });
        if (typeof window !== "undefined") {
          window.location.href = `/thank-you?${params.toString()}`;
          return; // stop further UI state updates after navigation
        }

        // Fallback success state (non-browser environments)
        setIsSuccess(true);
      } catch (e) {
        console.error(e);
        setError(e?.message || "Something went wrong. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [fullName, email, phone, serviceType, projectDescription, preferredContact],
  );

  if (!isOpen) return null;

  // Reusable button styles
  const optionBtn =
    "px-4 py-3 rounded-lg border transition-all text-sm sm:text-base font-medium";
  const optionBtnActive = "border-amber-400 text-slate-900 shadow bg-amber-400";
  const optionBtnIdle =
    "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-amber-300 hover:text-amber-700 dark:hover:border-amber-400 dark:hover:text-amber-400 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600";

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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const isActive = serviceType === opt.key;
          const cls = isActive
            ? `${optionBtn} ${optionBtnActive}`
            : `${optionBtn} ${optionBtnIdle}`;
          return (
            <button
              type="button"
              key={opt.key}
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
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-150 text-base"
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
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-150 text-base"
          placeholder={inputProps.placeholder}
          aria-label={inputProps.ariaLabel}
          name={inputProps.name}
          id={inputProps.id}
          autoComplete={inputProps.autoComplete}
          inputMode={inputProps.inputMode}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit(e);
            }
          }}
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-150 text-base resize-none"
          placeholder="Tell us about your project, size, timing, or any special requests..."
        />
        <div className="flex items-center gap-2 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-3 text-sm">
          <CheckCircle2 size={18} />
          <span>
            Your info is secure and only used to contact you about this request.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Popup Container */}
      <div
        className={`relative w-full max-w-2xl mx-4 mb-4 sm:mb-0 bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl transform transition-all duration-500 ease-out max-h-[90vh] overflow-hidden ${
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
              Request Your Estimate
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              One question at a time.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={24} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {isSuccess ? (
            // Success State
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2
                  size={32}
                  className="text-green-600 dark:text-green-400"
                />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Thank You!
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                We've received your request and will contact you within 24 hours
                to schedule your free estimate.
              </p>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                This window will close automatically...
              </div>
            </div>
          ) : (
            // Quiz Form
            <div className="p-6 lg:p-8">
              {/* Enhanced Progress */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-3">
                  <span className="font-medium">
                    Step {step + 1} of {stepsTotal}
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Step content */}
              <div className="mb-8">
                <h4 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-4 lg:mb-5">
                  {stepTitle}
                </h4>
                {stepBody}
                {error && (
                  <div className="mt-4 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-sm">
                    {error}
                  </div>
                )}
              </div>

              {/* Enhanced Nav buttons */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0 || isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 disabled:opacity-50 transition-all duration-200 font-medium"
                >
                  <ChevronLeft size={18} /> Back
                </button>

                {step < stepsTotal - 1 ? (
                  <button
                    type="button"
                    onClick={() => next()}
                    disabled={!canGoNext || isSubmitting}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    Next <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold px-8 py-3 rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={18} /> Submit
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
