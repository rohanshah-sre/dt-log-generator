# 🚀 LaunchLog

**Business scenario log generation for live demos.**

LaunchLog is a Dynatrace App Engine application built for Solutions Engineers and Account Executives. It lets you deploy a realistic, continuously running log stream into any Dynatrace tenant in under two minutes — scoped to a specific industry vertical and business scenario.

The demo story: *"Here's what Dynatrace surfaces from your logs the moment you connect them."*

---

## What It Does

1. You select an industry vertical and a specific business use case
2. LaunchLog deploys an **Automation Workflow** to your tenant
3. The workflow runs every minute, injecting structured log events into Grail in batches of up to 500
4. On first run, the workflow backfills **3 hours of historical data** so dashboards populate immediately
5. Logs include business-context fields (transaction amounts, fraud scores, flight delays, OEE scores, etc.) plus geographic coordinates for map visualisations
6. A **Gen-3 Dynatrace Dashboard** is created automatically via the Documents API — a direct link is provided post-deploy
7. You walk the prospect through live DQL queries that surface real business insights from those logs

---

## Supported Verticals & Use Cases

| Vertical | Use Cases |
|---|---|
| Financial Services | Payments, Fraud Detection, Trading |
| Healthcare | Patient Portal, Claims Processing, EHR Integration |
| Retail & E-Commerce | Order Management, Inventory, Customer Experience |
| Telecommunications | Network Operations, Billing, Customer Care |
| Manufacturing | Production, Quality Control, Supply Chain |
| Insurance | Claims, Underwriting, Policy Management |
| Gaming | Player Sessions, Monetization, Live Ops |
| Logistics & Delivery | Last Mile, Warehouse, Fleet |
| Energy & Utilities | Smart Grid, Outage Management, Metering |
| Automotive | Telematics, OTA Updates, EV Charging |
| Point of Sale | Transactions, Terminal Health, Kitchen Display |
| Airlines | Flight Operations, Passenger Services, Ground Ops |
| IoT & Industrial | Device Fleet, Sensor Telemetry, Firmware |
| Media & Streaming | Video Delivery, Live Streaming, Ad Insertion |

---

## Dashboard Layout

Each deployed scenario generates a **Gen-3 dashboard** (schema version 21) with five sections:

| Section | Contents |
|---|---|
| **Geographic Footprint** | Bubble map of event volume by city/country |
| **Executive Summary** | 6 KPI single-value tiles — Total Events + Error Rate (%) (colored) plus 4 use-case specific KPIs |
| **Activity Trends** | Area chart (event volume over time) + Stacked bar chart (event mix by `business.category`) |
| **Breakdown** | 4 use-case specific charts — line, area, categorical bar, and pie/donut |
| **Log Health** | Log level donut, top services categorical bar, service honeycomb |

Dashboard tiles use per-vertical brand colors for line/area/pie charts and a vibrant contrasting palette for bar charts.

---

## Log Schema

Every scenario emits structured logs with a consistent base schema plus vertical-specific fields.

**Base fields (all scenarios):**

| Field | Description |
|---|---|
| `log.level` | `INFO` / `WARN` / `ERROR` / `DEBUG` |
| `service.name` | Simulated microservice name |
| `service.version` | Semver string, e.g. `v2.4.11` |
| `host.name`, `host.ip` | Simulated host and public IP |
| `trace.id`, `span.id` | Distributed trace correlation IDs |
| `scenario.name` | Unique scenario identifier for DQL filtering |
| `scenario.vertical`, `scenario.usecase` | Vertical and use-case tags |
| `scenario.customer` | Customer name entered at deploy time |
| `business.category` | Per-use-case activity category (5–7 values, mirrors `event.type`) |
| `event.type` | Specific event type emitted by the pack |
| `geo.country`, `geo.city`, `geo.region` | Geographic location for map tiles |
| `geo.lat`, `geo.lon` | Latitude/longitude for bubble map |
| `environment` | `production` or `staging` (90 / 10 split) |

**Example vertical-specific fields:**

| Vertical | Fields |
|---|---|
| Financial — Payments | `transaction.amount`, `transaction.type`, `payment.method`, `fraud.score`, `card.network` |
| Healthcare — Claims | `claim.id`, `claim.status`, `claim.type`, `claim.amount`, `auto.adjudicated`, `sla.met` |
| Retail — Orders | `order.id`, `order.status`, `order.value`, `customer.segment`, `product.category`, `carrier` |
| Gaming — Sessions | `player.id`, `player.level`, `player.region`, `game.mode`, `match.result`, `anti_cheat.flag` |
| Energy — Smart Grid | `node.id`, `node.type`, `load.mw`, `voltage.kv`, `frequency.hz`, `customers.affected` |
| Logistics — Last Mile | `package.id`, `event.subtype`, `zone`, `carrier`, `sla.type`, `sla.met`, `failure.reason` |

