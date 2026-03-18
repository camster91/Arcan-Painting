import { useState } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';

const SERVICE_TYPES = [
  'Interior Painting',
  'Exterior Painting',
  'Commercial Painting',
  'Cabinet Painting',
  'Color Consultation',
  'Specialty Finishes',
  'Other',
];

const TIMELINES = [
  'As soon as possible',
  'Within 2 weeks',
  'Within 1 month',
  'Within 3 months',
  'Flexible / No rush',
];

const BUDGETS = [
  'Under $1,000',
  '$1,000 - $3,000',
  '$3,000 - $5,000',
  '$5,000 - $10,000',
  '$10,000+',
  'Not sure yet',
];

export default function QuoteRequestForm() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', serviceType: '', scope: '', timeline: '', budget: '', details: '', address: '',
  });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Quote Request Received!</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          We'll review your project details and send you a detailed estimate within 24-48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="quote-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input id="quote-name" name="name" required value={form.name} onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="quote-email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input id="quote-email" name="email" type="email" required value={form.email} onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="your@email.com" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="quote-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input id="quote-phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="(416) 555-0123" />
        </div>
        <div>
          <label htmlFor="quote-service" className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
          <select id="quote-service" name="serviceType" required value={form.serviceType} onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white">
            <option value="">Select a service</option>
            {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="quote-address" className="block text-sm font-medium text-gray-700 mb-1">Project Address</label>
        <input id="quote-address" name="address" value={form.address} onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="123 Main St, Toronto, ON" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="quote-scope" className="block text-sm font-medium text-gray-700 mb-1">Scope / Rooms</label>
          <input id="quote-scope" name="scope" value={form.scope} onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="e.g., 3 bedrooms" />
        </div>
        <div>
          <label htmlFor="quote-timeline" className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
          <select id="quote-timeline" name="timeline" value={form.timeline} onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white">
            <option value="">Select timeline</option>
            {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="quote-budget" className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
          <select id="quote-budget" name="budget" value={form.budget} onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white">
            <option value="">Select budget</option>
            {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="quote-details" className="block text-sm font-medium text-gray-700 mb-1">Project Details</label>
        <textarea id="quote-details" name="details" rows={4} value={form.details} onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
          placeholder="Tell us about your project: current colors, desired colors, surface conditions, any special requirements..." />
      </div>

      {status === 'error' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{errorMsg}</div>
      )}

      <button type="submit" disabled={status === 'loading'}
        className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
        {status === 'loading' ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><Send className="w-5 h-5" /> Get Your Free Quote</>}
      </button>
    </form>
  );
}
