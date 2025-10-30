import { useState, useMemo, useCallback } from "react";
import {
  Mail,
  MapPin,
  Clock,
  Send,
  Phone,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Shield,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTheme, getThemeColors } from "@/utils/useTheme";

export default function ContactSection() {
  const { mounted } = useTheme();
  const themeColors = getThemeColors(false); // Always use light mode colors

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

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <section className="py-20 lg:py-32 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-16 bg-gray-300 rounded w-2/3 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-300 rounded-3xl"></div>
              <div className="h-96 bg-gray-300 rounded-3xl"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Reusable button styles - simplified for light mode only
  const optionBtn =
    "px-4 py-3 rounded-lg border transition-all text-sm sm:text-base font-medium";
  const optionBtnActive = "border-amber-600 text-white shadow bg-amber-500";
  const optionBtnIdle =
    "border-slate-300 text-slate-700 hover:border-amber-300 hover:text-amber-700 bg-white hover:bg-slate-50";

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
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-slate-900 transition-all duration-150 text-base"
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
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-slate-900 transition-all duration-150 text-base"
          placeholder={inputProps.placeholder}
          aria-label={inputProps.ariaLabel}
          name={inputProps.name}
          id={inputProps.id}
          autoComplete={inputProps.autoComplete}
          inputMode={inputProps.inputMode}
        />
        <p className="text-xs text-slate-500 mt-2">
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
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-slate-900 transition-all duration-150 text-base resize-none"
          placeholder="Tell us about your project, size, timing, or any special requests..."
        />
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mt-3 text-sm">
          <CheckCircle2 size={18} />
          <span>
            Your info is secure and only used to contact you about this request.
          </span>
        </div>
      </div>
    );
  }

  return (
    <section
      id="contact"
      className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700"
      style={{
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-r from-amber-400/10 to-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-green-400/5 to-teal-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>

        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          ></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Section Header */}
        <div className="text-center mb-16 lg:mb-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 mb-8">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full p-1.5">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-white/90 text-base lg:text-lg font-medium">
              Get In Touch
            </span>
          </div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-8">
            Get your free estimate
          </h2>
          <p className="text-xl lg:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
            Quick 60-second quiz. One question at a time. No spam—just your
            <span className="text-amber-400 font-semibold">
              {" "}
              preferred contact method
            </span>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Enhanced Quiz Form */}
          <div className="space-y-6">
            <div className="relative bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl p-8 lg:p-10 shadow-2xl">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 rounded-3xl"></div>

              <div className="relative z-10">
                <h3 className="text-slate-900 text-2xl lg:text-3xl font-bold mb-6 lg:mb-8">
                  Request Your Estimate
                </h3>

                {/* Enhanced Progress */}
                <div className="mb-8">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
                    <span className="font-medium">
                      Step {step + 1} of {stepsTotal}
                    </span>
                    <span className="font-bold text-amber-600">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-500 ease-out shadow-lg"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Step content */}
                <div className="mb-8">
                  <h4 className="text-xl lg:text-2xl font-bold text-slate-900 mb-4 lg:mb-5">
                    {stepTitle}
                  </h4>
                  {stepBody}
                  {error && (
                    <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                      {error}
                    </div>
                  )}
                </div>

                {/* Enhanced Nav buttons */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={back}
                    disabled={step === 0 || submitMutation.isLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 transition-all duration-200 font-medium"
                  >
                    <ChevronLeft size={18} /> Back
                  </button>

                  {step < stepsTotal - 1 ? (
                    <button
                      type="button"
                      onClick={() => next()}
                      disabled={!canGoNext || submitMutation.isLoading}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitMutation.isLoading}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold px-8 py-3 rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50"
                    >
                      {submitMutation.isLoading ? (
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
            </div>

            {/* Enhanced Emergency Contact */}
            <div className="relative bg-gradient-to-br from-amber-500 to-yellow-500 border border-amber-400/30 rounded-3xl p-8 lg:p-10 shadow-2xl overflow-hidden">
              {/* Background effects */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 rounded-xl p-2">
                    <Shield size={24} className="text-white" />
                  </div>
                  <h3 className="text-white text-xl lg:text-2xl font-bold">
                    Emergency Services
                  </h3>
                </div>
                <p className="text-white/90 mb-6 leading-relaxed text-base lg:text-lg">
                  Water damage or urgent repairs? We offer 24/7 emergency
                  painting services for immediate response situations.
                </p>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 bg-white hover:bg-white/90 text-amber-700 font-bold px-6 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto justify-center text-base lg:text-lg"
                >
                  Request Emergency Service
                </a>
              </div>
            </div>
          </div>

          {/* Enhanced Contact Information */}
          <div className="space-y-6 lg:space-y-8">
            {/* Enhanced Business Hours & Contact */}
            <div className="relative bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl p-8 lg:p-10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl"></div>

              <div className="relative z-10">
                <h3 className="text-slate-900 text-xl lg:text-2xl font-bold mb-6 lg:mb-8">
                  Contact Information
                </h3>

                <div className="space-y-6">
                  <a
                    href="mailto:info@arcanpainting.ca"
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                      <Mail size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-lg">
                        Email
                      </div>
                      <div className="text-amber-600 font-medium">
                        info@arcanpainting.ca
                      </div>
                    </div>
                  </a>

                  <div className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <MapPin size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-lg">
                        Service Area
                      </div>
                      <div className="text-slate-600 font-medium">
                        Greater Toronto Area (GTA)
                        <br />
                        Toronto, Mississauga, Brampton & surrounding areas
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Clock size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-lg">
                        Business Hours
                      </div>
                      <div className="text-slate-600 font-medium">
                        Mon-Fri: 7:00 AM - 6:00 PM
                        <br />
                        Sat: 8:00 AM - 4:00 PM
                        <br />
                        Sun: Emergency calls only
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Quality Guarantee */}
            <div className="relative bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl p-8 lg:p-10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-3xl"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-2">
                    <CheckCircle2 size={24} className="text-white" />
                  </div>
                  <h3 className="text-slate-900 text-xl lg:text-2xl font-bold">
                    Our Promise to You
                  </h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full shadow-sm"></div>
                    <span className="text-slate-700 font-medium">
                      Free, detailed estimates within 24 hours
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full shadow-sm"></div>
                    <span className="text-slate-700 font-medium">
                      Licensed, insured, and bonded professionals
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full shadow-sm"></div>
                    <span className="text-slate-700 font-medium">
                      100% satisfaction guarantee
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full shadow-sm"></div>
                    <span className="text-slate-700 font-medium">
                      Complete cleanup after every project
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
