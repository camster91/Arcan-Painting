"use client";

import { useEffect } from "react";

export default function NewEstimateRedirect() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.replace("/admin/estimates/calculator");
    }
  }, []);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-slate-600">
      Redirecting to estimator…
    </div>
  );
}