**Filter by scenario in DQL:**
```dql
fetch logs
| filter scenario.name == "Acme Corp — Payments"
| filter business.category == "TRANSACTION_COMPLETED"
| fields timestamp, geo.city, transaction.amount, fraud.score, service.name
| sort timestamp desc
```

---

## Prerequisites

| Requirement | Details |
|---|---|
| Node.js | v22+ (v24 recommended by `dt-app`) |
| npm | v9+ |
| Dynatrace tenant | SaaS with Grail enabled |
| Tenant features | AutomationEngine, App Engine, Grail logs |

---

## Setup

### 1. Configure `app.config.json`

Set `environmentUrl` to your tenant URL:

```json
{
  "environmentUrl": "https://{your-tenant}.apps.dynatrace.com"
}
```

The app ID is `my.launchlog`. Required scopes are already declared in `app.config.json`:

```
automation:workflows:read
automation:workflows:write
automation:workflows:run
storage:logs:write
storage:logs:read
environment-api:entities:read
document:documents:write
document:documents:read
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Locally

```bash
npm start
```

Opens a local dev server proxied to your tenant with hot reload. Authenticate with your Dynatrace account when prompted.

### 4. Deploy to Tenant

```bash
npm run deploy
```

After deploy, the app is available at:
```
https://{your-tenant}.apps.dynatrace.com/ui/apps/my.launchlog
```

---

## Using the App

1. Open LaunchLog in your tenant
2. Pick a vertical, use case, and volume (Light / Medium / Heavy)
3. Enter a customer/company name and scenario label
4. Click **Deploy** — the workflow is created and a dashboard is generated immediately
5. The first workflow execution backfills **3 hours of historical log data** automatically
6. After 1–2 minutes, click the dashboard link on the Deployments tab to see live data
7. Use the **Deployments** tab to manage active scenarios — each entry links directly to the workflow and dashboard

Workflows are named `[LaunchLog] {Customer} — {Use Case}` and appear in **Automation → Workflows**. They run every minute (`*/1 * * * *`).

---

## Volume Settings

| Setting | Logs / Minute | Typical Use |
|---|---|---|
| Light | 250 | Low-traffic demo, minimal Grail DDP usage |
| Medium | 1,000 | Standard demo — recommended |
| Heavy | 4,000 | High-volume scenarios, stressed dashboards |

---

## Cleanup

**Stop a specific scenario:**
- Open the Deployments tab → **Delete**, or
- Go to **Automation → Workflows**, find the `[LaunchLog]` workflow and deactivate / delete it

**Remove generated logs:**
- Logs expire per your Grail bucket retention policy (default 35 days)
- To remove earlier: use **Settings → Log Storage** to purge by `scenario.name`

---

## Troubleshooting

| Issue | Fix |
|---|---|
| No logs after deploy | Check workflow execution history in **Automation** for JS errors |
| Dashboard tiles show "No data" | Wait 2–3 min for the backfill execution to complete |
| App not loading after deploy | Hard-reload (`Cmd+Shift+R`) and clear browser cache |
| `storage:logs:write` permission denied | Confirm the app scopes are accepted and Grail log ingest is enabled |
| Local dev 401 errors | Re-run `npm start` and re-authenticate |
| Build error `TS5103` | Ensure `ui/tsconfig.json` does not contain `baseUrl` or `ignoreDeprecations` |

---

## Tech Stack

- **Dynatrace App Engine** — React + TypeScript, `dt-app 1.8.x` toolkit
- **@dynatrace-sdk/client-automation** — workflow CRUD and execution
- **@dynatrace-sdk/client-document** — Gen-3 dashboard creation via Documents API
- **@dynatrace-sdk/client-grail-metrics-ingest** (via `logsClient.storeLog`) — structured log ingest
- **@dynatrace/strato-components-preview** — Dynatrace Strato design system components
- **Grail DQL** — all dashboard tiles query via `fetch logs | filter scenario.name == "..."`

---

## Required Tenant Features

- ✅ **Grail** — log storage and DQL queries
- ✅ **AutomationEngine** — workflow creation and scheduling
- ✅ **App Engine** — app deployment and hosting
- ✅ **Documents API** — Gen-3 dashboard creation
