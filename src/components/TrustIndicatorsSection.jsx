import { Shield, Award, Users, Calendar } from "lucide-react";

export default function TrustIndicatorsSection() {
  const currentYear = new Date().getFullYear();
  const yearsInBusiness = currentYear - 1995;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Years in Business */}
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-amber-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {yearsInBusiness}+
            </div>
            <div className="text-slate-600 text-sm">Years in Business</div>
          </div>

          {/* Projects Completed */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">500+</div>
            <div className="text-slate-600 text-sm">Happy Customers</div>
          </div>

          {/* Licensed & Insured */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 mb-2">
              Licensed
            </div>
            <div className="text-slate-600 text-sm">& Fully Insured</div>
          </div>

          {/* Satisfaction Rating */}
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">4.9</div>
            <div className="text-slate-600 text-sm">Star Rating</div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-70">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-slate-600" />
            <span className="text-slate-600 font-medium">Bonded & Insured</span>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-slate-600" />
            <span className="text-slate-600 font-medium">BBB Accredited</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-slate-600" />
            <span className="text-slate-600 font-medium">
              Warranty Included
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
