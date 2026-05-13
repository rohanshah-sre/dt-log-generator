export interface DashboardParams {
  scenarioName: string;
  vertical: string;
  useCase: string;
  customerName?: string;
  documentName: string;
}

const Q_SETTINGS = {
  enabledConnections: [] as unknown[],
  maxResultRecords: 1000,
  defaultScanLimitGbytes: 500,
  maxResultMegaBytes: 1,
  allowRealTimeTarget: true,
};

// Viz types use SCREAMING_SNAKE_CASE as required by the Dynatrace Dashboards JSON schema
type Viz = "SINGLE_VALUE" | "GRAPH_CHART" | "CATEGORICAL_BAR_CHART" | "PIE_CHART" | "MAP" | "TABLE";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

function dt(title: string, query: string, viz: Viz = "SINGLE_VALUE") {
  return {
    type: "data",
    title,
    queries: [
      {
        id: "A",
        type: "DQL",
        query,
        enabled: true,
        querySettings: Q_SETTINGS,
      },
    ],
    visualConfig: { type: viz },
  };
}

function md(content: string) {
  return { type: "markdown", content };
}

interface TileDef {
  title: string;
  dql: string;
  viz?: Viz;
}

// ─────────────────────────────────────────────────────────────────────────────
// KPIs — four single-value tiles per use case
// ─────────────────────────────────────────────────────────────────────────────
function getKPIs(q: string, ucKey: string): TileDef[] {
  const base = `fetch logs | filter scenario.name == "${q}"`;

  switch (ucKey) {
    // ── Financial ──────────────────────────────────────────────────────────
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

    // ── Retail ─────────────────────────────────────────────────────────────
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

    // ── Telco ──────────────────────────────────────────────────────────────
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

    // ── Gaming ─────────────────────────────────────────────────────────────
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

    // ── Logistics ──────────────────────────────────────────────────────────
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

    // ── Energy ─────────────────────────────────────────────────────────────
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

    // ── Automotive ─────────────────────────────────────────────────────────
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

    // ── Point of Sale ──────────────────────────────────────────────────────
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

    // ── Airlines ───────────────────────────────────────────────────────────
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

    // ── IoT ────────────────────────────────────────────────────────────────
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

    // ── Media ──────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Vertical-specific charts — four tiles placed in a 2×2 grid below the KPIs
// ─────────────────────────────────────────────────────────────────────────────
function getCharts(q: string, ucKey: string): TileDef[] {
  const base = `fetch logs | filter scenario.name == "${q}"`;

  switch (ucKey) {
    case "financial/payments":
      return [
        { title: "Transaction Volume by Type", dql: `${base} | filter event.type == "TRANSACTION_COMPLETED" | makeTimeseries count = count(), by:{transaction.type}`, viz: "GRAPH_CHART" },
        { title: "Transactions by Payment Method", dql: `${base} | summarize count = count(), by:{payment.method} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Decline Reasons", dql: `${base} | filter event.type == "TRANSACTION_DECLINED" | summarize count = count(), by:{decline.reason} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Revenue by Customer Tier", dql: `${base} | filter event.type == "TRANSACTION_COMPLETED" | summarize revenue = sum(transaction.amount), by:{customer.tier}`, viz: "PIE_CHART" },
      ];
    case "financial/fraud":
      return [
        { title: "Fraud Events Over Time by Type", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "GRAPH_CHART" },
        { title: "Rule Trigger Frequency", dql: `${base} | summarize count = count(), by:{rule.triggered} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Top Fraud Reasons", dql: `${base} | filter isNotNull(fraud.reason) | summarize count = count(), by:{fraud.reason} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Action Distribution", dql: `${base} | filter isNotNull(action.taken) | summarize count = count(), by:{action.taken}`, viz: "PIE_CHART" },
      ];
    case "financial/trading":
      return [
        { title: "Order Volume Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "GRAPH_CHART" },
        { title: "Top Traded Symbols", dql: `${base} | filter event.type == "ORDER_EXECUTED" | summarize count = count(), by:{instrument.symbol} | sort count desc | limit 10`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Reject Reasons", dql: `${base} | filter event.type == "ORDER_REJECTED" | summarize count = count(), by:{reject.reason} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Executions by Venue", dql: `${base} | filter event.type == "ORDER_EXECUTED" | summarize count = count(), by:{venue}`, viz: "PIE_CHART" },
      ];
    case "healthcare/patient_portal":
      return [
        { title: "Patient Actions Over Time", dql: `${base} | filter event.type == "PATIENT_ACTION" | makeTimeseries count = count(), by:{action}`, viz: "GRAPH_CHART" },
        { title: "Actions by Department", dql: `${base} | filter isNotNull(department) | summarize count = count(), by:{department} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "EHR Errors by Code", dql: `${base} | filter event.type == "EHR_INTEGRATION_FAILURE" | summarize count = count(), by:{error.code} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Auth Method Distribution", dql: `${base} | filter isNotNull(mfa.method) | summarize count = count(), by:{mfa.method}`, viz: "PIE_CHART" },
      ];
    case "healthcare/claims":
      return [
        { title: "Claims Volume by Type", dql: `${base} | makeTimeseries count = count(), by:{claim.type}`, viz: "GRAPH_CHART" },
        { title: "Denial Reasons", dql: `${base} | filter isNotNull(denial.reason) | summarize count = count(), by:{denial.reason} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Claim Status Distribution", dql: `${base} | summarize count = count(), by:{claim.status} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Auto vs Manual Adjudication", dql: `${base} | summarize count = count(), by:{auto.adjudicated}`, viz: "PIE_CHART" },
      ];
    case "healthcare/ehr":
      return [
        { title: "HL7 Throughput Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "GRAPH_CHART" },
        { title: "Messages by Type", dql: `${base} | filter isNotNull(hl7.message_type) | summarize count = count(), by:{hl7.message_type} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Failures by Facility", dql: `${base} | filter event.type == "HL7_FAILURE" | summarize count = count(), by:{facility} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Event Type Distribution", dql: `${base} | summarize count = count(), by:{event.type}`, viz: "PIE_CHART" },
      ];
    case "retail/orders":
      return [
        { title: "Order Volume by Customer Segment", dql: `${base} | makeTimeseries count = count(), by:{customer.segment}`, viz: "GRAPH_CHART" },
        { title: "Orders by Product Category", dql: `${base} | summarize count = count(), by:{product.category} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Warehouse Performance", dql: `${base} | summarize count = count(), by:{warehouse.id} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Carrier Distribution", dql: `${base} | filter isNotNull(carrier) | summarize count = count(), by:{carrier}`, viz: "PIE_CHART" },
      ];
    case "retail/inventory":
      return [
        { title: "Stock Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "GRAPH_CHART" },
        { title: "Events by Warehouse", dql: `${base} | summarize count = count(), by:{warehouse.id} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Stock-Outs Over Time", dql: `${base} | filter event.type == "STOCKOUT" | makeTimeseries count = count()`, viz: "GRAPH_CHART" },
        { title: "Event Type Distribution", dql: `${base} | summarize count = count(), by:{event.type}`, viz: "PIE_CHART" },
      ];
    case "retail/cx":
      return [
        { title: "Browse Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "GRAPH_CHART" },
        { title: "Page Type Distribution", dql: `${base} | filter isNotNull(page.type) | summarize count = count(), by:{page.type} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Checkout Failure Reasons", dql: `${base} | filter event.type == "CHECKOUT_FAILURE" | summarize count = count(), by:{error.code} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Event Type Split", dql: `${base} | summarize count = count(), by:{event.type}`, viz: "PIE_CHART" },
      ];
    case "telco/network":
      return [
        { title: "Network Events by Metric Type", dql: `${base} | makeTimeseries count = count(), by:{metric.type}`, viz: "GRAPH_CHART" },
        { title: "Breaches by Region", dql: `${base} | filter threshold.breach == true | summarize count = count(), by:{region} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Ticket Priority Distribution", dql: `${base} | filter isNotNull(ticket.priority) | summarize count = count(), by:{ticket.priority} | sort ticket.priority asc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Technology Distribution", dql: `${base} | summarize count = count(), by:{technology}`, viz: "PIE_CHART" },
      ];
    case "telco/billing":
      return [
        { title: "Usage Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "GRAPH_CHART" },
        { title: "Usage by Type", dql: `${base} | filter event.type == "USAGE_EVENT" | summarize count = count(), by:{usage.type} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Rating Failures Over Time", dql: `${base} | filter event.type == "RATING_FAILURE" | makeTimeseries count = count()`, viz: "GRAPH_CHART" },
        { title: "Event Type Distribution", dql: `${base} | summarize count = count(), by:{event.type}`, viz: "PIE_CHART" },
      ];
    case "manufacturing/production":
      return [
        { title: "OEE Score Over Time by Line", dql: `${base} | filter isNotNull(oee.score) | makeTimeseries avg_oee = avg(oee.score), by:{line.id}`, viz: "GRAPH_CHART" },
        { title: "Defect Rate Trend", dql: `${base} | filter isNotNull(defect.rate) | makeTimeseries avg_defects = avg(defect.rate)`, viz: "GRAPH_CHART" },
        { title: "Downtime Root Causes", dql: `${base} | filter isNotNull(downtime.reason) | summarize count = count(), by:{downtime.reason} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Events by Machine Type", dql: `${base} | summarize count = count(), by:{machine.type}`, viz: "PIE_CHART" },
      ];
    case "manufacturing/quality":
      return [
        { title: "Inspection Volume Over Time", dql: `${base} | makeTimeseries count = count(), by:{result}`, viz: "GRAPH_CHART" },
        { title: "Defect Codes", dql: `${base} | filter isNotNull(defect.code) | summarize count = count(), by:{defect.code} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Result Distribution", dql: `${base} | summarize count = count(), by:{result}`, viz: "PIE_CHART" },
        { title: "Defect Rate Trend", dql: `${base} | filter isNotNull(defect.rate) | makeTimeseries avg = avg(defect.rate)`, viz: "GRAPH_CHART" },
      ];
    case "manufacturing/supply_chain":
      return [
        { title: "PO Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "GRAPH_CHART" },
        { title: "PO Actions Distribution", dql: `${base} | filter event.type == "PO_EVENT" | summarize count = count(), by:{action} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "SLA Breaches Over Time", dql: `${base} | filter event.type == "SUPPLIER_SLA_BREACH" | makeTimeseries count = count()`, viz: "GRAPH_CHART" },
        { title: "Event Type Distribution", dql: `${base} | summarize count = count(), by:{event.type}`, viz: "PIE_CHART" },
      ];
    case "insurance/claims":
      return [
        { title: "Claims Volume Over Time", dql: `${base} | makeTimeseries count = count(), by:{claim.status}`, viz: "GRAPH_CHART" },
        { title: "Claims Value by Severity", dql: `${base} | summarize total = sum(claim.amount), by:{claim.severity} | sort total desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "SLA Status Distribution", dql: `${base} | summarize count = count(), by:{sla.status}`, viz: "PIE_CHART" },
        { title: "Policy Type Distribution", dql: `${base} | summarize count = count(), by:{policy.type} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
      ];
    case "insurance/underwriting":
      return [
        { title: "Decisions Over Time", dql: `${base} | makeTimeseries count = count(), by:{decision}`, viz: "GRAPH_CHART" },
        { title: "Decision Mix", dql: `${base} | filter isNotNull(decision) | summarize count = count(), by:{decision}`, viz: "PIE_CHART" },
        { title: "Premium by Policy Type", dql: `${base} | filter isNotNull(premium) | summarize avg_premium = avg(premium), by:{policy.type} | sort avg_premium desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Avg Latency Over Time (ms)", dql: `${base} | filter isNotNull(latency_ms) | makeTimeseries avg_latency = avg(latency_ms)`, viz: "GRAPH_CHART" },
      ];
    case "gaming/sessions":
      return [
        { title: "Player Activity Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "GRAPH_CHART" },
        { title: "Players by Region", dql: `${base} | summarize count = count(), by:{player.region} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Game Mode Distribution", dql: `${base} | filter isNotNull(game.mode) | summarize count = count(), by:{game.mode}`, viz: "PIE_CHART" },
        { title: "Avg Latency by Region (ms)", dql: `${base} | filter isNotNull(latency_ms) | summarize avg = avg(latency_ms), by:{player.region} | sort avg desc`, viz: "CATEGORICAL_BAR_CHART" },
      ];
    case "gaming/monetization":
      return [
        { title: "IAP Revenue Over Time", dql: `${base} | filter event.type == "IAP" | makeTimeseries revenue = sum(amount)`, viz: "GRAPH_CHART" },
        { title: "IAP Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "GRAPH_CHART" },
        { title: "Failure Reasons", dql: `${base} | filter event.type == "IAP_FAILED" | summarize count = count(), by:{error.code} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Revenue by Currency", dql: `${base} | filter event.type == "IAP" | summarize revenue = sum(amount), by:{currency}`, viz: "PIE_CHART" },
      ];
    case "gaming/live_ops":
      return [
        { title: "Players Online Over Time", dql: `${base} | filter event.type == "LIVEOPS" | makeTimeseries avg_players = avg(players.online)`, viz: "GRAPH_CHART" },
        { title: "CPU Over Time (%)", dql: `${base} | filter isNotNull(cpu.pct) | makeTimeseries avg_cpu = avg(cpu.pct)`, viz: "GRAPH_CHART" },
        { title: "Incidents by Severity", dql: `${base} | filter event.type == "LIVEOPS_INCIDENT" | summarize count = count(), by:{incident.severity} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Events by Region", dql: `${base} | filter isNotNull(server.region) | summarize count = count(), by:{server.region}`, viz: "PIE_CHART" },
      ];
    case "logistics/last_mile":
      return [
        { title: "Delivery Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "GRAPH_CHART" },
        { title: "Delivery Success by Zone", dql: `${base} | filter event.subtype == "DELIVERED" | summarize count = count(), by:{zone} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Failure Reasons", dql: `${base} | filter isNotNull(failure.reason) | summarize count = count(), by:{failure.reason} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Carrier Distribution", dql: `${base} | summarize count = count(), by:{carrier}`, viz: "PIE_CHART" },
      ];
    case "logistics/warehouse":
      return [
        { title: "Warehouse Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "GRAPH_CHART" },
        { title: "Events by Zone", dql: `${base} | summarize count = count(), by:{zone} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Exceptions by Type", dql: `${base} | filter event.subtype == "EXCEPTION" | summarize count = count(), by:{exception.type} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Events by Warehouse", dql: `${base} | summarize count = count(), by:{warehouse.id}`, viz: "PIE_CHART" },
      ];
    case "logistics/fleet":
      return [
        { title: "Fleet Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "GRAPH_CHART" },
        { title: "Fault Codes", dql: `${base} | filter isNotNull(fault.code) | summarize count = count(), by:{fault.code} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Faults by Severity", dql: `${base} | filter isNotNull(severity) | summarize count = count(), by:{severity} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Events by Make", dql: `${base} | summarize count = count(), by:{make}`, viz: "PIE_CHART" },
      ];
    case "energy/smart_grid":
      return [
        { title: "Grid Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "GRAPH_CHART" },
        { title: "Avg Load Over Time (MW)", dql: `${base} | filter isNotNull(load.mw) | makeTimeseries avg_load = avg(load.mw)`, viz: "GRAPH_CHART" },
        { title: "Events by Node Type", dql: `${base} | summarize count = count(), by:{node.type} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Events by Region", dql: `${base} | summarize count = count(), by:{region}`, viz: "PIE_CHART" },
      ];
    case "energy/outage":
      return [
        { title: "Outage Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "GRAPH_CHART" },
        { title: "Outage Causes", dql: `${base} | filter isNotNull(cause) | summarize count = count(), by:{cause} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Customers Affected Over Time", dql: `${base} | filter isNotNull(customers.affected) | makeTimeseries total = sum(customers.affected)`, viz: "GRAPH_CHART" },
        { title: "Events by Region", dql: `${base} | summarize count = count(), by:{region}`, viz: "PIE_CHART" },
      ];
    case "energy/metering":
      return [
        { title: "Meter Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "GRAPH_CHART" },
        { title: "Tamper Types", dql: `${base} | filter event.type == "TAMPER_ALERT" | summarize count = count(), by:{tamper.type} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Energy Read Over Time (kWh)", dql: `${base} | filter isNotNull(reading.kwh) | makeTimeseries total = sum(reading.kwh)`, viz: "GRAPH_CHART" },
        { title: "Event Type Distribution", dql: `${base} | summarize count = count(), by:{event.type}`, viz: "PIE_CHART" },
      ];
    case "automotive/telematics":
      return [
        { title: "Vehicle Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "GRAPH_CHART" },
        { title: "Alerts by Type", dql: `${base} | filter isNotNull(alert.type) | summarize count = count(), by:{alert.type} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Avg Speed Over Time (km/h)", dql: `${base} | filter isNotNull(speed.kmh) | makeTimeseries avg_speed = avg(speed.kmh)`, viz: "GRAPH_CHART" },
        { title: "Events by Make", dql: `${base} | summarize count = count(), by:{make}`, viz: "PIE_CHART" },
      ];
    case "automotive/ota_updates":
      return [
        { title: "OTA Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "GRAPH_CHART" },
        { title: "Failure Reasons", dql: `${base} | filter isNotNull(failure.reason) | summarize count = count(), by:{failure.reason} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Update Outcome Distribution", dql: `${base} | summarize count = count(), by:{event.subtype}`, viz: "PIE_CHART" },
        { title: "Download Speed Over Time (Mbps)", dql: `${base} | filter isNotNull(download.speed.mbps) | makeTimeseries avg_speed = avg(download.speed.mbps)`, viz: "GRAPH_CHART" },
      ];
    case "automotive/ev_charging":
      return [
        { title: "EV Sessions Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "GRAPH_CHART" },
        { title: "Session Failure Reasons", dql: `${base} | filter isNotNull(fail.reason) | summarize count = count(), by:{fail.reason} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Energy Delivered Over Time (kWh)", dql: `${base} | filter isNotNull(session.kwh) | makeTimeseries total = sum(session.kwh)`, viz: "GRAPH_CHART" },
        { title: "Sessions by Region", dql: `${base} | summarize count = count(), by:{region}`, viz: "PIE_CHART" },
      ];
    case "airlines/flight_ops":
      return [
        { title: "Flight Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "GRAPH_CHART" },
        { title: "Delay Reasons", dql: `${base} | filter event.subtype == "DELAYED" | filter isNotNull(delay.reason) | summarize count = count(), by:{delay.reason} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Aircraft Type Distribution", dql: `${base} | filter isNotNull(aircraft.type) | summarize count = count(), by:{aircraft.type} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Flights by Airline", dql: `${base} | filter event.type == "FLIGHT_EVENT" | summarize count = count(), by:{airline}`, viz: "PIE_CHART" },
      ];
    case "airlines/passenger":
      return [
        { title: "Passenger Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "GRAPH_CHART" },
        { title: "Events by Channel", dql: `${base} | summarize count = count(), by:{channel} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Class Distribution", dql: `${base} | summarize count = count(), by:{class}`, viz: "PIE_CHART" },
        { title: "Exceptions Over Time", dql: `${base} | filter isNotNull(exception) | makeTimeseries count = count(), by:{exception}`, viz: "GRAPH_CHART" },
      ];
    case "airlines/ground_ops":
      return [
        { title: "Ground Ops Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "GRAPH_CHART" },
        { title: "Turn Delays by Stage", dql: `${base} | filter event.type == "GROUND_DELAY" | summarize count = count(), by:{stage} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Ground Failure Reasons", dql: `${base} | filter event.type == "GROUND_FAILURE" | summarize count = count(), by:{fail.reason} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Avg Turn Time Over Time (min)", dql: `${base} | filter isNotNull(turn.minutes) | makeTimeseries avg = avg(turn.minutes)`, viz: "GRAPH_CHART" },
      ];
    case "iot/device_fleet":
      return [
        { title: "Device Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "GRAPH_CHART" },
        { title: "Device Status Distribution", dql: `${base} | summarize count = count(), by:{device.status} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Alert Types", dql: `${base} | filter event.subtype == "ALERT" | summarize count = count(), by:{alert.type} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Events by Device Type", dql: `${base} | summarize count = count(), by:{device.type}`, viz: "PIE_CHART" },
      ];
    case "iot/sensor_telemetry":
      return [
        { title: "Sensor Readings Over Time", dql: `${base} | makeTimeseries count = count(), by:{sensor.type}`, viz: "GRAPH_CHART" },
        { title: "Readings by Sensor Type", dql: `${base} | summarize count = count(), by:{sensor.type} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Anomaly Score Over Time", dql: `${base} | filter isNotNull(anomaly.score) | makeTimeseries avg_score = avg(anomaly.score)`, viz: "GRAPH_CHART" },
        { title: "Threshold Breach Distribution", dql: `${base} | filter isNotNull(threshold.type) | summarize count = count(), by:{threshold.type}`, viz: "PIE_CHART" },
      ];
    case "media/video_delivery":
      return [
        { title: "Playback Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "GRAPH_CHART" },
        { title: "Errors by Code", dql: `${base} | filter event.subtype == "PLAYBACK_ERROR" | summarize count = count(), by:{error.code} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Sessions by Device Type", dql: `${base} | summarize count = count(), by:{device.type}`, viz: "PIE_CHART" },
        { title: "Avg Rebuffering Ratio Over Time", dql: `${base} | filter isNotNull(rebuffering.ratio) | makeTimeseries avg_rebuf = avg(rebuffering.ratio)`, viz: "GRAPH_CHART" },
      ];
    case "media/live_streaming":
      return [
        { title: "Viewers Over Time", dql: `${base} | filter event.type == "LIVE_STREAM" | makeTimeseries avg_viewers = avg(viewers)`, viz: "GRAPH_CHART" },
        { title: "Stream Events by Type", dql: `${base} | summarize count = count(), by:{event.type} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Events by CDN PoP", dql: `${base} | filter isNotNull(cdn.pop) | summarize count = count(), by:{cdn.pop}`, viz: "PIE_CHART" },
        { title: "Encoder Health Over Time", dql: `${base} | makeTimeseries count = count(), by:{encoder.health}`, viz: "GRAPH_CHART" },
      ];
    case "media/ad_insertion":
      return [
        { title: "Ad Events Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.subtype}`, viz: "GRAPH_CHART" },
        { title: "Ad Error Reasons", dql: `${base} | filter event.subtype == "AD_ERROR" | summarize count = count(), by:{error.type} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Fill Rate Over Time", dql: `${base} | filter isNotNull(fill.rate) | makeTimeseries avg_fill = avg(fill.rate)`, viz: "GRAPH_CHART" },
        { title: "Ad Type Distribution", dql: `${base} | summarize count = count(), by:{ad.type}`, viz: "PIE_CHART" },
      ];

    // ── Default ────────────────────────────────────────────────────────────
    default:
      return [
        { title: "Events by Type Over Time", dql: `${base} | makeTimeseries count = count(), by:{event.type}`, viz: "GRAPH_CHART" },
        { title: "Events by Service", dql: `${base} | summarize count = count(), by:{service.name} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Events by Region", dql: `${base} | summarize count = count(), by:{geo.region} | sort count desc`, viz: "CATEGORICAL_BAR_CHART" },
        { title: "Log Level Distribution", dql: `${base} | summarize count = count(), by:{log.level}`, viz: "PIE_CHART" },
      ];
  }
}

function buildDashboardContent(params: DashboardParams): unknown {
  const { scenarioName, vertical, useCase, customerName, documentName } = params;
  const q = esc(scenarioName);
  const base = `fetch logs | filter scenario.name == "${q}"`;
  const ucKey = `${vertical}/${useCase}`;
  const kpiDefs = getKPIs(q, ucKey);
  const chartDefs = getCharts(q, ucKey);

  const tiles: Record<string, unknown> = {};
  const layouts: Record<string, { x: number; y: number; w: number; h: number }> = {};
  let idx = 0;

  const place = (tile: unknown, x: number, y: number, w: number, h: number) => {
    tiles[String(idx)] = tile;
    layouts[String(idx)] = { x, y, w, h };
    idx++;
  };

  // Row 0: markdown header (full width, h=2)
  const subtitle = customerName ? `  \n**Customer:** ${customerName}` : "";
  place(
    md(`## ${documentName}  \n**Scenario:** ${scenarioName} · **Vertical:** ${vertical} · **Use Case:** ${useCase}${subtitle}`),
    0, 0, 24, 2,
  );

  // Row 1: 4 KPI tiles (y=2, h=3, w=6 each)
  kpiDefs.forEach(({ title, dql }, i) => {
    place(dt(title, dql, "SINGLE_VALUE"), i * 6, 2, 6, 3);
  });

  // Row 2: Event volume over time (full width, y=5, h=5)
  place(
    dt("Event Volume Over Time", `${base} | makeTimeseries count = count()`, "GRAPH_CHART"),
    0, 5, 24, 5,
  );

  // Rows 3+: vertical-specific charts, 2 per row at w=12 each
  chartDefs.forEach(({ title, dql, viz }, i) => {
    place(dt(title, dql, viz ?? "GRAPH_CHART"), (i % 2) * 12, 10 + Math.floor(i / 2) * 5, 12, 5);
  });

  // Final row: Geo distribution (w=16) + log level donut (w=8)
  const finalRow = 10 + Math.ceil(chartDefs.length / 2) * 5;
  place(
    dt(
      "Geo Distribution",
      `${base} | summarize count = count(), latitude = avg(geo.lat), longitude = avg(geo.lon), by:{geo.city, geo.country} | filter isNotNull(latitude) | sort count desc | limit 100`,
      "MAP",
    ),
    0, finalRow, 16, 6,
  );
  place(
    dt("Log Level Distribution", `${base} | summarize count = count(), by:{log.level}`, "PIE_CHART"),
    16, finalRow, 8, 6,
  );

  return {
    version: 21,
    variables: [],
    tiles,
    layouts,
    settings: {
      defaultTimeframe: {
        value: { from: "now()-2h", to: "now()" },
        enabled: true,
      },
    },
    annotations: [],
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
