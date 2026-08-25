import { useState } from "react";
import Footer from "./Footer";
import Header from "./Header";
import LeadFormPopup from "./LeadFormPopup";

export default function ServiceInquiryPage({ serviceName }) {
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main id="main" tabIndex={-1}>
        <section className="bg-slate-900 py-24 text-white">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-amber-400 font-semibold tracking-wide uppercase text-sm mb-4">Arcan Painting</p>
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">{serviceName}</h1>
            <p className="text-xl lg:text-2xl text-slate-200 mb-8 max-w-2xl">Tell us about your project and the details that matter to you.</p>
            <button onClick={() => setIsLeadFormOpen(true)} className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-8 py-4 rounded-xl text-lg transition-all">Discuss Your Project</button>
          </div>
        </section>
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Plan the next step</h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">Every project has its own scope, surfaces, materials, and timing considerations. Share the information you have so the team can review the request.</p>
            <p className="text-slate-600 text-lg leading-relaxed">A team member can confirm project-specific details after reviewing your inquiry.</p>
          </div>
        </section>
        <section className="py-20 bg-amber-400">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Start a project conversation</h2>
            <p className="text-slate-800 text-xl mb-8">Use the contact form to share your project details and questions.</p>
            <button onClick={() => setIsLeadFormOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-10 py-4 rounded-xl text-xl transition-all">Contact the Team</button>
          </div>
        </section>
      </main>
      <Footer />
      {isLeadFormOpen && <LeadFormPopup onClose={() => setIsLeadFormOpen(false)} />}
    </div>
  );
}
