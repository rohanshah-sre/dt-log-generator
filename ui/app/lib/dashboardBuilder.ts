export interface DashboardParams {
  scenarioName: string;
  vertical: string;
  useCase: string;
  customerName?: string;
  documentName: string;
}

const Q_SETTINGS = {
  maxResultRecords: 1000,
  defaultScanLimitGbytes: 500,
  maxResultMegaBytes: 1,
  defaultSamplingRatio: 10,
  enableSampling: false,
};

type Viz =
  | "singleValue"
  | "lineChart"
  | "areaChart"
  | "barChart"
  | "categoricalBarChart"
  | "pieChart"
  | "donutChart"
  | "bubbleMap"
  | "honeycomb"
  | "table";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

// ─────────────────────────────────────────────────────────────────────────────
// Per-vertical color palette
// ─────────────────────────────────────────────────────────────────────────────
const PALETTE: Record<string, [string, string, string, string, string]> = {
  financial: ["#2EB04C", "#0071CE", "#FFC220", "#9B59B6", "#FF5722"],
  healthcare: ["#00A39C", "#005EB8", "#FF6B6B", "#FFC220", "#7B1FA2"],
  retail: ["#0071CE", "#F47C20", "#FFC220", "#2EB04C", "#9B59B6"],
  telco: ["#7B2CBF", "#FF4081", "#00BCD4", "#FFC107", "#43A047"],
  manufacturing: ["#546E7A", "#F47C20", "#1565C0", "#FFC107", "#43A047"],
  insurance: ["#003366", "#FFB300", "#2EB04C", "#FF5722", "#00BCD4"],
  gaming: ["#E91E63", "#00BCD4", "#FFC107", "#9C27B0", "#43A047"],
  logistics: ["#00ACC1", "#FB8C00", "#7B1FA2", "#43A047", "#E53935"],
  energy: ["#FFC107", "#2EB04C", "#1976D2", "#FF5722", "#00BCD4"],
  automotive: ["#D32F2F", "#1565C0", "#FFC107", "#43A047", "#7B1FA2"],
  pos: ["#00ACC1", "#FB8C00", "#7B1FA2", "#43A047", "#1565C0"],
  airlines: ["#1E88E5", "#FFC107", "#E53935", "#43A047", "#9C27B0"],
  iot: ["#3F51B5", "#C0CA33", "#FF5722", "#00BCD4", "#FB8C00"],
  media: ["#FF5722", "#1976D2", "#2EB04C", "#FFC107", "#9C27B0"],
};
const paletteFor = (vertical: string): readonly string[] =>
  PALETTE[vertical] ?? PALETTE.financial;

