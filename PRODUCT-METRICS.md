# Arcan Painting Product Metrics

Last updated: 2026-09-01

Metrics must be computed from persisted source events. Until event definitions and data
quality checks are implemented, dashboards must label a metric unavailable rather than
substitute mock values.

## North-star journey

- **Digitally completed jobs:** count and percentage of won jobs that move from inquiry
  through paid closeout with all required source records and no undocumented handoff.

## Activation

- Time from inquiry to first human action.
- Percentage of qualified leads with a scheduled site visit or documented remote scope.
- Time from visit/scope completion to estimate sent.

## Sales

- Qualified lead rate, estimate rate, estimate approval rate, and contract win rate.
- Median sales cycle, average won value, loss reasons, and follow-up compliance.
- Revenue and win rate by source, campaign, service, and estimator.

## Operations

- Schedule variance, labor-hour variance, material-cost variance, change-order cycle time,
  jobs at risk, punch-list age, and time to closeout.

## Finance

- Contracted, invoiced, collected, outstanding, overdue, and refunded amounts.
- Deposit coverage, days sales outstanding, job gross profit, and gross margin.
- Reconciliation exceptions and financial records changed after issue/collection.

## Customer and growth

- Portal completion, approval/signature/payment completion, message delivery/failure,
  review-request eligibility, review conversion, referrals, repeat work, and opt-outs.

## Reliability and trust

- Core-journey error rate, failed transitions, duplicate records, retry success, restore
  test age, unauthorized attempts, accessibility regressions, and staging escape defects.
