# Pre-tax expense input foundation

2026-10-06 (Toronto), based on merged main `837562368525ba358837288a9202958b02e7a3bd`.

The earlier OS expense implementation rounded floating point amounts and its report included tax in operating cost. This slice defines an exact CAD input contract using integer cents and returns operating cost, tax and tax-inclusive total separately. The inclusive total does not represent a cleared payment. No tax rate or accounting treatment is inferred.

Validation rejects ambiguous/sub-cent monetary input, non-CAD currency, malformed job/asset IDs, invalid dates, future dates in Toronto time, invalid categories and invalid metadata. Public receipt URLs are rejected in favour of a private asset ID. Receipt and job ownership must still be checked by a future API; pure validation does not establish access permission. The caller must supply canonical scoped entries to the aggregate.

Regression cases include $720 plus $93.60 tax and $80 travel: operating cost is $800, tax is $93.60, inclusive total is $893.60. Small decimal amounts aggregate without floating point drift. The maximum entry is CAD $1 million before tax; this is an input bound, not a business/tax rule.

This module is not yet called by production routes. It does not add a migration, expense persistence, receipt upload, mobile form, labour rates or profitability UI. No margin is presented without explicit internal labour-cost provenance. Remaining work belongs to #146/#116; neither issue is complete.

No new browser checks are necessary for this pure, unconnected calculation module. API/database integration and mobile capture require their own verification. Rollback is code-only; there are no data changes. Draft publication does not authorize merging or deploying new expense functionality.