// Verticals where a geographic map adds business meaning (physical footprint,
// store / vehicle / device / route locations). For others we swap the map tile
// for a multi-series event-type timeseries.
const GEO_RELEVANT: ReadonlySet<string> = new Set([
  "retail",
  "telco",
  "logistics",
  "energy",
  "automotive",
  "pos",
  "airlines",
  "iot",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Auto-detection helpers (icon / unit / record-field / thresholds)
// ─────────────────────────────────────────────────────────────────────────────

// Extract the field name produced by the final stage of a DQL query.
function recordFieldOf(dql: string): string {
  const segments = dql.split("|").map((s) => s.trim());
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (/^fieldsAdd\s+/i.test(seg)) {
      const m = seg.match(/fieldsAdd\s+([a-zA-Z_][\w.]*)\s*=/);
      if (m) return m[1];
    }
    if (/^summarize\s+/i.test(seg)) {
      const assigns = [...seg.matchAll(/([a-zA-Z_][\w.]*)\s*=/g)];
      if (assigns.length > 0) return assigns[assigns.length - 1][1];
    }
  }
  return "count";
}

type IconName =
  | "MoneyIcon"
  | "AnalyticsIcon"
  | "AlertIcon"
  | "UserIcon"
  | "ShoppingCartIcon"
  | "GlobeIcon"
  | "MobileIcon"
  | "TruckIcon"
  | "HeartIcon";

function iconFor(title: string): IconName {
  const t = title.toLowerCase();
  if (/revenue|value|premium|notional|sales/.test(t)) return "MoneyIcon";
  if (/alert|fraud|failure|outage|breach|error|reject|stockout|denial|complaint|fault|exception|incident|crash|delay|cancel/.test(t)) return "AlertIcon";
  if (/csat|satisfaction|score|quality/.test(t)) return "HeartIcon";
  if (/user|player|visitor|patient|customer|passenger|subscriber/.test(t)) return "UserIcon";
  if (/order|cart|checkout|sale|purchase|transaction|po\b|pickup/.test(t)) return "ShoppingCartIcon";
  if (/mobile|app|sms/.test(t)) return "MobileIcon";
  if (/shipment|delivery|fleet|vehicle|truck|pallet|carrier|warehouse|logistic/.test(t)) return "TruckIcon";
  if (/online|active|device|network|stream|web|portal|grid|meter|service/.test(t)) return "GlobeIcon";
  return "AnalyticsIcon";
}

interface UnitOverride {
  identifier: string;
  unitCategory: string;
  baseUnit: string;
  displayUnit: null;
  decimals: number;
  suffix?: string;
  delimiter: boolean;
}

function unitFor(title: string, field: string): UnitOverride {
  const t = title;
  const lo = t.toLowerCase();
  if (/\$|usd|revenue|value|premium|notional/i.test(t)) {
    return {
      identifier: field,
      unitCategory: "unspecified",
      baseUnit: "count",
      displayUnit: null,
      decimals: /avg|aov|basket|price/i.test(t) ? 2 : 0,
      suffix: " USD",
      delimiter: true,
    };
  }
  if (/%|rate|compliance|conversion|approval/i.test(t)) {
    return {
      identifier: field,
      unitCategory: "percentage",
      baseUnit: "percent",
      displayUnit: null,
      decimals: 1,
      suffix: "%",
      delimiter: true,
    };
  }
  if (/\(ms\)|latency|response time/i.test(t)) {
    return { identifier: field, unitCategory: "unspecified", baseUnit: "count", displayUnit: null, decimals: 0, suffix: " ms", delimiter: true };
  }
  if (/\(min\)/i.test(t)) {
    return { identifier: field, unitCategory: "unspecified", baseUnit: "count", displayUnit: null, decimals: 1, suffix: " min", delimiter: true };
  }
  if (/\(kwh\)/i.test(lo)) {
    return { identifier: field, unitCategory: "unspecified", baseUnit: "count", displayUnit: null, decimals: 0, suffix: " kWh", delimiter: true };
  }
  if (/\(mw\)/i.test(lo)) {
    return { identifier: field, unitCategory: "unspecified", baseUnit: "count", displayUnit: null, decimals: 1, suffix: " MW", delimiter: true };
  }
  if (/\(km\/h\)/i.test(lo)) {
    return { identifier: field, unitCategory: "unspecified", baseUnit: "count", displayUnit: null, decimals: 1, suffix: " km/h", delimiter: true };
  }
  if (/\(mbps\)/i.test(lo)) {
    return { identifier: field, unitCategory: "unspecified", baseUnit: "count", displayUnit: null, decimals: 1, suffix: " Mbps", delimiter: true };
  }
  return { identifier: field, unitCategory: "unspecified", baseUnit: "count", displayUnit: null, decimals: 0, delimiter: true };
}

type Direction = "higher-good" | "lower-good" | "none";

function directionFor(title: string): Direction {
  const t = title.toLowerCase();
  // Bad-when-high rates take precedence
  if (/(failure|reject|decline|denial|cancellation|abandon|lapse|defect|disconnect|return|fail)\s*rate/.test(t)) return "lower-good";
  if (/(success|compliance|approval|on-?time|conversion|win|delivery|pass|adjudication|uptime|fill)\s*rate/.test(t)) return "higher-good";
  if (/(failure|reject|decline|denial|abandon|defect|disconnect|fail).*%/.test(t)) return "lower-good";
  if (/(success|compliance|approval|on-?time|conversion|uptime|fill).*%/.test(t)) return "higher-good";
  return "none";
}

interface ColorRule {
  value: number;
  comparator: "≥" | ">" | "<" | "≤";
  field: string;
  colorMode: "custom-color";
  customColor: { Default: string };
}

const SUCCESS = "var(--dt-colors-charts-status-success-default, #2ab06f)";
const WARNING = "var(--dt-colors-charts-status-warning-default, #f5d30f)";
const CRITICAL = "var(--dt-colors-charts-status-critical-default, #c62239)";

function thresholdsFor(field: string, direction: Direction): ColorRule[] {
  if (direction === "higher-good") {
    return [
      { value: 95, comparator: "≥", field, colorMode: "custom-color", customColor: { Default: SUCCESS } },
      { value: 80, comparator: "≥", field, colorMode: "custom-color", customColor: { Default: WARNING } },
      { value: 0, comparator: "≥", field, colorMode: "custom-color", customColor: { Default: CRITICAL } },
    ];
  }
  if (direction === "lower-good") {
    return [
      { value: 5, comparator: "<", field, colorMode: "custom-color", customColor: { Default: SUCCESS } },
      { value: 15, comparator: "<", field, colorMode: "custom-color", customColor: { Default: WARNING } },
      { value: 15, comparator: "≥", field, colorMode: "custom-color", customColor: { Default: CRITICAL } },
    ];
  }
  return [];
}

function labelFromTitle(title: string): string {
  return title
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, 24);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tile builders
// ─────────────────────────────────────────────────────────────────────────────

function md(content: string) {
  return { type: "markdown", content };
}

function kpiTile(title: string, query: string) {
  const field = recordFieldOf(query);
  const direction = directionFor(title);
  const rules = thresholdsFor(field, direction);
  const unit = unitFor(title, field);
  const icon = iconFor(title);

  const coloring: Record<string, unknown> = {};
  if (rules.length > 0) coloring.colorRules = rules;

  return {
    title,
    type: "data",
    query,
    querySettings: Q_SETTINGS,
    visualization: "singleValue",
    visualizationSettings: {
      singleValue: {
        label: labelFromTitle(title),
        recordField: field,
        prefixIcon: icon,
        isIconVisible: true,
        colorThresholdTarget: "background",
        trend: { isVisible: true },
      },
      unitsOverrides: [unit],
      ...(rules.length > 0 ? { coloring } : {}),
    },
  };
}

function sectionTile(label: string, icon: IconName, color: string) {
  return {
    title: "",
    type: "data",
    query: `data record(section="${esc(label)}")`,
    querySettings: Q_SETTINGS,
    visualization: "singleValue",
    visualizationSettings: {
      singleValue: {
        labelMode: "none",
        isIconVisible: true,
        prefixIcon: icon,
        colorThresholdTarget: "background",
      },
      autoSelectVisualization: false,
      coloring: {
        colorRules: [
          {
            value: "x",
            comparator: "!=",
            field: "section",
            colorMode: "custom-color",
            customColor: color,
          },
        ],
      },
    },
  };
}

function chartTile(title: string, query: string, viz: Viz, palette: readonly string[]) {
  const field = recordFieldOf(query);
  const settings: Record<string, unknown> = { thresholds: [] };

  if (viz === "lineChart" || viz === "areaChart" || viz === "barChart") {
    settings.chartSettings = {
      seriesOverrides: [
        { seriesId: [field], override: { color: palette[0] } },
      ],
      fieldMapping: {
        leftAxisValues: [field],
        timestamp: "timeframe",
      },
      gapPolicy: "connect",
      truncationMode: "middle",
      legend: { hidden: false },
    };
  } else if (viz === "categoricalBarChart") {
    settings.chartSettings = {
      xAxisLabelVisible: true,
      truncationMode: "auto",
      legend: { hidden: true },
    };
  } else if (viz === "pieChart" || viz === "donutChart") {
    settings.chartSettings = {
      circleChartSettings: {
        valueType: "relative",
        showTotalValue: true,
        groupingThresholdType: "relative",
      },
    };
    settings.legend = { ratio: 27 };
  } else if (viz === "bubbleMap") {
    settings.regions = { showRegions: false };
    settings.mapRadius = { radiusRange: [4, 28] };
    settings.tooltip = { showCustomFields: true };
    settings.legend = { showLegend: true, position: "auto", ratio: 13 };
    settings.dataMapping = { radius: field, dimension: "city" };
    settings.coloring = {
      thresholdRules: [
        { color: palette[2], min: null, max: 100, label: "Lower volume", colorMode: "single-color", mode: "range", position: "left", strokeOnly: false },
        { color: palette[1], min: 100, max: 1000, label: "Mid volume", colorMode: "single-color", mode: "range", position: "left", strokeOnly: false },
        { color: palette[0], min: 1000, max: null, label: "High volume", colorMode: "single-color", mode: "range", position: "left", strokeOnly: false },
      ],
    };
  } else if (viz === "table") {
    settings.table = { rowDensity: "comfortable" };
  } else {
    settings.chartSettings = { truncationMode: "middle" };
  }

  return {
    title,
    type: "data",
    query,
    querySettings: Q_SETTINGS,
    visualization: viz,
    visualizationSettings: settings,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI / Chart definitions (per use case) — preserved from prior implementation
// ─────────────────────────────────────────────────────────────────────────────

interface TileDef {
  title: string;
  dql: string;
  viz?: Viz;
}

function getKPIs(base: string, ucKey: string): TileDef[] {
  switch (ucKey) {
    // ── Financial Services ─────────────────────────────────────────────────
    case "financial/payments":
      return [
        { title: "Transaction Success Rate (%)", dql: `${base} | summarize total = count(), ok = countIf(event.type == "TRANSACTION_COMPLETED") | fieldsAdd rate = ok / total * 100` },
        { title: "Revenue Processed ($)", dql: `${base} | filter event.type == "TRANSACTION_COMPLETED" | summarize revenue = sum(transaction.amount)` },
        { title: "p95 Auth Latency (ms)", dql: `${base} | filter isNotNull(latency_ms) | summarize p95 = percentile(latency_ms, 95)` },
        { title: "Fraud Alerts", dql: `${base} | filter event.type == "FRAUD_ALERT" | summarize alerts = count()` },
      ];
    case "financial/fraud":
      return [
        { title: "High-Risk Transactions", dql: `${base} | filter toDouble(fraud.score) > 0.8 | summarize count = count()` },
        { title: "Blocked Transactions", dql: `${base} | filter event.type == "FRAUD_BLOCKED" | summarize blocked = count()` },
        { title: "Avg ML Inference (ms)", dql: `${base} | filter isNotNull(inference.latency_ms) | summarize avg_ms = avg(inference.latency_ms)` },
        { title: "Active Fraud Rules", dql: `${base} | summarize rules = countDistinctExact(rule.triggered)` },
      ];
    case "financial/trading":
      return [
        { title: "Orders Executed", dql: `${base} | filter event.type == "ORDER_EXECUTED" | summarize count = count()` },
        { title: "Reject Rate (%)", dql: `${base} | summarize total = count(), rejected = countIf(event.type == "ORDER_REJECTED") | fieldsAdd rate = rejected / total * 100` },
        { title: "p95 Execution Latency (ms)", dql: `${base} | filter isNotNull(latency_ms) | summarize p95 = percentile(latency_ms, 95)` },
        { title: "Notional Traded ($)", dql: `${base} | filter event.type == "ORDER_EXECUTED" | summarize notional = sum(price)` },
      ];

    // ── Healthcare ─────────────────────────────────────────────────────────
    case "healthcare/patient_portal":
      return [
        { title: "Portal Actions", dql: `${base} | filter event.type == "PATIENT_ACTION" | summarize count = count()` },
        { title: "EHR Integration Errors", dql: `${base} | filter event.type == "EHR_INTEGRATION_FAILURE" | summarize errors = count()` },
        { title: "p95 Portal Latency (ms)", dql: `${base} | filter isNotNull(latency_ms) | summarize p95 = percentile(latency_ms, 95)` },
        { title: "Slow Response Events", dql: `${base} | filter event.type == "SLOW_RESPONSE" | summarize count = count()` },
      ];
    case "healthcare/claims":
      return [
        { title: "Auto-Adjudication Rate (%)", dql: `${base} | summarize total = count(), auto = countIf(auto.adjudicated == true) | fieldsAdd rate = auto / total * 100` },
        { title: "SLA Compliance (%)", dql: `${base} | summarize total = count(), met = countIf(sla.met == true) | fieldsAdd rate = met / total * 100` },
        { title: "Denial Rate (%)", dql: `${base} | summarize total = count(), denied = countIf(claim.status == "DENIED") | fieldsAdd rate = denied / total * 100` },
        { title: "Total Claim Value ($)", dql: `${base} | filter isNotNull(claim.amount) | summarize total = sum(claim.amount)` },
      ];
    case "healthcare/ehr":
      return [
        { title: "HL7 Messages Processed", dql: `${base} | filter event.type == "HL7_MESSAGE" | summarize count = count()` },
        { title: "HL7 Failure Rate (%)", dql: `${base} | summarize total = count(), failed = countIf(event.type == "HL7_FAILURE") | fieldsAdd rate = failed / total * 100` },
        { title: "p95 Processing Latency (ms)", dql: `${base} | filter isNotNull(latency_ms) | summarize p95 = percentile(latency_ms, 95)` },
        { title: "Unique Facilities", dql: `${base} | summarize count = countDistinctExact(facility)` },
      ];

    // ── Retail & E-Commerce ────────────────────────────────────────────────
    case "retail/orders":
      return [
        { title: "Delivery Rate (%)", dql: `${base} | summarize total = count(), delivered = countIf(order.status == "DELIVERED") | fieldsAdd rate = delivered / total * 100` },
        { title: "Avg Order Value ($)", dql: `${base} | filter isNotNull(order.value) | summarize avg = avg(order.value)` },
        { title: "Cancellation Rate (%)", dql: `${base} | summarize total = count(), cancelled = countIf(order.status == "CANCELLED") | fieldsAdd rate = cancelled / total * 100` },
        { title: "Return Rate (%)", dql: `${base} | summarize total = count(), returned = countIf(order.status == "RETURNED") | fieldsAdd rate = returned / total * 100` },
      ];
    case "retail/inventory":
      return [
        { title: "Stock-Out Events", dql: `${base} | filter event.type == "STOCKOUT" | summarize count = count()` },
        { title: "Replenishments Triggered", dql: `${base} | filter event.type == "REORDER_TRIGGERED" | summarize count = count()` },
        { title: "p95 Stock Check Latency (ms)", dql: `${base} | filter event.type == "STOCK_CHECK" | filter isNotNull(latency_ms) | summarize p95 = percentile(latency_ms, 95)` },
        { title: "Warehouses Active", dql: `${base} | summarize count = countDistinctExact(warehouse.id)` },
      ];
    case "retail/cx":
      return [
        { title: "Page Views", dql: `${base} | filter event.type == "BROWSE" | summarize count = count()` },
        { title: "Cart Abandonments", dql: `${base} | filter event.type == "CART_ABANDONED" | summarize count = count()` },
        { title: "Checkout Failures", dql: `${base} | filter event.type == "CHECKOUT_FAILURE" | summarize count = count()` },
        { title: "p95 Page Latency (ms)", dql: `${base} | filter isNotNull(latency_ms) | summarize p95 = percentile(latency_ms, 95)` },
      ];

    // ── Telecommunications ─────────────────────────────────────────────────
    case "telco/network":
      return [
        { title: "Threshold Breaches", dql: `${base} | filter threshold.breach == true | summarize count = count()` },
        { title: "Outage Events", dql: `${base} | filter event.type == "NETWORK_OUTAGE" | summarize count = count()` },
        { title: "Total Subscriber Impact", dql: `${base} | filter isNotNull(subscriber.impact) | summarize total = sum(subscriber.impact)` },
        { title: "P1/P2 Tickets", dql: `${base} | filter ticket.priority == "P1" or ticket.priority == "P2" | summarize count = count()` },
      ];
    case "telco/billing":
      return [
        { title: "Usage Events Rated", dql: `${base} | filter event.type == "USAGE_EVENT" | summarize count = count()` },
        { title: "Rating Failures", dql: `${base} | filter event.type == "RATING_FAILURE" | summarize count = count()` },
        { title: "Provisioning Delays", dql: `${base} | filter event.type == "PROVISIONING_DELAY" | summarize count = count()` },
        { title: "Total Usage Billed", dql: `${base} | filter event.type == "USAGE_EVENT" | summarize total = sum(usage.amount)` },
      ];
    case "telco/care":
      return [
        { title: "Tickets Created", dql: `${base} | filter action == "CREATED" | summarize count = count()` },
        { title: "Tickets Resolved", dql: `${base} | filter action == "RESOLVED" | summarize count = count()` },
        { title: "SLA Risk Alerts", dql: `${base} | filter event.type == "SLA_RISK" | summarize count = count()` },
        { title: "Routing Failures", dql: `${base} | filter event.type == "ROUTING_FAILURE" | summarize count = count()` },
      ];

    // ── Manufacturing ──────────────────────────────────────────────────────
    case "manufacturing/production":
      return [
        { title: "Avg OEE Score", dql: `${base} | filter isNotNull(oee.score) | summarize avg = avg(oee.score)` },
        { title: "Units Produced", dql: `${base} | filter isNotNull(units.produced) | summarize total = sum(units.produced)` },
        { title: "Downtime Events", dql: `${base} | filter event.subtype == "DOWNTIME_START" | summarize count = count()` },
        { title: "Avg Defect Rate (%)", dql: `${base} | filter isNotNull(defect.rate) | summarize avg = avg(defect.rate)` },
      ];
    case "manufacturing/quality":
      return [
        { title: "Inspection Pass Rate (%)", dql: `${base} | summarize total = count(), passed = countIf(result == "PASS") | fieldsAdd rate = passed / total * 100` },
        { title: "Failed Inspections", dql: `${base} | filter result == "FAIL" | summarize count = count()` },
        { title: "Marginal Inspections", dql: `${base} | filter result == "MARGINAL" | summarize count = count()` },
        { title: "Avg Defect Rate (%)", dql: `${base} | filter isNotNull(defect.rate) | summarize avg = avg(defect.rate)` },
      ];
    case "manufacturing/supply_chain":
      return [
        { title: "PO Events", dql: `${base} | filter event.type == "PO_EVENT" | summarize count = count()` },
        { title: "SLA Breaches", dql: `${base} | filter event.type == "SUPPLIER_SLA_BREACH" | summarize count = count()` },
        { title: "SLA Risk Events", dql: `${base} | filter event.type == "SUPPLIER_SLA_RISK" | summarize count = count()` },
        { title: "Unique Suppliers", dql: `${base} | summarize count = countDistinctExact(supplier.id)` },
      ];

    // ── Insurance ──────────────────────────────────────────────────────────
    case "insurance/claims":
      return [
        { title: "SLA On-Track Rate (%)", dql: `${base} | summarize total = count(), ok = countIf(sla.status == "ON_TRACK") | fieldsAdd rate = ok / total * 100` },
        { title: "Fraud Indicators", dql: `${base} | filter fraud.indicator == true | summarize count = count()` },
        { title: "Total Claims Value ($)", dql: `${base} | filter isNotNull(claim.amount) | summarize total = sum(claim.amount)` },
        { title: "Catastrophic Claims", dql: `${base} | filter claim.severity == "CATASTROPHIC" | summarize count = count()` },
      ];
    case "insurance/underwriting":
      return [
        { title: "Quote Approval Rate (%)", dql: `${base} | summarize total = count(), approved = countIf(decision == "APPROVED") | fieldsAdd rate = approved / total * 100` },
        { title: "Avg Premium ($)", dql: `${base} | filter isNotNull(premium) | summarize avg = avg(premium)` },
        { title: "Manual Referrals", dql: `${base} | filter event.type == "MANUAL_REFERRAL" | summarize count = count()` },
        { title: "p95 Decision Latency (ms)", dql: `${base} | filter isNotNull(latency_ms) | summarize p95 = percentile(latency_ms, 95)` },
      ];
    case "insurance/policy":
      return [
        { title: "Renewals", dql: `${base} | filter action == "RENEWAL" | summarize count = count()` },
        { title: "Cancellations", dql: `${base} | filter action == "CANCELLATION" | summarize count = count()` },
        { title: "Lapse Risk Events", dql: `${base} | filter event.type == "POLICY_LAPSE_RISK" | summarize count = count()` },
        { title: "Policy Failures", dql: `${base} | filter event.type == "POLICY_FAILURE" | summarize count = count()` },
      ];

    // ── Gaming & Media ─────────────────────────────────────────────────────
    case "gaming/sessions":
      return [
        { title: "Player Logins", dql: `${base} | filter event.subtype == "LOGIN" | summarize count = count()` },
        { title: "Disconnect Rate (%)", dql: `${base} | summarize total = count(), dc = countIf(event.subtype == "DISCONNECT") | fieldsAdd rate = dc / total * 100` },
        { title: "Win Rate (%)", dql: `${base} | filter isNotNull(match.result) | summarize total = count(), wins = countIf(match.result == "WIN") | fieldsAdd rate = wins / total * 100` },
        { title: "Anti-Cheat Flags", dql: `${base} | filter anti_cheat.flag == true | summarize count = count()` },
      ];
    case "gaming/monetization":
      return [
        { title: "IAP Success Rate (%)", dql: `${base} | summarize total = count(), ok = countIf(event.type == "IAP") | fieldsAdd rate = ok / total * 100` },
        { title: "IAP Revenue ($)", dql: `${base} | filter event.type == "IAP" | summarize revenue = sum(amount)` },
        { title: "Failed IAPs", dql: `${base} | filter event.type == "IAP_FAILED" | summarize count = count()` },
        { title: "Fraud Flags", dql: `${base} | filter event.type == "IAP_FRAUD_FLAG" | summarize count = count()` },
      ];
    case "gaming/live_ops":
      return [
        { title: "Peak Players Online", dql: `${base} | filter event.type == "LIVEOPS" | summarize peak = max(players.online)` },
        { title: "Active Incidents", dql: `${base} | filter event.type == "LIVEOPS_INCIDENT" | summarize count = count()` },
        { title: "Capacity Warnings", dql: `${base} | filter event.type == "CAPACITY_WARNING" | summarize count = count()` },
        { title: "Avg CPU (%)", dql: `${base} | filter isNotNull(cpu.pct) | summarize avg = avg(cpu.pct)` },
      ];

    // ── Logistics & Delivery ───────────────────────────────────────────────
    case "logistics/last_mile":
      return [
        { title: "Delivery Success Rate (%)", dql: `${base} | filter event.type == "DELIVERY_EVENT" | summarize total = count(), delivered = countIf(event.subtype == "DELIVERED") | fieldsAdd rate = delivered / total * 100` },
        { title: "SLA Compliance (%)", dql: `${base} | filter isNotNull(sla.met) | summarize total = count(), met = countIf(sla.met == true) | fieldsAdd rate = met / total * 100` },
        { title: "Failed Deliveries", dql: `${base} | filter event.subtype == "FAILED_DELIVERY" | summarize count = count()` },
        { title: "Delivery Attempts (Retry)", dql: `${base} | filter event.subtype == "DELIVERY_ATTEMPT" | summarize count = count()` },
      ];
    case "logistics/warehouse":
      return [
        { title: "Items Processed", dql: `${base} | filter event.type == "WAREHOUSE_EVENT" | summarize count = count()` },
        { title: "Warehouse Exceptions", dql: `${base} | filter event.subtype == "EXCEPTION" | summarize count = count()` },
        { title: "Avg Throughput Rate", dql: `${base} | filter isNotNull(throughput.rate) | summarize avg = avg(throughput.rate)` },
        { title: "Active Warehouses", dql: `${base} | summarize count = countDistinctExact(warehouse.id)` },
      ];
    case "logistics/fleet":
      return [
        { title: "Active Vehicles", dql: `${base} | summarize count = countDistinctExact(vehicle.id)` },
        { title: "Maintenance Due Alerts", dql: `${base} | filter event.subtype == "MAINTENANCE_DUE" | summarize count = count()` },
        { title: "Vehicle Faults", dql: `${base} | filter event.subtype == "FAULT" | summarize count = count()` },
        { title: "Critical Faults", dql: `${base} | filter severity == "CRITICAL" | summarize count = count()` },
      ];

    // ── Energy & Utilities ─────────────────────────────────────────────────
    case "energy/smart_grid":
      return [
        { title: "Grid Events", dql: `${base} | filter event.type == "GRID_EVENT" | summarize count = count()` },
        { title: "Fault Events", dql: `${base} | filter event.subtype == "FAULT_DETECTED" | summarize count = count()` },
        { title: "Customers Affected", dql: `${base} | filter isNotNull(customers.affected) | summarize total = sum(customers.affected)` },
        { title: "Avg Load (MW)", dql: `${base} | filter isNotNull(load.mw) | summarize avg = avg(load.mw)` },
      ];
    case "energy/outage":
      return [
        { title: "Outages Started", dql: `${base} | filter event.subtype == "OUTAGE_START" | summarize count = count()` },
        { title: "Customers Affected", dql: `${base} | filter isNotNull(customers.affected) | summarize total = sum(customers.affected)` },
        { title: "Regulatory Reportable", dql: `${base} | filter regulatory.reportable == true | summarize count = count()` },
        { title: "Outages Restored", dql: `${base} | filter event.subtype == "RESTORED" | summarize count = count()` },
      ];
    case "energy/metering":
      return [
        { title: "Meter Reads", dql: `${base} | filter event.type == "METER_READ" | summarize count = count()` },
        { title: "Missed Reads", dql: `${base} | filter event.type == "MISSED_READ" | summarize count = count()` },
        { title: "Tamper Alerts", dql: `${base} | filter event.type == "TAMPER_ALERT" | summarize count = count()` },
        { title: "Total Energy Read (kWh)", dql: `${base} | filter isNotNull(reading.kwh) | summarize total = sum(reading.kwh)` },
      ];

    // ── Automotive & Connected Vehicles ────────────────────────────────────
    case "automotive/telematics":
      return [
        { title: "Active Vehicles", dql: `${base} | summarize count = countDistinctExact(vehicle.id)` },
        { title: "Critical Alerts", dql: `${base} | filter alert.severity == "CRITICAL" | summarize count = count()` },
        { title: "Crash Detections", dql: `${base} | filter event.subtype == "CRASH_DETECT" | summarize count = count()` },
        { title: "Avg Speed (km/h)", dql: `${base} | filter isNotNull(speed.kmh) | summarize avg = avg(speed.kmh)` },
      ];
    case "automotive/ota_updates":
      return [
        { title: "Successful Updates", dql: `${base} | filter event.subtype == "INSTALL_SUCCESS" | summarize count = count()` },
        { title: "Failed Updates", dql: `${base} | filter event.subtype == "INSTALL_FAIL" | summarize count = count()` },
        { title: "Rollbacks", dql: `${base} | filter event.subtype == "ROLLBACK" | summarize count = count()` },
        { title: "Update Success Rate (%)", dql: `${base} | summarize total = count(), ok = countIf(event.subtype == "INSTALL_SUCCESS") | fieldsAdd rate = ok / total * 100` },
      ];
    case "automotive/ev_charging":
      return [
        { title: "Completed Sessions", dql: `${base} | filter event.type == "EV_SESSION" | summarize count = count()` },
        { title: "Failed Sessions", dql: `${base} | filter event.type == "EV_SESSION_FAILED" | summarize count = count()` },
        { title: "Total Energy Delivered (kWh)", dql: `${base} | filter isNotNull(session.kwh) | summarize total = sum(session.kwh)` },
        { title: "Total Revenue ($)", dql: `${base} | filter isNotNull(revenue) | summarize total = sum(revenue)` },
      ];

    // ── Point of Sale & Hospitality ────────────────────────────────────────
    case "pos/transactions":
      return [
        { title: "Sales", dql: `${base} | filter event.subtype == "SALE" | summarize count = count()` },
        { title: "Voids", dql: `${base} | filter event.subtype == "VOID" | summarize count = count()` },
        { title: "Total Revenue ($)", dql: `${base} | filter event.subtype == "SALE" | filter isNotNull(amount) | summarize total = sum(amount)` },
        { title: "Avg Transaction Value ($)", dql: `${base} | filter isNotNull(amount) | summarize avg = avg(amount)` },
      ];
    case "pos/terminal_health":
      return [
        { title: "Online Terminals", dql: `${base} | filter terminal.status == "ONLINE" | summarize count = countDistinctExact(terminal.id)` },
        { title: "Offline Terminals", dql: `${base} | filter terminal.status == "OFFLINE" | summarize count = countDistinctExact(terminal.id)` },
        { title: "Degraded Terminals", dql: `${base} | filter terminal.status == "DEGRADED" | summarize count = countDistinctExact(terminal.id)` },
        { title: "Avg Uptime (%)", dql: `${base} | filter isNotNull(uptime.pct) | summarize avg = avg(uptime.pct)` },
      ];
    case "pos/kitchen":
      return [
        { title: "Orders Routed to KDS", dql: `${base} | filter event.type == "KDS_EVENT" | summarize count = count()` },
        { title: "KDS Delays", dql: `${base} | filter event.type == "KDS_DELAY" | summarize count = count()` },
        { title: "Routing Failures", dql: `${base} | filter event.type == "KDS_ROUTING_FAILURE" | summarize count = count()` },
        { title: "Avg Prep Time (min)", dql: `${base} | filter isNotNull(prep.time_ms) | summarize avg_min = avg(prep.time_ms) / 60000` },
      ];

    // ── Airlines & Aviation ────────────────────────────────────────────────
    case "airlines/flight_ops":
      return [
        { title: "On-Time Rate (%)", dql: `${base} | filter event.type == "FLIGHT_EVENT" | summarize total = count(), ontime = countIf(on.time == true) | fieldsAdd rate = ontime / total * 100` },
        { title: "Delays", dql: `${base} | filter event.subtype == "DELAYED" | summarize count = count()` },
        { title: "Cancellations", dql: `${base} | filter event.subtype == "CANCELLED" | summarize count = count()` },
        { title: "Total Passengers", dql: `${base} | filter isNotNull(passengers) | summarize total = sum(passengers)` },
      ];
    case "airlines/passenger":
      return [
        { title: "Check-Ins", dql: `${base} | filter event.subtype == "CHECK_IN" | summarize count = count()` },
        { title: "Boarding Events", dql: `${base} | filter event.subtype == "BOARDING" | summarize count = count()` },
        { title: "Document Issues", dql: `${base} | filter exception == "DOCUMENT_ISSUE" | summarize count = count()` },
        { title: "Frequent Flyers", dql: `${base} | filter frequent.flyer == true | summarize count = count()` },
      ];
    case "airlines/ground_ops":
      return [
        { title: "Ground Ops Completed", dql: `${base} | filter event.type == "GROUND_OPS" | summarize count = count()` },
        { title: "Turn Delays", dql: `${base} | filter event.type == "GROUND_DELAY" | summarize count = count()` },
        { title: "Ground Failures", dql: `${base} | filter event.type == "GROUND_FAILURE" | summarize count = count()` },
        { title: "Avg Turn Time (min)", dql: `${base} | filter isNotNull(turn.minutes) | summarize avg = avg(turn.minutes)` },
      ];

    // ── IoT & Industrial ───────────────────────────────────────────────────
    case "iot/device_fleet":
      return [
        { title: "Online Devices", dql: `${base} | filter device.status == "ONLINE" | summarize count = countDistinctExact(device.id)` },
        { title: "Offline Devices", dql: `${base} | filter device.status == "OFFLINE" | summarize count = countDistinctExact(device.id)` },
        { title: "Critical Alerts", dql: `${base} | filter event.subtype == "ALERT" | summarize count = count()` },
        { title: "Outdated Firmware Devices", dql: `${base} | filter firmware.latest == false | summarize count = countDistinctExact(device.id)` },
      ];
    case "iot/sensor_telemetry":
      return [
        { title: "Sensor Readings", dql: `${base} | filter event.type == "SENSOR_READING" | summarize count = count()` },
        { title: "Threshold Breaches", dql: `${base} | filter threshold.breach == true | summarize count = count()` },
        { title: "Anomalies Detected", dql: `${base} | filter event.type == "SENSOR_ANOMALY" | summarize count = count()` },
        { title: "Avg Anomaly Score", dql: `${base} | filter isNotNull(anomaly.score) | summarize avg = avg(anomaly.score)` },
      ];
    case "iot/firmware":
      return [
        { title: "Successful Updates", dql: `${base} | filter event.subtype == "INSTALL_SUCCESS" | summarize count = count()` },
        { title: "Failed Updates", dql: `${base} | filter event.subtype == "INSTALL_FAIL" | summarize count = count()` },
        { title: "Rollbacks", dql: `${base} | filter event.subtype == "ROLLBACK" | summarize count = count()` },
        { title: "Update Success Rate (%)", dql: `${base} | summarize total = count(), ok = countIf(event.subtype == "INSTALL_SUCCESS") | fieldsAdd rate = ok / total * 100` },
      ];

    // ── Media & Streaming ──────────────────────────────────────────────────
    case "media/video_delivery":
      return [
        { title: "Active Sessions", dql: `${base} | summarize count = countDistinctExact(session.id)` },
        { title: "Playback Errors", dql: `${base} | filter event.subtype == "PLAYBACK_ERROR" | summarize count = count()` },
        { title: "Buffering Events", dql: `${base} | filter event.subtype == "BUFFER_START" | summarize count = count()` },
        { title: "Avg Startup Time (ms)", dql: `${base} | filter isNotNull(startup.time_ms) | summarize avg = avg(startup.time_ms)` },
      ];
    case "media/live_streaming":
      return [
        { title: "Peak Concurrent Viewers", dql: `${base} | filter event.type == "LIVE_STREAM" | summarize peak = max(viewers)` },
        { title: "Stream Errors", dql: `${base} | filter event.type == "LIVE_ERROR" | summarize count = count()` },
        { title: "Degradation Events", dql: `${base} | filter event.type == "LIVE_DEGRADATION" | summarize count = count()` },
        { title: "Active Streams", dql: `${base} | filter event.type == "LIVE_STREAM" | summarize count = countDistinctExact(stream.id)` },
      ];
    case "media/ad_insertion":
      return [
        { title: "Ad Requests", dql: `${base} | filter event.subtype == "AD_REQUEST" | summarize count = count()` },
        { title: "Ad Errors", dql: `${base} | filter event.subtype == "AD_ERROR" | summarize count = count()` },
        { title: "Avg Fill Rate", dql: `${base} | filter isNotNull(fill.rate) | summarize avg = avg(fill.rate)` },
        { title: "Total Ad Revenue ($)", dql: `${base} | filter isNotNull(revenue.cpm) | summarize total = sum(revenue.cpm)` },
      ];

    // ── Default ────────────────────────────────────────────────────────────
    default:
      return [
        { title: "Total Events", dql: `${base} | summarize count = count()` },
        { title: "Error Rate (%)", dql: `${base} | summarize total = count(), errs = countIf(log.level == "ERROR") | fieldsAdd rate = errs / total * 100` },
        { title: "Active Services", dql: `${base} | summarize services = countDistinctExact(service.name)` },
        { title: "Unique Hosts", dql: `${base} | summarize hosts = countDistinctExact(dt.entity.host)` },
      ];
  }
}

function getCharts(base: string, ucKey: string): TileDef[] {
  switch (ucKey) {
    // ── Financial Services ─────────────────────────────────────────────────
    case "financial/payments":
      return [
        { title: "Transaction Volume by Type", dql: `${base} | filter event.type == "TRANSACTION_COMPLETED" | makeTimeseries count = count(), by:{transaction.type}`, viz: "lineChart" },
        { title: "Transactions by Payment Method", dql: `${base} | summarize count = count(), by:{payment.method} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Decline Reasons", dql: `${base} | filter event.type == "TRANSACTION_DECLINED" | summarize count = count(), by:{decline.reason} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Revenue by Customer Tier", dql: `${base} | filter event.type == "TRANSACTION_COMPLETED" | summarize revenue = sum(transaction.amount), by:{customer.tier}`, viz: "pieChart" },
      ];
    case "financial/fraud":
      return [
        { title: "Fraud Events Over Time by Type", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "lineChart" },
        { title: "Rule Trigger Frequency", dql: `${base} | summarize count = count(), by:{rule.triggered} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Top Fraud Reasons", dql: `${base} | filter isNotNull(fraud.reason) | summarize count = count(), by:{fraud.reason} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Action Distribution", dql: `${base} | filter isNotNull(action.taken) | summarize count = count(), by:{action.taken}`, viz: "pieChart" },
      ];
    case "financial/trading":
      return [
        { title: "Order Volume Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "lineChart" },
        { title: "Top Traded Symbols", dql: `${base} | filter event.type == "ORDER_EXECUTED" | summarize count = count(), by:{instrument.symbol} | sort count desc | limit 10`, viz: "categoricalBarChart" },
        { title: "Reject Reasons", dql: `${base} | filter event.type == "ORDER_REJECTED" | summarize count = count(), by:{reject.reason} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Executions by Venue", dql: `${base} | filter event.type == "ORDER_EXECUTED" | summarize count = count(), by:{venue}`, viz: "pieChart" },
      ];

    // ── Healthcare ─────────────────────────────────────────────────────────
    case "healthcare/patient_portal":
      return [
        { title: "Patient Actions Over Time", dql: `${base} | filter event.type == "PATIENT_ACTION" | makeTimeseries count = count(), by:{action}`, viz: "lineChart" },
        { title: "Actions by Department", dql: `${base} | filter isNotNull(department) | summarize count = count(), by:{department} | sort count desc`, viz: "categoricalBarChart" },
        { title: "EHR Errors by Code", dql: `${base} | filter event.type == "EHR_INTEGRATION_FAILURE" | summarize count = count(), by:{error.code} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Auth Method Distribution", dql: `${base} | filter isNotNull(mfa.method) | summarize count = count(), by:{mfa.method}`, viz: "pieChart" },
      ];
    case "healthcare/claims":
      return [
        { title: "Claims Volume by Type", dql: `${base} | makeTimeseries count = count(), by:{claim.type}`, viz: "lineChart" },
        { title: "Denial Reasons", dql: `${base} | filter isNotNull(denial.reason) | summarize count = count(), by:{denial.reason} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Claim Status Distribution", dql: `${base} | summarize count = count(), by:{claim.status} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Auto vs Manual Adjudication", dql: `${base} | summarize count = count(), by:{auto.adjudicated}`, viz: "pieChart" },
      ];
    case "healthcare/ehr":
      return [
        { title: "HL7 Throughput Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "lineChart" },
        { title: "Messages by Type", dql: `${base} | filter isNotNull(hl7.message_type) | summarize count = count(), by:{hl7.message_type} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Failures by Facility", dql: `${base} | filter event.type == "HL7_FAILURE" | summarize count = count(), by:{facility} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Event Type Distribution", dql: `${base} | summarize count = count(), by:{event.type}`, viz: "pieChart" },
      ];

    // ── Retail & E-Commerce ────────────────────────────────────────────────
    case "retail/orders":
      return [
        { title: "Order Volume by Customer Segment", dql: `${base} | makeTimeseries count = count(), by:{customer.segment}`, viz: "lineChart" },
        { title: "Orders by Product Category", dql: `${base} | summarize count = count(), by:{product.category} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Warehouse Performance", dql: `${base} | summarize count = count(), by:{warehouse.id} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Carrier Distribution", dql: `${base} | filter isNotNull(carrier) | summarize count = count(), by:{carrier}`, viz: "pieChart" },
      ];
    case "retail/inventory":
      return [
        { title: "Stock Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "lineChart" },
        { title: "Events by Warehouse", dql: `${base} | summarize count = count(), by:{warehouse.id} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Stock-Outs Over Time", dql: `${base} | filter event.type == "STOCKOUT" | makeTimeseries count = count()`, viz: "lineChart" },
        { title: "Event Type Distribution", dql: `${base} | summarize count = count(), by:{event.type}`, viz: "pieChart" },
      ];
    case "retail/cx":
      return [
        { title: "Browse Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "lineChart" },
        { title: "Page Type Distribution", dql: `${base} | filter isNotNull(page.type) | summarize count = count(), by:{page.type} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Checkout Failure Reasons", dql: `${base} | filter event.type == "CHECKOUT_FAILURE" | summarize count = count(), by:{error.code} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Event Type Split", dql: `${base} | summarize count = count(), by:{event.type}`, viz: "pieChart" },
      ];

    // ── Telecommunications ─────────────────────────────────────────────────
    case "telco/network":
      return [
        { title: "Network Events by Metric Type", dql: `${base} | makeTimeseries count = count(), by:{metric.type}`, viz: "lineChart" },
        { title: "Breaches by Region", dql: `${base} | filter threshold.breach == true | summarize count = count(), by:{region} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Ticket Priority Distribution", dql: `${base} | filter isNotNull(ticket.priority) | summarize count = count(), by:{ticket.priority} | sort ticket.priority asc`, viz: "categoricalBarChart" },
        { title: "Technology Distribution", dql: `${base} | summarize count = count(), by:{technology}`, viz: "pieChart" },
      ];
    case "telco/billing":
      return [
        { title: "Usage Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "lineChart" },
        { title: "Usage by Type", dql: `${base} | filter event.type == "USAGE_EVENT" | summarize count = count(), by:{usage.type} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Rating Failures Over Time", dql: `${base} | filter event.type == "RATING_FAILURE" | makeTimeseries count = count()`, viz: "lineChart" },
        { title: "Event Type Distribution", dql: `${base} | summarize count = count(), by:{event.type}`, viz: "pieChart" },
      ];
    case "telco/care":
      return [
        { title: "Tickets Over Time by Type", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "lineChart" },
        { title: "Tickets by Priority", dql: `${base} | filter isNotNull(priority) | summarize count = count(), by:{priority} | sort priority asc`, viz: "categoricalBarChart" },
        { title: "Action Mix", dql: `${base} | filter isNotNull(action) | summarize count = count(), by:{action} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Routing Failures Over Time", dql: `${base} | filter event.type == "ROUTING_FAILURE" | makeTimeseries count = count()`, viz: "areaChart" },
      ];

    // ── Manufacturing ──────────────────────────────────────────────────────
    case "manufacturing/production":
      return [
        { title: "OEE Score Over Time by Line", dql: `${base} | filter isNotNull(oee.score) | makeTimeseries avg_oee = avg(oee.score), by:{line.id}`, viz: "lineChart" },
        { title: "Defect Rate Trend", dql: `${base} | filter isNotNull(defect.rate) | makeTimeseries avg_defects = avg(defect.rate)`, viz: "lineChart" },
        { title: "Downtime Root Causes", dql: `${base} | filter isNotNull(downtime.reason) | summarize count = count(), by:{downtime.reason} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Events by Machine Type", dql: `${base} | summarize count = count(), by:{machine.type}`, viz: "pieChart" },
      ];
    case "manufacturing/quality":
      return [
        { title: "Inspection Volume Over Time", dql: `${base} | makeTimeseries count = count(), by:{result}`, viz: "lineChart" },
        { title: "Defect Codes", dql: `${base} | filter isNotNull(defect.code) | summarize count = count(), by:{defect.code} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Result Distribution", dql: `${base} | summarize count = count(), by:{result}`, viz: "pieChart" },
        { title: "Defect Rate Trend", dql: `${base} | filter isNotNull(defect.rate) | makeTimeseries avg = avg(defect.rate)`, viz: "lineChart" },
      ];
    case "manufacturing/supply_chain":
      return [
        { title: "PO Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "lineChart" },
        { title: "PO Actions Distribution", dql: `${base} | filter event.type == "PO_EVENT" | summarize count = count(), by:{action} | sort count desc`, viz: "categoricalBarChart" },
        { title: "SLA Breaches Over Time", dql: `${base} | filter event.type == "SUPPLIER_SLA_BREACH" | makeTimeseries count = count()`, viz: "lineChart" },
        { title: "Event Type Distribution", dql: `${base} | summarize count = count(), by:{event.type}`, viz: "pieChart" },
      ];

    // ── Insurance ──────────────────────────────────────────────────────────
    case "insurance/claims":
      return [
        { title: "Claims Volume Over Time", dql: `${base} | makeTimeseries count = count(), by:{claim.status}`, viz: "lineChart" },
        { title: "Claims Value by Severity", dql: `${base} | summarize total = sum(claim.amount), by:{claim.severity} | sort total desc`, viz: "categoricalBarChart" },
        { title: "SLA Status Distribution", dql: `${base} | summarize count = count(), by:{sla.status}`, viz: "pieChart" },
        { title: "Policy Type Distribution", dql: `${base} | summarize count = count(), by:{policy.type} | sort count desc`, viz: "categoricalBarChart" },
      ];
    case "insurance/underwriting":
      return [
        { title: "Decisions Over Time", dql: `${base} | makeTimeseries count = count(), by:{decision}`, viz: "lineChart" },
        { title: "Decision Mix", dql: `${base} | filter isNotNull(decision) | summarize count = count(), by:{decision}`, viz: "pieChart" },
        { title: "Premium by Policy Type", dql: `${base} | filter isNotNull(premium) | summarize avg_premium = avg(premium), by:{policy.type} | sort avg_premium desc`, viz: "categoricalBarChart" },
        { title: "Avg Latency Over Time (ms)", dql: `${base} | filter isNotNull(latency_ms) | makeTimeseries avg_latency = avg(latency_ms)`, viz: "lineChart" },
      ];
    case "insurance/policy":
      return [
        { title: "Policy Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "lineChart" },
        { title: "Action Mix", dql: `${base} | filter isNotNull(action) | summarize count = count(), by:{action} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Failure Codes", dql: `${base} | filter event.type == "POLICY_FAILURE" | summarize count = count(), by:{error.code} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Action Distribution", dql: `${base} | filter isNotNull(action) | summarize count = count(), by:{action}`, viz: "pieChart" },
      ];

    // ── Gaming & Media ─────────────────────────────────────────────────────
    case "gaming/sessions":
      return [
        { title: "Player Activity Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "lineChart" },
        { title: "Players by Region", dql: `${base} | summarize count = count(), by:{player.region} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Game Mode Distribution", dql: `${base} | filter isNotNull(game.mode) | summarize count = count(), by:{game.mode}`, viz: "pieChart" },
        { title: "Avg Latency by Region (ms)", dql: `${base} | filter isNotNull(latency_ms) | summarize avg = avg(latency_ms), by:{player.region} | sort avg desc`, viz: "categoricalBarChart" },
      ];
    case "gaming/monetization":
      return [
        { title: "IAP Revenue Over Time", dql: `${base} | filter event.type == "IAP" | makeTimeseries revenue = sum(amount)`, viz: "areaChart" },
        { title: "IAP Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "lineChart" },
        { title: "Failure Reasons", dql: `${base} | filter event.type == "IAP_FAILED" | summarize count = count(), by:{error.code} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Revenue by Currency", dql: `${base} | filter event.type == "IAP" | summarize revenue = sum(amount), by:{currency}`, viz: "pieChart" },
      ];
    case "gaming/live_ops":
      return [
        { title: "Players Online Over Time", dql: `${base} | filter event.type == "LIVEOPS" | makeTimeseries avg_players = avg(players.online)`, viz: "areaChart" },
        { title: "CPU Over Time (%)", dql: `${base} | filter isNotNull(cpu.pct) | makeTimeseries avg_cpu = avg(cpu.pct)`, viz: "lineChart" },
        { title: "Incidents by Severity", dql: `${base} | filter event.type == "LIVEOPS_INCIDENT" | summarize count = count(), by:{incident.severity} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Events by Region", dql: `${base} | filter isNotNull(server.region) | summarize count = count(), by:{server.region}`, viz: "pieChart" },
      ];

    // ── Logistics & Delivery ───────────────────────────────────────────────
    case "logistics/last_mile":
      return [
        { title: "Delivery Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "lineChart" },
        { title: "Delivery Success by Zone", dql: `${base} | filter event.subtype == "DELIVERED" | summarize count = count(), by:{zone} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Failure Reasons", dql: `${base} | filter isNotNull(failure.reason) | summarize count = count(), by:{failure.reason} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Carrier Distribution", dql: `${base} | summarize count = count(), by:{carrier}`, viz: "pieChart" },
      ];
    case "logistics/warehouse":
      return [
        { title: "Warehouse Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "lineChart" },
        { title: "Events by Zone", dql: `${base} | summarize count = count(), by:{zone} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Exceptions by Type", dql: `${base} | filter event.subtype == "EXCEPTION" | summarize count = count(), by:{exception.type} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Events by Warehouse", dql: `${base} | summarize count = count(), by:{warehouse.id}`, viz: "pieChart" },
      ];
    case "logistics/fleet":
      return [
        { title: "Fleet Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "lineChart" },
        { title: "Fault Codes", dql: `${base} | filter isNotNull(fault.code) | summarize count = count(), by:{fault.code} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Faults by Severity", dql: `${base} | filter isNotNull(severity) | summarize count = count(), by:{severity} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Events by Make", dql: `${base} | summarize count = count(), by:{make}`, viz: "pieChart" },
      ];

    // ── Energy & Utilities ─────────────────────────────────────────────────
    case "energy/smart_grid":
      return [
        { title: "Grid Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "lineChart" },
        { title: "Avg Load Over Time (MW)", dql: `${base} | filter isNotNull(load.mw) | makeTimeseries avg_load = avg(load.mw)`, viz: "areaChart" },
        { title: "Events by Node Type", dql: `${base} | summarize count = count(), by:{node.type} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Events by Region", dql: `${base} | summarize count = count(), by:{region}`, viz: "pieChart" },
      ];
    case "energy/outage":
      return [
        { title: "Outage Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "lineChart" },
        { title: "Outage Causes", dql: `${base} | filter isNotNull(cause) | summarize count = count(), by:{cause} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Customers Affected Over Time", dql: `${base} | filter isNotNull(customers.affected) | makeTimeseries total = sum(customers.affected)`, viz: "areaChart" },
        { title: "Events by Region", dql: `${base} | summarize count = count(), by:{region}`, viz: "pieChart" },
      ];
    case "energy/metering":
      return [
        { title: "Meter Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "lineChart" },
        { title: "Tamper Types", dql: `${base} | filter event.type == "TAMPER_ALERT" | summarize count = count(), by:{tamper.type} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Energy Read Over Time (kWh)", dql: `${base} | filter isNotNull(reading.kwh) | makeTimeseries total = sum(reading.kwh)`, viz: "areaChart" },
        { title: "Event Type Distribution", dql: `${base} | summarize count = count(), by:{event.type}`, viz: "pieChart" },
      ];

    // ── Automotive & Connected Vehicles ────────────────────────────────────
    case "automotive/telematics":
      return [
        { title: "Vehicle Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "lineChart" },
        { title: "Alerts by Type", dql: `${base} | filter isNotNull(alert.type) | summarize count = count(), by:{alert.type} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Avg Speed Over Time (km/h)", dql: `${base} | filter isNotNull(speed.kmh) | makeTimeseries avg_speed = avg(speed.kmh)`, viz: "areaChart" },
        { title: "Events by Make", dql: `${base} | summarize count = count(), by:{make}`, viz: "pieChart" },
      ];
    case "automotive/ota_updates":
      return [
        { title: "OTA Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "lineChart" },
        { title: "Failure Reasons", dql: `${base} | filter isNotNull(failure.reason) | summarize count = count(), by:{failure.reason} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Update Outcome Distribution", dql: `${base} | summarize count = count(), by:{event.subtype}`, viz: "pieChart" },
        { title: "Download Speed Over Time (Mbps)", dql: `${base} | filter isNotNull(download.speed.mbps) | makeTimeseries avg_speed = avg(download.speed.mbps)`, viz: "lineChart" },
      ];
    case "automotive/ev_charging":
      return [
        { title: "EV Sessions Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "lineChart" },
        { title: "Session Failure Reasons", dql: `${base} | filter isNotNull(fail.reason) | summarize count = count(), by:{fail.reason} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Energy Delivered Over Time (kWh)", dql: `${base} | filter isNotNull(session.kwh) | makeTimeseries total = sum(session.kwh)`, viz: "areaChart" },
        { title: "Sessions by Region", dql: `${base} | summarize count = count(), by:{region}`, viz: "pieChart" },
      ];

    // ── Point of Sale & Hospitality ────────────────────────────────────────
    case "pos/transactions":
      return [
        { title: "Transaction Volume by Tender", dql: `${base} | filter isNotNull(tender.type) | makeTimeseries count = count(), by:{tender.type}`, viz: "lineChart" },
        { title: "Errors by Store", dql: `${base} | filter isNotNull(error.code) | summarize count = count(), by:{store.id} | sort count desc | limit 15`, viz: "categoricalBarChart" },
        { title: "Tender Type Distribution", dql: `${base} | filter isNotNull(tender.type) | summarize count = count(), by:{tender.type}`, viz: "pieChart" },
        { title: "Voids Over Time", dql: `${base} | filter event.subtype == "VOID" | makeTimeseries count = count()`, viz: "areaChart" },
      ];
    case "pos/terminal_health":
      return [
        { title: "Status Mix Over Time", dql: `${base} | makeTimeseries count = count(), by:{terminal.status}`, viz: "lineChart" },
        { title: "Software Versions", dql: `${base} | filter isNotNull(software.version) | summarize count = countDistinctExact(terminal.id), by:{software.version} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Terminals by Region", dql: `${base} | filter isNotNull(region) | summarize count = countDistinctExact(terminal.id), by:{region} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Status Distribution", dql: `${base} | summarize count = count(), by:{terminal.status}`, viz: "pieChart" },
      ];
    case "pos/kitchen":
      return [
        { title: "KDS Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "lineChart" },
        { title: "Activity by Station", dql: `${base} | filter isNotNull(station.id) | summarize count = count(), by:{station.id} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Routing Failure Reasons", dql: `${base} | filter event.type == "KDS_ROUTING_FAILURE" | summarize count = count(), by:{fail.reason} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Event Type Distribution", dql: `${base} | summarize count = count(), by:{event.type}`, viz: "pieChart" },
      ];

    // ── Airlines & Aviation ────────────────────────────────────────────────
    case "airlines/flight_ops":
      return [
        { title: "Flight Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "lineChart" },
        { title: "Delay Reasons", dql: `${base} | filter event.subtype == "DELAYED" | filter isNotNull(delay.reason) | summarize count = count(), by:{delay.reason} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Aircraft Type Distribution", dql: `${base} | filter isNotNull(aircraft.type) | summarize count = count(), by:{aircraft.type} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Flights by Airline", dql: `${base} | filter event.type == "FLIGHT_EVENT" | summarize count = count(), by:{airline}`, viz: "pieChart" },
      ];
    case "airlines/passenger":
      return [
        { title: "Passenger Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "lineChart" },
        { title: "Events by Channel", dql: `${base} | summarize count = count(), by:{channel} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Class Distribution", dql: `${base} | summarize count = count(), by:{class}`, viz: "pieChart" },
        { title: "Exceptions Over Time", dql: `${base} | filter isNotNull(exception) | makeTimeseries count = count(), by:{exception}`, viz: "lineChart" },
      ];
    case "airlines/ground_ops":
      return [
        { title: "Ground Ops Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "lineChart" },
        { title: "Turn Delays by Stage", dql: `${base} | filter event.type == "GROUND_DELAY" | summarize count = count(), by:{stage} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Ground Failure Reasons", dql: `${base} | filter event.type == "GROUND_FAILURE" | summarize count = count(), by:{fail.reason} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Avg Turn Time Over Time (min)", dql: `${base} | filter isNotNull(turn.minutes) | makeTimeseries avg = avg(turn.minutes)`, viz: "areaChart" },
      ];

    // ── IoT & Industrial ───────────────────────────────────────────────────
    case "iot/device_fleet":
      return [
        { title: "Device Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "lineChart" },
        { title: "Device Status Distribution", dql: `${base} | summarize count = count(), by:{device.status} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Alert Types", dql: `${base} | filter event.subtype == "ALERT" | summarize count = count(), by:{alert.type} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Events by Device Type", dql: `${base} | summarize count = count(), by:{device.type}`, viz: "pieChart" },
      ];
    case "iot/sensor_telemetry":
      return [
        { title: "Sensor Readings Over Time", dql: `${base} | makeTimeseries count = count(), by:{sensor.type}`, viz: "lineChart" },
        { title: "Readings by Sensor Type", dql: `${base} | summarize count = count(), by:{sensor.type} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Anomaly Score Over Time", dql: `${base} | filter isNotNull(anomaly.score) | makeTimeseries avg_score = avg(anomaly.score)`, viz: "areaChart" },
        { title: "Threshold Breach Distribution", dql: `${base} | filter isNotNull(threshold.type) | summarize count = count(), by:{threshold.type}`, viz: "pieChart" },
      ];
    case "iot/firmware":
      return [
        { title: "Firmware Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "lineChart" },
        { title: "Failure Reasons", dql: `${base} | filter event.subtype == "INSTALL_FAIL" | summarize count = count(), by:{fail.reason} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Adoption by Target Version", dql: `${base} | filter isNotNull(firmware.version.to) | summarize count = countDistinctExact(device.id), by:{firmware.version.to} | sort count desc | limit 10`, viz: "categoricalBarChart" },
        { title: "Update Outcome Distribution", dql: `${base} | summarize count = count(), by:{event.subtype}`, viz: "pieChart" },
      ];

    // ── Media & Streaming ──────────────────────────────────────────────────
    case "media/video_delivery":
      return [
        { title: "Playback Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "lineChart" },
        { title: "Errors by Code", dql: `${base} | filter event.subtype == "PLAYBACK_ERROR" | summarize count = count(), by:{error.code} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Sessions by Device Type", dql: `${base} | summarize count = count(), by:{device.type}`, viz: "pieChart" },
        { title: "Avg Rebuffering Ratio Over Time", dql: `${base} | filter isNotNull(rebuffering.ratio) | makeTimeseries avg_rebuf = avg(rebuffering.ratio)`, viz: "areaChart" },
      ];
    case "media/live_streaming":
      return [
        { title: "Viewers Over Time", dql: `${base} | filter event.type == "LIVE_STREAM" | makeTimeseries avg_viewers = avg(viewers)`, viz: "areaChart" },
        { title: "Stream Events by Type", dql: `${base} | summarize count = count(), by:{event.type} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Events by CDN PoP", dql: `${base} | filter isNotNull(cdn.pop) | summarize count = count(), by:{cdn.pop}`, viz: "pieChart" },
        { title: "Encoder Health Over Time", dql: `${base} | makeTimeseries count = count(), by:{encoder.health}`, viz: "lineChart" },
      ];
    case "media/ad_insertion":
      return [
        { title: "Ad Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "lineChart" },
        { title: "Ad Error Reasons", dql: `${base} | filter event.subtype == "AD_ERROR" | summarize count = count(), by:{error.type} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Fill Rate Over Time", dql: `${base} | filter isNotNull(fill.rate) | makeTimeseries avg_fill = avg(fill.rate)`, viz: "areaChart" },
        { title: "Ad Type Distribution", dql: `${base} | summarize count = count(), by:{ad.type}`, viz: "pieChart" },
      ];

    // ── Default ────────────────────────────────────────────────────────────
    default:
      return [
        { title: "Events by Type Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "lineChart" },
        { title: "Events by Service", dql: `${base} | summarize count = count(), by:{service.name} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Events by Region", dql: `${base} | summarize count = count(), by:{geo.region} | sort count desc`, viz: "categoricalBarChart" },
        { title: "Log Level Distribution", dql: `${base} | summarize count = count(), by:{log.level}`, viz: "pieChart" },
      ];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout assembly
// ─────────────────────────────────────────────────────────────────────────────

function buildDashboardContent(params: DashboardParams): unknown {
  const { scenarioName, vertical, useCase, customerName, documentName } = params;
  const q = esc(scenarioName);
  // Base prefix used by every tile query: scenario filter only.
  // Dashboard variables are declared for discoverability but NOT auto-applied
  // to base — Dynatrace's `["*"]` wildcard does not expand inside `in()`, so
  // forcing the filter into every query zero-outs results until the user
  // narrows the dropdown.
  const base = `fetch logs | filter scenario.name == "${q}"`;
  const ucKey = `${vertical}/${useCase}`;
  const kpiDefs = getKPIs(base, ucKey);
  const chartDefs = getCharts(base, ucKey);
  const palette = paletteFor(vertical);

  const tiles: Record<string, unknown> = {};
  const layouts: Record<string, { x: number; y: number; w: number; h: number }> = {};
  let idx = 0;

  const place = (tile: unknown, x: number, y: number, w: number, h: number) => {
    tiles[String(idx)] = tile;
    layouts[String(idx)] = { x, y, w, h };
    idx++;
  };

  const verticalLabel = vertical.charAt(0).toUpperCase() + vertical.slice(1);
  const useCaseLabel = useCase.split("_").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");

  // Header banner
  const meta = `**Scenario:** \`${scenarioName}\` &nbsp;·&nbsp; **Vertical:** ${verticalLabel} &nbsp;·&nbsp; **Use Case:** ${useCaseLabel}${customerName ? ` &nbsp;·&nbsp; **Customer:** ${customerName}` : ""}`;
  place(
    md(`# ${documentName}\n${meta}\n\nReal-time KPI monitoring for **${verticalLabel} / ${useCaseLabel}** — generated by LaunchLog.`),
    0, 0, 24, 3,
  );

  // ── Overview section ──
  place(sectionTile("Executive Summary", "AnalyticsIcon", palette[0]), 0, 3, 24, 1);

  kpiDefs.forEach(({ title, dql }, i) => {
    place(kpiTile(title, dql), i * 6, 4, 6, 4);
  });

  // ── Activity Trends section ──
  place(sectionTile("Activity Trends", "GlobeIcon", palette[1]), 0, 8, 24, 1);

  // Event volume area chart (left) + geo/breakdown tile (right).
  // Map only renders for verticals with meaningful physical footprint
  // (retail / telco / logistics / energy / automotive / pos / airlines / iot).
  // Other verticals get an event-subtype breakdown instead.
  place(
    chartTile("Event Volume Over Time", `${base} | makeTimeseries count = count()`, "areaChart", palette),
    0, 9, 12, 7,
  );
  if (GEO_RELEVANT.has(vertical)) {
    // Geo bubbleMap — flat field names so the viz auto-detects lat/lon and
    // avoids dotted-identifier issues in `by:{...}` / `fields`.
    place(
      chartTile(
        "Geo Distribution",
        `${base}
| filter isNotNull(geo.lat)
| fieldsRename latitude = geo.lat, longitude = geo.lon, city = geo.city, country = geo.country, region = geo.region
| summarize count = count(), by:{city, country, region, latitude, longitude}
| fields latitude, longitude, city, country, region, count`,
        "bubbleMap",
        palette,
      ),
      12, 9, 12, 7,
    );
  } else {
    place(
      chartTile(
        "Event Mix Over Time",
        `${base} | makeTimeseries count = count(), by:{event.type}`,
        "lineChart",
        palette,
      ),
      12, 9, 12, 7,
    );
  }

  // ── Breakdown section ──
  place(sectionTile("Breakdown", "AnalyticsIcon", palette[2]), 0, 16, 24, 1);

  // 4 vertical-specific charts in 2×2
  chartDefs.forEach(({ title, dql, viz }, i) => {
    const col = (i % 2) * 12;
    const row = 17 + Math.floor(i / 2) * 7;
    place(chartTile(title, dql, viz ?? "lineChart", palette), col, row, 12, 7);
  });

  const breakdownEndRow = 17 + Math.ceil(chartDefs.length / 2) * 7;

  // ── Log Health section ──
  place(sectionTile("Log Health", "AlertIcon", palette[3]), 0, breakdownEndRow, 24, 1);

  place(
    chartTile(
      "Log Level Distribution",
      `${base} | summarize count = count(), by:{log.level}`,
      "donutChart",
      palette,
    ),
    0, breakdownEndRow + 1, 8, 6,
  );
  place(
    chartTile(
      "Top Services by Event Volume",
      `${base} | summarize count = count(), by:{service.name} | sort count desc | limit 15`,
      "categoricalBarChart",
      palette,
    ),
    8, breakdownEndRow + 1, 16, 6,
  );

  return {
    version: 21,
    variables: [],
    tiles,
    layouts,
    settings: {},
    importedWithCode: false,
  };
}

export function buildDashboard(params: DashboardParams): {
  name: string;
  type: string;
  isPrivate: boolean;
  content: string;
} {
  return {
    name: params.documentName,
    type: "dashboard",
    isPrivate: false,
    content: JSON.stringify(buildDashboardContent(params)),
  };
}
