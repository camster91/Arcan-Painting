import { notifyGerardo, formatQuoteNotification } from '../utils/telegram.js';
import { chatWithGemini } from '../utils/gemini.js';
import { createRateLimiter } from '../utils/rate-limit.js';
import { insertLead, validateLeadInput } from '../utils/insert-lead.js';

const quoteLimiter = createRateLimiter({ windowMs: 60_000, max: 5, prefix: 'quote' });

export async function POST(request) {
  const limited = quoteLimiter(request);
  if (limited) return limited;

  try {
    const body = await request.json();
    const { name, email, phone, serviceType, scope, timeline, budget, details, address } = body;

    if (!name || !email || !serviceType) {
      return Response.json({ error: 'Name, email, and service type are required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const projectDescription = [
      details,
      scope && `Scope: ${scope}`,
      timeline && `Timeline: ${timeline}`,
      budget && `Budget: ${budget}`,
    ].filter(Boolean).join('\n');
    const inputError = validateLeadInput({
      name,
      email,
      phone,
      serviceType,
      projectDescription,
      address,
    });
    if (inputError) return Response.json({ error: inputError }, { status: 400 });

    // Save through the server-only helper. The CRM HTTP endpoint is protected
    // for admin users and must not be used by a public quote submission.
    try {
      await insertLead({
        name,
        email,
        phone,
        serviceType,
        projectDescription,
        preferredContact: email ? 'email' : 'phone',
        address,
        leadSource: 'website_quote',
      });
    } catch (e) {
      console.error('Failed to save quote as lead:', e.message);
      return Response.json(
        { error: "We couldn't save your quote request. Please try again or call us directly." },
        { status: 503 },
      );
    }

    // Notify Gerardo via Telegram
    await notifyGerardo(formatQuoteNotification(body));

    // AI-draft a quote response for Gerardo to review
    try {
      await chatWithGemini([], `A customer named ${name} wants a quote for ${serviceType}. Scope: ${scope || 'not specified'}. Timeline: ${timeline || 'flexible'}. Budget: ${budget || 'not specified'}. Details: ${details || 'none'}. Address: ${address || 'not provided'}. Draft a brief, professional email response acknowledging the request and explaining that a team member will review the details before confirming next steps.`);
    } catch (e) {
      console.error('AI quote draft failed:', e.message);
    }

    return Response.json({
      success: true,
      message: "Thank you! We'll review your quote request and get back to you within 24-48 hours with a detailed estimate.",
    });
  } catch (error) {
    console.error('Quote error:', error.message);
    return Response.json({ error: 'Failed to process quote request' }, { status: 500 });
  }
}
