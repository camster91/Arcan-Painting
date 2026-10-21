# Arcan Painting — AI Agents Integration Guide

## Overview

4 AI agents have been built and integrated into the Arcan Painting app. They run via Gerardo's OpenClaw instance and are called by backend routes.

---

## Architecture

```
Customer/Admin Action
        │
        ▼
   Arcan App API
        │
        ▼
POST /api/agents/{agent}
        │
        ▼
  OpenClaw Client
  (agents/openclaw.js)
        │
   POST /api/chat
        │
        ▼
  OpenClaw Instance
  (localhost:18789)
        │
  Agent Context .md
        │
        ▼
   AI Model Response
        │
        ▼
  Update DB + Notify
```

---

## Setup Required

### 1. Environment Variables

Add to Arcan Painting `.env`:
```env
# OpenClaw (Gerardo's local instance or deployed URL)
OPENCLAW_URL=http://localhost:18789
OPENCLAW_TOKEN=your-openclaw-token-here

# Or if using BOT_SECRET as the token:
BOT_SECRET=your-bot-secret-here
```

### 2. Agent Context Files

The 4 context files are in Cameron's workspace at:
```
~/.openclaw/workspace/agents/
├── arcan-lead-qualifier.md
├── arcan-estimator-scheduler.md
├── arcan-proposal-generator.md
└── arcan-customer-support.md
```

**Gerardo needs to import these** into his OpenClaw instance. The API routes reference them by relative path (`agents/arcan-*.md`).

**Option A:** Copy files to Gerardo's `~/.openclaw/workspace/agents/`

**Option B:** Update `CONTEXT_FILE` constants in each route.js to use the full path or URL.

### 3. Run Database Migration

After deploying, run once:
```bash
curl -X POST https://arcanpainting.ca/api/agents/migrate \
  -H "Cookie: admin_session=YOUR_ADMIN_TOKEN"
```

Or from admin browser console:
```js
fetch('/api/agents/migrate', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

This adds:
- `leads.qualification_score` (INTEGER)
- `leads.estimated_value` (NUMERIC)
- `estimates.proposal_status` (VARCHAR)
- `estimates.proposal_url` (TEXT)
- `estimates.proposal_content` (TEXT)
- `notifications.ai_category` (VARCHAR)
- `notifications.ai_response` (TEXT)

---

## Agents

### 1. Lead Qualifier 🎯
**File:** `src/app/api/agents/lead-qualifier/route.js`
**Context:** `agents/arcan-lead-qualifier.md`

**Trigger:** Automatic — fires when a contact form lead is saved (fire-and-forget, non-blocking)

**What it does:**
- Scores lead 0–100
- Estimates project value
- Categorizes service type, property type, location
- Recommends next action
- Drafts a follow-up SMS script for Gerardo
- Updates `leads.qualification_score` and `leads.estimated_value` in DB
- Sends Telegram alert for high-priority leads (score ≥ 61)

**Manual trigger:**
```js
POST /api/agents/lead-qualifier
{ "leadId": 42, "name": "...", "serviceType": "...", ... }
```

---

### 2. Estimator Scheduler 📅
**File:** `src/app/api/agents/schedule-estimator/route.js`
**Context:** `agents/arcan-estimator-scheduler.md`

**Trigger:** Admin button — "AI Schedule" button in Leads table

**What it does:**
- Summarizes the lead
- Suggests 3 optimal appointment slots (checks existing appointments for conflicts)
- Generates on-site estimate checklist tailored to service type
- Creates pre-visit briefing card
- Drafts SMS and email confirmation messages

**Flow:**
1. Admin clicks "AI Schedule" on a lead → AIScheduleModal opens
2. Click "Run Scheduling Agent" → calls `/api/agents/schedule-estimator`
3. Review suggested slots → select one → navigates to appointments with pre-filled date/time

---

### 3. Proposal Generator 📋
**File:** `src/app/api/agents/proposal-generator/route.js`
**Context:** `agents/arcan-proposal-generator.md`

**Trigger:** Admin button — "Generate Proposal (AI)" (robot icon) in EstimatesTable

**What it does:**
- Generates a full HTML proposal document
- Creates client-ready email with subject + body
- Writes internal notes for Gerardo's records
- Updates `estimates.proposal_status = 'generated'` in DB
- Sends Telegram notification when ready

**Flow:**
1. Admin clicks bot icon on an estimate → AIProposalModal opens
2. Click "Generate Proposal" → calls `/api/agents/proposal-generator`
3. Review tabs: Summary / Client Email / Proposal Preview / Internal Notes
4. Click "Open in Email Client" → opens mailto with pre-filled subject + body
5. Or Download HTML to attach as file

**Note:** In-person estimate flow — agent prepares the document, Gerardo reviews and sends manually. No auto-send.

---

### 4. Customer Support 💬
**File:** `src/app/api/agents/customer-support/route.js`
**Context:** `agents/arcan-customer-support.md`

**Trigger:** Automatic — fires on every chat widget message >10 characters (fire-and-forget)

**What it does:**
- Categorizes the message (estimate request, complaint, warranty claim, etc.)
- Assesses urgency (critical / high / medium / low)
- Drafts a suggested response for Gerardo to review
- Updates `notifications.ai_category` and `notifications.ai_response` in DB
- Sends Telegram alert for critical/high urgency messages

**Manual trigger:**
```js
POST /api/agents/customer-support
{
  "messageId": 123,      // optional — updates notifications record if provided
  "messageText": "I have a problem with the paint peeling",
  "senderName": "John Smith",
  "senderEmail": "john@email.com",
  "source": "website_chat"
}
```

---

## Frontend Components

### AIScheduleModal
`src/components/admin/leads/AIScheduleModal.jsx`

- Shows on leads page when "AI Schedule" button clicked
- Runs scheduling agent on demand
- Displays slots, checklist, confirmation draft
- On slot select → navigates to appointments with pre-fill

### AIProposalModal  
`src/components/admin/estimates/AIProposalModal.jsx`

- Shows on estimates page when bot icon clicked
- Runs proposal generator on demand
- 4-tab view: Summary / Email / Preview / Notes
- Download HTML, copy email, open in mail client

### useAgents Hook
`src/hooks/useAgents.js`

```js
import { useAgents } from '@/hooks/useAgents';

const { scheduleEstimate, generateProposal, triageMessage, qualifyLead, loading } = useAgents();

// Schedule estimate
const result = await scheduleEstimate(leadId);

// Generate proposal
const result = await generateProposal(estimateId);

// Triage message
const result = await triageMessage({ messageText, senderName, source: 'website_chat' });

// Check loading state
const busy = loading[`schedule-${leadId}`]; // true while running
```

---

## API Health Check

```
GET /api/agents
```
Returns:
```json
{
  "agents": [...],
  "openclaw": {
    "url": "http://localhost:18789",
    "online": true
  }
}
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `openclaw.online: false` | Check `OPENCLAW_URL` env var, ensure OpenClaw is running |
| `agent_ran: false` | Check OpenClaw logs, verify context file paths |
| `qualification returned null` | Agent returned non-JSON — check model response format |
| DB migration errors | Run `POST /api/agents/migrate` again — it's idempotent |
| Telegram alerts not sending | Check `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` env vars |

---

## Model Notes

- Agents run with whatever model Gerardo has configured in OpenClaw
- Kimi 2.7 (or Claude if available) works well for all 4 agents
- Proposal generator benefits from a stronger model (more structured output)
- Lead qualifier and customer support work fine with lighter models

---

*Built March 2026 for Gerardo @ Arcan Painting*
