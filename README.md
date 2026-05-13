# 🚀 LaunchLog

**Business scenario log generation for live demos.**

LaunchLog is a Dynatrace App Engine application built for Solutions Engineers and Account Executives. It lets you deploy a realistic, continuously running log stream into any Dynatrace tenant in under two minutes — scoped to a specific industry vertical and business scenario.

The demo story: *"Here's what Dynatrace surfaces from your logs the moment you connect them."*

---

## What It Does

1. You select an industry vertical and a specific business use case
2. LaunchLog deploys an **Automation Workflow** to your tenant
3. The workflow runs on a schedule, injecting structured log events into Grail every few minutes
4. Logs include business-context fields (transaction amounts, fraud scores, flight delays, OEE scores, etc.) plus geographic coordinates for map visualisations
5. A **Dynatrace Dashboard** is created automatically via the Documents API — a deep link is provided post-deploy: `{environmentUrl}/ui/apps/dynatrace.dashboards/reports/{documentId}`
6. You walk the prospect through DQL queries that extract business insights from those logs in real time

---

## Supported Verticals & Use Cases

| Vertical | Use Cases |
|---|---|
| Financial Services | Payment Fraud, Core Banking, Trading Platform |
| Healthcare | EHR Access & Compliance, Claims Processing |
| Retail | eCommerce Checkout, Inventory Sync |
| Telco | Network Events, Service Provisioning |
| Manufacturing | PLC Alerts, Quality Control |
| Insurance | Claims Triage, Policy Changes |
| Logistics | Shipment Tracking, Warehouse Operations |
| Airlines | Flight Operations, Baggage Handling |
| Energy | Grid Events, Meter Reads |
| Automotive | Vehicle Telemetry, Dealer Portal |

---

## Log Schema

Every scenario emits structured logs with a consistent base schema plus vertical-specific fields.

**Base fields (all scenarios):**
- `log.source` — scenario tag for filtering
- `log.level` — INFO / WARN / ERROR / DEBUG
- `service.name`, `service.version`, `host.name`, `host.ip`
- `geo.location.latitude`, `geo.location.longitude`, `geo.city`, `geo.country`
- `user.id`, `session.id`, `trace.id`, `span.id`
- `http.status_code`, `duration_ms`

**Example vertical-specific fields:**
- Financial: `transaction.amount`, `transaction.status`, `fraud.score`, `fraud.rule`, `card.type`
- Healthcare: `compliance.flag`, `phi.category`, `access.role`, `record.type`
- Airlines: `flight.status`, `delay.minutes`, `delay.reason`, `baggage.status`
- Energy: `event.type`, `affected.customers`, `load.mw`, `renewable.pct`

Filter logs in DQL:
```dql
fetch logs
| filter log.source == "launchlog-financial-fraud"
| filter fraud.score > 0.7
| fields timestamp, geo.city, transaction.amount, fraud.score, fraud.rule
| sort fraud.score desc
```

---

## Prerequisites

| Requirement | Details |
|---|---|
| Node.js | v18+ |
| npm | v9+ |
| Dynatrace tenant | SaaS or Managed with Grail enabled |
| Tenant features | AutomationEngine, App Engine, Grail logs |

---

## Setup

### 1. Create an OAuth Client

In your tenant: **Settings → Account Management → OAuth Clients → Create client**

Required scopes:
```
automation:workflows:read
automation:workflows:write
automation:workflows:run
storage:logs:write
storage:logs:read
environment-api:entities:read
document:write
document:read
```

Save the **Client ID** — you'll need it in the next step.

### 2. Configure `app.config.json`

```json
{
  "environmentUrl": "https://{your-tenant}.apps.dynatrace.com",
  "app": {
    "name": "LaunchLog",
    "id": "my.launchlog"
  },
  "auth": {
    "clientId": "{your-oauth-client-id}",
    "scopes": [
      "automation:workflows:read",
      "automation:workflows:write",
      "automation:workflows:run",
      "storage:logs:write",
      "storage:logs:read",
      "environment-api:entities:read",
      "document:write",
      "document:read"
    ]
  }
}
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Locally

```bash
npm start
```

Opens a local dev server proxied to your tenant. Authenticate with your Dynatrace account when prompted. Test the full deploy flow before going to production.

### 5. Deploy to Tenant

```bash
npm run deploy
```

First deploy will prompt for your OAuth Client ID and Secret. After deploy, the app is available at:
```
https://{your-tenant}.apps.dynatrace.com/ui/apps/my.launchlog
```

---

## Using the App

1. Open LaunchLog in your tenant
2. Select a vertical and use case
3. Enter a company name and scenario parameters
4. Click **Deploy** — the workflow is created and a dashboard is generated immediately
5. The first workflow execution backfills **2 hours of historical log data** so the dashboard has immediate data to visualise
6. After 2–3 minutes, verify logs are flowing: **Logs → filter `log.source == "launchlog-..."`**
7. Use the **Deployments** tab to manage active scenarios (pause, resume, delete) — each entry includes direct links to both the workflow and the dashboard

Workflows are named `[LaunchLog] {Company} — {Use Case}` and appear in **Automation → Workflows**.

---

## Cleanup

**Stop a specific scenario:**
- Open the Deployments tab in the app → click **Pause** or **Delete**, or
- Go to **Automation → Workflows**, find the `[LaunchLog]` workflow, deactivate it

**Remove generated logs:**
- Logs expire per your bucket retention policy (default 35 days)
- To truncate early: filter by `log.source` in Grail Buckets and delete

---

## Troubleshooting

| Issue | Fix |
|---|---|
| OAuth error on deploy | Re-run `npx dt-app auth` and re-enter credentials |
| Workflow created but no logs appearing | Check workflow execution history in Automation for SDK errors |
| App not loading after deploy | Hard-reload (`Cmd+Shift+R`) and clear browser cache |
| `storage:logs:write` permission denied | Confirm OAuth client has the scope and Grail log ingest is enabled on the tenant |
| Local dev 401 errors | Re-run `npm start` and re-authenticate |

---

## Tech Stack

- **Dynatrace App Engine** — React + TypeScript, `dt-app` toolkit
- **@dynatrace-sdk/client-automation** — workflow creation and management
- **@dynatrace-sdk/app-environment** — tenant context and auth
- **@dynatrace/strato-components** — Dynatrace UI component library
- **Grail Logs API** — structured log ingest (`storage:logs:write`)

---

## Required Tenant Features

- ✅ **Grail** — log storage and DQL queries
- ✅ **AutomationEngine** — workflow creation and scheduling
- ✅ **App Engine** — app deployment and hosting
