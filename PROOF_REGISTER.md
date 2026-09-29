# Arcan Painting Public Proof Register

Last reviewed: 2026-08-28

Only facts already visible and internally consistent in the repository are used in the
remediation branch: the business name, website URL, public email, public phone number,
logo, social profile URLs, and the five named service categories. Project availability,
scope, pricing, and timing are explicitly left for direct confirmation.

The following claims are **not approved for publication** until the business owner supplies
current evidence and the desired wording:

| Claim area | Evidence needed | Current publication rule |
| --- | --- | --- |
| Service geography | Approved municipalities/regions and exclusions | Do not claim an area; keep generated city pages noindexed |
| Address and hours | Display policy and current operating details | Omit from public schema and copy |
| Insurance, WSIB, licences | Current documents and permitted wording | Omit |
| Warranty or guarantee | Written terms, exclusions, and owner approval | Omit |
| Years operating and crew model | Business records and approved wording | Omit |
| Brands/materials | Current supplier/product policy | Discuss per project; do not imply partnership |
| Reviews and ratings | Source URLs and reuse permission | Do not publish ratings or testimonials |
| Project case studies | Approved photos, scope, location granularity, and outcome | Do not invent or infer |
| Pricing and response SLA | Operationally supported terms | Do not promise prices or response time |
| Venetian plaster and limewash offered | Owner confirmation that Arcan applies these finishes | `/luxury-painting-gta` and market pages describe them; confirm before merge |
| Luxury market pages (Toronto to Barrie) | Approved municipalities/neighbourhoods per market | Market pages stay noindexed and out of the sitemap until `approved: true` in `src/data/markets.js` |
| Generated textures | Owner acceptance | Background textures in `public/luxury/` are AI-generated. Never present generated images as project photos |
