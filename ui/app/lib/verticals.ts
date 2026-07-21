export type VerticalKey =
  | "financial"
  | "healthcare"
  | "retail"
  | "telco"
  | "manufacturing"
  | "insurance"
  | "gaming"
  | "logistics"
  | "energy"
  | "automotive"
  | "pos"
  | "airlines"
  | "iot"
  | "media"
  | "cash_valuables"
  | "digital_retail"
  | "atm_services";

export type UseCaseKey = string;

export type TileKind =
  | "kpi"
  | "timeseries"
  | "bar"
  | "pie"
  | "donut"
  | "table"
  | "markdown"
  | "funnel"
  | "histogram"
  | "area"
  | "stacked_area";

/** Lightweight summary used for the wizard preview. */
export interface TileSummary {
  title: string;
  kind: TileKind;
}

export interface UseCase {
  key: UseCaseKey;
  name: string;
  description: string;
  services: string[];
  businessValue: string;
  /** Tile titles + kinds shown in the wizard preview. */
  tiles: TileSummary[];
}

export interface Vertical {
  key: VerticalKey;
  name: string;
  description: string;
  icon: string;
  useCases: UseCase[];
}

// ---- summary helper -------------------------------------------------------

const t = (title: string, kind: TileKind): TileSummary => ({ title, kind });

// ---- vertical definitions -------------------------------------------------

export const VERTICALS: Vertical[] = [
  // ---------- Financial Services ----------
  {
    key: "financial",
    name: "Financial Services",
    description: "Payment flows, fraud detection, and trading platforms.",
    icon: "💳",
    useCases: [
      {
        key: "payments",
        name: "Payment Processing",
        description: "Checkout flows, authorizations, and settlements across card networks.",
        services: ["payment-gateway", "fraud-service", "account-ledger", "notification-service", "auth-service"],
        businessValue:
          "Quantify payment success rate, fraud capture, and end-to-end latency to protect revenue at checkout.",
        tiles: [
          t("Transaction Success Rate", "kpi"),
          t("Revenue Processed", "kpi"),
          t("p95 Authorization Latency", "kpi"),
          t("Fraud Prevention Saves", "kpi"),
          t("Decline Rate", "kpi"),
          t("Transaction Volume by Type", "timeseries"),
          t("Authorization Latency Trend (p50 vs p95)", "timeseries"),
          t("Transactions by Payment Method", "bar"),
          t("Decline Reasons", "bar"),
          t("Customer Tier Revenue Split", "donut"),
          t("Fraud Score Distribution", "histogram"),
          t("Recent High-Value Transactions", "table"),
          t("Fraud Alerts in Last Hour", "table"),
        ],
      },
      {
        key: "fraud",
        name: "Fraud Detection",
        description: "Risk scoring, transaction blocking, and analyst case workflows.",
        services: ["fraud-engine", "ml-scoring-service", "case-management", "notification-service", "rules-engine"],
        businessValue: "Show ML scoring throughput, false-positive rate, and case escalation funnel.",
        tiles: [
          t("Fraud Detection Rate", "kpi"),
          t("Estimated Fraud Blocked", "kpi"),
          t("Avg ML Inference Time", "kpi"),
          t("Cases Escalated", "kpi"),
          t("Model Version", "kpi"),
          t("Fraud Alerts Over Time by Reason", "timeseries"),
          t("Rule Trigger Frequency", "bar"),
          t("Fraud Score by Hour", "histogram"),
          t("Action Distribution", "donut"),
          t("Top Fraud Reasons", "bar"),
        ],
      },
      {
        key: "trading",
        name: "Trading Platform",
        description: "Order book, executions, and market data latency.",
        services: ["order-router", "matching-engine", "market-data", "risk-engine", "settlement-service"],
        businessValue: "Highlight order-to-execution latency and reject rates that drive trader satisfaction.",
        tiles: [
          t("Order Throughput", "kpi"),
          t("Reject Rate", "kpi"),
          t("p95 Execution Latency", "kpi"),
          t("Notional Traded", "kpi"),
          t("Executions by Venue", "bar"),
          t("Top Symbols", "bar"),
          t("Reject Reasons", "bar"),
          t("Latency Trend", "timeseries"),
        ],
      },
    ],
  },

  // ---------- Healthcare ----------
  {
    key: "healthcare",
    name: "Healthcare",
    description: "Patient journeys, claims processing, and EHR access.",
    icon: "🩺",
    useCases: [
      {
        key: "patient_portal",
        name: "Patient Portal",
        description: "Login, record access, and appointment booking traffic.",
        services: ["patient-portal", "ehr-service", "auth-service", "scheduling-service", "notification-service"],
        businessValue: "Improve patient self-service adoption while keeping HIPAA-sensitive flows performant.",
        tiles: [
          t("Portal Availability", "kpi"),
          t("Authentication Success Rate", "kpi"),
          t("Avg Session Duration", "kpi"),
          t("EHR Integration Errors", "kpi"),
          t("Active Departments", "kpi"),
          t("Patient Journey Funnel", "funnel"),
          t("Session Volume Over Time by Action", "timeseries"),
          t("Auth Method Distribution", "donut"),
          t("Errors by Department", "bar"),
          t("Record Access by Type", "bar"),
        ],
      },
      {
        key: "claims",
        name: "Claims Processing",
        description: "Submission, adjudication, and payment of medical claims.",
        services: ["claims-intake", "adjudication-engine", "eligibility-service", "payment-processor", "audit-service"],
        businessValue:
          "Drive auto-adjudication rate up and SLA breaches down — every percentage point is millions in operating cost.",
        tiles: [
          t("Auto-Adjudication Rate", "kpi"),
          t("SLA Compliance", "kpi"),
          t("Avg Processing Time", "kpi"),
          t("Total Claims Value", "kpi"),
          t("Denial Rate", "kpi"),
          t("Claims Lifecycle Funnel", "funnel"),
          t("Claims by Type Over Time", "timeseries"),
          t("Denial Reasons", "bar"),
          t("Processing Time Distribution", "histogram"),
          t("Auto vs Manual Adjudication", "stacked_area"),
        ],
      },
      {
        key: "ehr",
        name: "EHR Integration",
        description: "HL7 events, ADT messages, and lab result feeds.",
        services: ["hl7-gateway", "interface-engine", "ehr-service", "lab-feeder", "audit-service"],
        businessValue: "Spot integration drift across HL7 message types before clinicians notice missing data.",
        tiles: [
          t("HL7 Throughput", "kpi"),
          t("Failure Rate", "kpi"),
          t("p95 Processing Latency", "kpi"),
          t("Messages by Type", "bar"),
          t("Failures by Facility", "bar"),
          t("Throughput Over Time", "timeseries"),
        ],
      },
    ],
  },

  // ---------- Retail & E-Commerce ----------
  {
    key: "retail",
    name: "Retail & E-Commerce",
    description: "Orders, inventory, and fulfillment journeys.",
    icon: "🛒",
    useCases: [
      {
        key: "orders",
        name: "Order Management",
        description: "Place, fulfil, track, and return orders across warehouses.",
        services: ["order-service", "inventory-api", "payment-service", "fulfillment-service", "notification-service"],
        businessValue:
          "Tie checkout reliability and fulfillment SLA to direct revenue and customer-experience outcomes.",
        tiles: [
          t("Order Fulfillment Rate", "kpi"),
          t("Average Order Value", "kpi"),
          t("Same/Next-Day Rate", "kpi"),
          t("Cancellation Rate", "kpi"),
          t("Revenue at Risk", "kpi"),
          t("Order Flow Funnel", "funnel"),
          t("Order Volume by Customer Segment", "timeseries"),
          t("AOV by Product Category", "bar"),
          t("Warehouse Performance", "bar"),
          t("Carrier Distribution", "donut"),
        ],
      },
      {
        key: "inventory",
        name: "Inventory & Supply Chain",
        description: "Stock checks, replenishment, and warehouse activity.",
        services: ["inventory-api", "wms-service", "replenishment-service", "supplier-portal", "forecast-engine"],
        businessValue: "Detect stock-out risk and supplier latency before customers see empty shelves.",
        tiles: [
          t("Stock-Out Events", "kpi"),
          t("Replenishments Triggered", "kpi"),
          t("p95 Stock Check Latency", "kpi"),
          t("Activity by Warehouse", "bar"),
          t("Stock Events Over Time", "timeseries"),
        ],
      },
      {
        key: "cx",
        name: "Customer Experience",
        description: "Browse, cart abandonment, and promotional flows.",
        services: ["catalog-service", "cart-service", "promotions-engine", "search-service", "cdn-edge"],
        businessValue: "Trace browse → cart → checkout drop-off and the marketing levers that move conversion.",
        tiles: [
          t("Conversion Rate", "kpi"),
          t("Cart Abandonment Rate", "kpi"),
          t("Avg Session Latency", "kpi"),
          t("Browse → Cart → Checkout Funnel", "funnel"),
          t("Page Type Distribution", "donut"),
        ],
      },
    ],
  },

  // ---------- Telecommunications ----------
  {
    key: "telco",
    name: "Telecommunications",
    description: "Network operations, billing, and customer care.",
    icon: "📡",
    useCases: [
      {
        key: "network",
        name: "Network Operations",
        description: "Cell tower events, packet loss, and handoffs.",
        services: ["network-mgmt", "alarm-service", "capacity-planner", "fault-manager", "ticketing-service"],
        businessValue: "Translate raw network telemetry into subscriber-impact and ticket-priority business signals.",
        tiles: [
          t("Network Availability", "kpi"),
          t("Threshold Breach Rate", "kpi"),
          t("Active Nodes", "kpi"),
          t("Total Subscriber Impact", "kpi"),
          t("P1/P2 Open Tickets", "kpi"),
          t("Network Events by Metric Type", "timeseries"),
          t("Threshold Breaches by Region", "bar"),
          t("Subscriber Impact Over Time", "area"),
          t("Node Type Distribution", "donut"),
          t("Technology Distribution", "bar"),
          t("Top Impacted Nodes", "table"),
        ],
      },
      {
        key: "billing",
        name: "Billing & Provisioning",
        description: "Usage events, invoice generation, and activations.",
        services: ["billing-engine", "rating-service", "provisioning-service", "invoice-service", "tax-service"],
        businessValue: "See revenue leakage from billing failures within minutes, not at month-end close.",
        tiles: [
          t("Rating Success Rate", "kpi"),
          t("Provisioning Delays", "kpi"),
          t("Usage Type Mix", "donut"),
          t("Failures Over Time", "timeseries"),
        ],
      },
      {
        key: "care",
        name: "Customer Care",
        description: "Ticket creation, resolution, and escalations.",
        services: ["care-portal", "agent-desktop", "ticketing-service", "knowledge-base", "voice-gateway"],
        businessValue: "Understand contact-center reliability and routing efficiency in business terms.",
        tiles: [
          t("Resolution Rate", "kpi"),
          t("Tickets at SLA Risk", "kpi"),
          t("Tickets by Priority", "bar"),
          t("Ticket Volume Over Time", "timeseries"),
        ],
      },
    ],
  },

  // ---------- Manufacturing ----------
  {
    key: "manufacturing",
    name: "Manufacturing",
    description: "Production lines, quality control, and supply chain.",
    icon: "🏭",
    useCases: [
      {
        key: "production",
        name: "Production Line",
        description: "Machine events, throughput, and defects across lines.",
        services: ["mes-service", "scada-adapter", "quality-service", "maintenance-service", "erp-connector"],
        businessValue:
          "Lift OEE by surfacing micro-stoppages and quality holds the moment they happen on the floor.",
        tiles: [
          t("OEE Score", "kpi"),
          t("Units Produced", "kpi"),
          t("Defect Rate", "kpi"),
          t("Downtime Events", "kpi"),
          t("Active Lines", "kpi"),
          t("OEE Score Over Time per Line", "timeseries"),
          t("Units Produced by Shift", "bar"),
          t("Defect Rate Trend", "timeseries"),
          t("Downtime Root Cause", "bar"),
          t("Machine Type Events", "donut"),
          t("Top Performing Lines", "table"),
        ],
      },
      {
        key: "quality",
        name: "Quality Control",
        description: "Inspection results, reject rates, and compliance.",
        services: ["quality-service", "inspection-system", "compliance-service", "audit-service", "lab-system"],
        businessValue: "Catch reject-rate excursions before they become a recall.",
        tiles: [
          t("Pass Rate", "kpi"),
          t("Reject Rate", "kpi"),
          t("Defect Codes", "bar"),
          t("Inspection Volume", "timeseries"),
        ],
      },
      {
        key: "supply_chain",
        name: "Supply Chain",
        description: "PO events, supplier SLAs, and logistics.",
        services: ["scm-service", "supplier-portal", "logistics-tracker", "po-service", "carrier-api"],
        businessValue: "Quantify supplier reliability against SLA, on a rolling basis.",
        tiles: [
          t("Supplier SLA Compliance", "kpi"),
          t("Avg Delay (days)", "kpi"),
          t("PO Actions", "bar"),
          t("Top Suppliers at Risk", "table"),
        ],
      },
    ],
  },

  // ---------- Insurance ----------
  {
    key: "insurance",
    name: "Insurance",
    description: "Claims processing, underwriting, and policy management.",
    icon: "🛡️",
    useCases: [
      {
        key: "claims",
        name: "Claims Processing",
        description: "FNOL through settlement with SLA tracking.",
        services: ["claims-intake", "fnol-service", "adjuster-portal", "fraud-detection", "payment-service"],
        businessValue: "Compress cycle time and surface SLA breaches before they hit NPS.",
        tiles: [
          t("SLA Compliance Rate", "kpi"),
          t("Fraud Indicator Rate", "kpi"),
          t("Total Value at Risk", "kpi"),
          t("Avg Days Open", "kpi"),
          t("Catastrophic Claims", "kpi"),
          t("Claims Lifecycle Flow", "funnel"),
          t("Claims Value by Severity", "bar"),
          t("SLA Status Over Time", "stacked_area"),
          t("Policy Type Distribution", "donut"),
          t("Adjuster Workload", "table"),
        ],
      },
      {
        key: "underwriting",
        name: "Underwriting",
        description: "Risk assessment, quote generation, and bind.",
        services: ["uw-engine", "risk-scoring", "quote-service", "bind-service", "doc-service"],
        businessValue: "Track quote-to-bind and rules-engine throughput as proxies for new-business growth.",
        tiles: [
          t("Quote Approval Rate", "kpi"),
          t("Avg Premium", "kpi"),
          t("Decision Mix", "donut"),
          t("Decisions Over Time", "timeseries"),
        ],
      },
      {
        key: "policy",
        name: "Policy Management",
        description: "Renewals, endorsements, and cancellations.",
        services: ["policy-service", "renewal-engine", "endorsement-service", "billing-service", "doc-service"],
        businessValue: "Monitor retention-critical events live, not in monthly retros.",
        tiles: [
          t("Renewal Volume", "kpi"),
          t("Lapse Risk", "kpi"),
          t("Action Mix", "bar"),
          t("Policy Events Over Time", "timeseries"),
        ],
      },
    ],
  },

  // ---------- Gaming & Media ----------
  {
    key: "gaming",
    name: "Gaming & Media",
    description: "Player sessions, matchmaking, and monetization.",
    icon: "🎮",
    useCases: [
      {
        key: "sessions",
        name: "Player Sessions",
        description: "Login, matchmaking, in-game events, and disconnects.",
        services: ["matchmaking-service", "game-server", "auth-service", "leaderboard-service", "anti-cheat"],
        businessValue: "Tie infrastructure latency to retention and DAU — the only metrics studios actually care about.",
        tiles: [
          t("Concurrent Players", "kpi"),
          t("Match Win Rate", "kpi"),
          t("p95 Match Latency", "kpi"),
          t("Anti-Cheat Flags", "kpi"),
          t("Player Retention", "kpi"),
          t("Player Funnel", "funnel"),
          t("Player Activity by Subtype", "timeseries"),
          t("Players by Region", "bar"),
          t("Game Mode Distribution", "donut"),
          t("Avg Latency by Region", "bar"),
        ],
      },
      {
        key: "monetization",
        name: "Monetization",
        description: "IAP, currency, offers, and payment fraud.",
        services: ["iap-service", "currency-service", "offer-engine", "payment-service", "fraud-service"],
        businessValue: "See ARPU-driving events live alongside payment health.",
        tiles: [
          t("IAP Success Rate", "kpi"),
          t("Revenue", "kpi"),
          t("Fraud Flags", "kpi"),
          t("Failure Reasons", "bar"),
          t("Revenue Over Time", "timeseries"),
        ],
      },
      {
        key: "live_ops",
        name: "Live Operations",
        description: "Server health, event launches, and player counts.",
        services: ["liveops-service", "config-service", "matchmaker", "event-orchestrator", "telemetry-service"],
        businessValue: "Run launches with confidence — see player counts and server health side-by-side.",
        tiles: [
          t("Players Online (peak)", "kpi"),
          t("Incidents Open", "kpi"),
          t("Avg CPU", "kpi"),
          t("Players Online Over Time", "timeseries"),
          t("Incidents by Severity", "bar"),
        ],
      },
    ],
  },

  // ---------- Logistics & Delivery ----------
  {
    key: "logistics",
    name: "Logistics & Delivery",
    description: "Last-mile delivery, warehouse ops, and fleet telemetry.",
    icon: "📦",
    useCases: [
      {
        key: "last_mile",
        name: "Last-Mile Delivery",
        description: "Dispatch, route execution, and proof-of-delivery.",
        services: ["order-orchestrator", "routing-engine", "driver-app-api", "warehouse-mgmt", "notification-service", "tracking-service"],
        businessValue: "Make the cost-per-stop and on-time rate visible — the two metrics that move logistics P&L.",
        tiles: [
          t("On-Time Delivery Rate", "kpi"),
          t("Failed Delivery Rate", "kpi"),
          t("Packages In Transit", "kpi"),
          t("Avg Stops per Route", "kpi"),
          t("SLA Breaches", "kpi"),
          t("Delivery Funnel", "funnel"),
          t("Delivery Success by Zone", "bar"),
          t("Failure Reasons", "bar"),
          t("Carrier Performance", "bar"),
          t("Delivery Volume by SLA Type", "timeseries"),
        ],
      },
      {
        key: "warehouse",
        name: "Warehouse Operations",
        description: "Inbound, putaway, picking, and exception flows.",
        services: ["warehouse-mgmt", "wms-pick", "wms-pack", "conveyor-control", "tracking-service"],
        businessValue: "Spot picking bottlenecks and exception rates that throttle outbound volume.",
        tiles: [
          t("Throughput Rate", "kpi"),
          t("Exception Rate", "kpi"),
          t("Avg Processing Time", "kpi"),
          t("Activity by Zone", "bar"),
          t("Exceptions by Type", "bar"),
          t("Throughput Over Time", "timeseries"),
        ],
      },
      {
        key: "fleet",
        name: "Fleet & Vehicle Telemetry",
        description: "Driver behavior, vehicle health, and route adherence.",
        services: ["telematics-gateway", "fleet-analytics", "routing-engine", "diagnostics-service"],
        businessValue: "Translate vehicle telemetry into operational savings — fuel, downtime, and incidents.",
        tiles: [
          t("Active Vehicles", "kpi"),
          t("Critical Faults", "kpi"),
          t("Avg Speed", "kpi"),
          t("Faults by Make", "bar"),
          t("Fault Rate Over Time", "timeseries"),
        ],
      },
    ],
  },

  // ---------- Energy & Utilities ----------
  {
    key: "energy",
    name: "Energy & Utilities",
    description: "Smart grid, outage response, and metering.",
    icon: "⚡",
    useCases: [
      {
        key: "smart_grid",
        name: "Smart Grid Operations",
        description: "Real-time grid telemetry, anomalies, and switching.",
        services: ["grid-controller", "scada-service", "outage-manager", "meter-data-mgmt", "field-ops-dispatch", "notification-service"],
        businessValue: "Make grid availability and customer impact visible in one pane of glass for ops + execs.",
        tiles: [
          t("Grid Availability", "kpi"),
          t("Active Faults", "kpi"),
          t("Customers Affected", "kpi"),
          t("Auto-Restoration Rate", "kpi"),
          t("Avg Restoration Time", "kpi"),
          t("Grid Load by Region", "timeseries"),
          t("Fault Events by Severity", "stacked_area"),
          t("Fault Root Causes", "bar"),
          t("Node Type Risk", "bar"),
          t("Customer Impact Over Time", "area"),
          t("Critical Nodes", "table"),
        ],
      },
      {
        key: "outage",
        name: "Outage Detection & Response",
        description: "From outage start through customer restoration.",
        services: ["outage-manager", "field-ops-dispatch", "scada-service", "notification-service"],
        businessValue: "Compress MTTR and meet regulatory SAIDI/SAIFI commitments.",
        tiles: [
          t("Open Outages", "kpi"),
          t("Customers Without Power", "kpi"),
          t("Avg MTTR (min)", "kpi"),
          t("Reportable Outages", "kpi"),
          t("Outage Lifecycle Funnel", "funnel"),
          t("Outage Causes", "bar"),
          t("Outages by Region", "bar"),
        ],
      },
      {
        key: "metering",
        name: "Smart Meter Management",
        description: "AMI reads, missing meter data, and tamper detection.",
        services: ["meter-data-mgmt", "ami-collector", "tamper-detect", "billing-service"],
        businessValue: "Avoid revenue leakage from missed reads and tampering events.",
        tiles: [
          t("Meter Read Rate", "kpi"),
          t("Tamper Alerts", "kpi"),
          t("Reads Over Time", "timeseries"),
          t("Top Meter Issues", "bar"),
        ],
      },
    ],
  },

  // ---------- Automotive ----------
  {
    key: "automotive",
    name: "Automotive & Connected Vehicles",
    description: "Vehicle telemetry, OTA updates, and EV charging networks.",
    icon: "🚗",
    useCases: [
      {
        key: "telematics",
        name: "Connected Vehicle Telematics",
        description: "Trip events, alerts, and diagnostics from the connected fleet.",
        services: ["telematics-gateway", "ota-manager", "diagnostics-service", "fleet-analytics", "notification-service", "charging-network-api"],
        businessValue: "Tie vehicle telemetry to recall reach, safety alerts, and aftermarket revenue.",
        tiles: [
          t("Active Connected Vehicles", "kpi"),
          t("Critical Alerts", "kpi"),
          t("Crash Detection Events", "kpi"),
          t("OTA Coverage", "kpi"),
          t("Avg Telemetry Latency", "kpi"),
          t("Vehicle Alert Rate by Type", "timeseries"),
          t("Fleet Distribution by Make", "bar"),
          t("Alert Severity Breakdown", "donut"),
          t("Regional Fleet Activity", "bar"),
          t("Top Alert Types", "bar"),
          t("Recent Critical Alerts", "table"),
        ],
      },
      {
        key: "ota_updates",
        name: "Over-The-Air Software Updates",
        description: "Firmware delivery, install success, and rollbacks.",
        services: ["ota-manager", "telematics-gateway", "firmware-distributor", "diagnostics-service"],
        businessValue: "See OTA fleet adoption live — and roll back at the first sign of trouble.",
        tiles: [
          t("Install Success Rate", "kpi"),
          t("Rollback Rate", "kpi"),
          t("Avg Download Speed", "kpi"),
          t("OTA Funnel", "funnel"),
          t("Failure Reasons", "bar"),
          t("Versions In Flight", "bar"),
          t("Update Volume by Region", "timeseries"),
        ],
      },
      {
        key: "ev_charging",
        name: "EV Charging Network",
        description: "Charger availability, sessions, and revenue.",
        services: ["charging-network-api", "billing-service", "auth-service", "telematics-gateway"],
        businessValue: "Maximize charger utilization and minimize stranded sessions.",
        tiles: [
          t("Charger Availability", "kpi"),
          t("Avg Session kWh", "kpi"),
          t("Failed Sessions", "kpi"),
          t("Sessions by Region", "bar"),
          t("Sessions Over Time", "timeseries"),
        ],
      },
    ],
  },

  // ---------- Point of Sale & Hospitality ----------
  {
    key: "pos",
    name: "Point of Sale & Hospitality",
    description: "POS transactions, terminal health, and kitchen routing.",
    icon: "🏪",
    useCases: [
      {
        key: "transactions",
        name: "POS Transaction Processing",
        description: "Sale, refund, void, and tender mix.",
        services: ["pos-gateway", "payment-processor", "inventory-sync", "terminal-monitor", "kitchen-display-service", "loyalty-service"],
        businessValue: "Watch tender migration to contactless and revenue-per-hour live across stores.",
        tiles: [
          t("Transaction Success Rate", "kpi"),
          t("Revenue Processed", "kpi"),
          t("Avg Transaction Time", "kpi"),
          t("Loyalty Redemption Rate", "kpi"),
          t("Offline Terminals", "kpi"),
          t("Transaction Volume by Tender", "timeseries"),
          t("Revenue by Hour", "bar"),
          t("Tender Type Distribution", "donut"),
          t("Errors by Store", "bar"),
          t("Avg Time by Tender", "bar"),
          t("Voids Over Time", "area"),
        ],
      },
      {
        key: "terminal_health",
        name: "Terminal Fleet Health",
        description: "Heartbeats, software versions, and offline events.",
        services: ["terminal-monitor", "fleet-mgmt", "software-distribution"],
        businessValue: "Keep checkout lanes online — every offline minute is lost revenue.",
        tiles: [
          t("Online Terminals", "kpi"),
          t("Offline Terminals", "kpi"),
          t("Avg Uptime", "kpi"),
          t("Status Mix Over Time", "stacked_area"),
          t("Software Versions", "bar"),
        ],
      },
      {
        key: "kitchen",
        name: "Kitchen Display & Order Routing",
        description: "Order routing to KDS, prep times, and exceptions.",
        services: ["kitchen-display-service", "order-router", "pos-gateway"],
        businessValue: "Surface kitchen bottlenecks affecting drive-thru and dine-in throughput.",
        tiles: [
          t("Avg Prep Time", "kpi"),
          t("Routing Failures", "kpi"),
          t("Order Volume Over Time", "timeseries"),
          t("Failures by Station", "bar"),
        ],
      },
    ],
  },

  // ---------- Airlines & Aviation ----------
  {
    key: "airlines",
    name: "Airlines & Aviation",
    description: "Flight ops, passenger journeys, and ground operations.",
    icon: "✈️",
    useCases: [
      {
        key: "flight_ops",
        name: "Flight Operations",
        description: "Flight lifecycle, on-time performance, and disruption.",
        services: ["departure-control", "crew-management", "baggage-tracking", "gate-management", "catering-service", "fueling-service"],
        businessValue: "Track OTP and disruption cost in business terms — passengers, crews, fuel.",
        tiles: [
          t("On-Time Performance", "kpi"),
          t("Flights In Air", "kpi"),
          t("Avg Delay", "kpi"),
          t("Cancellation Rate", "kpi"),
          t("Passengers Impacted", "kpi"),
          t("Flight Status Over Time", "stacked_area"),
          t("Delay Reasons", "bar"),
          t("On-Time by Airline", "bar"),
          t("Delay Distribution", "histogram"),
          t("Aircraft Type Utilization", "donut"),
          t("Passenger Journey Funnel", "funnel"),
        ],
      },
      {
        key: "passenger",
        name: "Passenger Experience",
        description: "Check-in, baggage, security, boarding, and arrival flows.",
        services: ["check-in-portal", "baggage-tracking", "boarding-control", "lounge-mgmt"],
        businessValue: "See passenger frustration points in real-time — exception rate by channel.",
        tiles: [
          t("Avg Processing Time", "kpi"),
          t("Exception Rate", "kpi"),
          t("Channel Mix", "donut"),
          t("Class Mix", "bar"),
          t("Volume by Stage", "bar"),
        ],
      },
      {
        key: "ground_ops",
        name: "Ground Operations & Turnaround",
        description: "Aircraft turn time, fueling, catering, and gate readiness.",
        services: ["gate-management", "fueling-service", "catering-service", "ramp-control"],
        businessValue: "Compress turn time to add flights without adding aircraft.",
        tiles: [
          t("Avg Turn Time", "kpi"),
          t("Late Turns", "kpi"),
          t("Turn Times Over Time", "timeseries"),
          t("Bottlenecks", "bar"),
        ],
      },
    ],
  },

  // ---------- IoT & Industrial ----------
  {
    key: "iot",
    name: "IoT & Industrial",
    description: "Connected devices, sensor telemetry, and firmware management.",
    icon: "📶",
    useCases: [
      {
        key: "device_fleet",
        name: "Connected Device Fleet Health",
        description: "Heartbeats, alerts, and firmware currency.",
        services: ["device-registry", "telemetry-ingestion", "firmware-distributor", "alert-engine", "twin-service", "edge-gateway"],
        businessValue: "Make fleet health a board-level metric — uptime, currency, and alert pressure.",
        tiles: [
          t("Fleet Online Rate", "kpi"),
          t("Offline Devices", "kpi"),
          t("Firmware Currency", "kpi"),
          t("Active Alerts", "kpi"),
          t("Avg Signal Strength", "kpi"),
          t("Device Status Over Time", "stacked_area"),
          t("Alert Rate by Device Type", "bar"),
          t("Firmware Version Distribution", "bar"),
          t("Location Zone Health", "bar"),
          t("Battery Level Distribution", "histogram"),
          t("Critical Devices", "table"),
        ],
      },
      {
        key: "sensor_telemetry",
        name: "Industrial Sensor Telemetry",
        description: "Continuous sensor reads with anomaly detection.",
        services: ["telemetry-ingestion", "anomaly-detector", "edge-gateway"],
        businessValue: "Detect process anomalies before they cause yield loss.",
        tiles: [
          t("Threshold Breach Rate", "kpi"),
          t("Anomaly Score (avg)", "kpi"),
          t("Maintenance Due", "kpi"),
          t("Readings by Sensor Type", "bar"),
          t("Anomaly Score Over Time", "timeseries"),
        ],
      },
      {
        key: "firmware",
        name: "Firmware & OTA Management",
        description: "Version rollout health and adoption.",
        services: ["firmware-distributor", "device-registry", "ota-manager"],
        businessValue: "Drive firmware adoption fast and safely.",
        tiles: [
          t("Update Success Rate", "kpi"),
          t("Rollback Rate", "kpi"),
          t("Adoption by Version", "bar"),
          t("Updates Over Time", "timeseries"),
        ],
      },
    ],
  },

  // ---------- Media & Streaming ----------
  {
    key: "media",
    name: "Media & Streaming",
    description: "Video delivery, live streaming, and ad insertion.",
    icon: "🎬",
    useCases: [
      {
        key: "video_delivery",
        name: "Video Streaming & Delivery",
        description: "Playback sessions, buffering, and CDN performance.",
        services: ["cdn-edge", "origin-server", "transcoding-service", "drm-service", "ad-decision-server", "playback-api"],
        businessValue: "Show concurrent viewers and quality-of-experience side-by-side — the core streaming KPIs.",
        tiles: [
          t("Concurrent Viewers", "kpi"),
          t("Buffering Rate", "kpi"),
          t("p95 Startup Time", "kpi"),
          t("CDN Error Rate", "kpi"),
          t("4K/1080P Adoption", "kpi"),
          t("Playback Funnel", "funnel"),
          t("Buffering by CDN PoP", "bar"),
          t("Quality Distribution Over Time", "stacked_area"),
          t("Startup Time by Device", "bar"),
          t("Top Error Codes", "bar"),
        ],
      },
      {
        key: "live_streaming",
        name: "Live Event Streaming",
        description: "Live event peaks, encoder health, and edge load.",
        services: ["live-encoder", "cdn-edge", "origin-server", "playback-api"],
        businessValue: "Run live events confidently — see peaks, errors, and edge saturation in real time.",
        tiles: [
          t("Peak Concurrent Viewers", "kpi"),
          t("Live Error Rate", "kpi"),
          t("Encoder Health", "kpi"),
          t("Viewers by Region", "timeseries"),
          t("Errors by PoP", "bar"),
        ],
      },
      {
        key: "ad_insertion",
        name: "Ad Insertion & Monetization",
        description: "Ad request fill, decision latency, and revenue.",
        services: ["ad-decision-server", "playback-api", "billing-service"],
        businessValue: "Tie ad-tech health to revenue — fill rate, CPM, and decision latency.",
        tiles: [
          t("Fill Rate", "kpi"),
          t("Avg CPM", "kpi"),
          t("Decision Latency p95", "kpi"),
          t("Ad Funnel", "funnel"),
          t("Revenue Over Time", "timeseries"),
          t("Top Advertisers", "bar"),
        ],
      },
    ],
  },

  // ---------- Cash & Valuables Management ----------
  {
    key: "cash_valuables",
    name: "Cash & Valuables Management",
    description: "Armored transport, vault operations, and currency authentication.",
    icon: "🏦",
    useCases: [
      {
        key: "cash_in_transit",
        name: "Cash-in-Transit",
        description: "Armored vehicle dispatch, route execution, and secure cash delivery.",
        services: ["dispatch-service", "route-optimizer", "vehicle-tracker", "manifest-service", "incident-mgmt", "customer-portal"],
        businessValue: "Track on-time delivery rate and incident exposure across every armored route in real time.",
        tiles: [
          t("Shipments Dispatched", "kpi"),
          t("On-Time Delivery Rate", "kpi"),
          t("Value in Transit ($)", "kpi"),
          t("Incidents Reported", "kpi"),
          t("Active Vehicles", "kpi"),
          t("Shipment Status Over Time", "timeseries"),
          t("Delivery Success by Region", "bar"),
          t("Incident Types", "bar"),
          t("Vehicle Status Distribution", "donut"),
          t("Recent Incidents", "table"),
        ],
      },
      {
        key: "vault_operations",
        name: "Vault Operations",
        description: "Cash deposits, withdrawals, reconciliation, and access management.",
        services: ["vault-mgmt", "reconciliation-service", "access-control", "audit-service", "reporting-service"],
        businessValue: "Surface variance events and reconciliation failures before they become audit findings.",
        tiles: [
          t("Vault Transactions", "kpi"),
          t("Reconciliation Success Rate", "kpi"),
          t("Variance Events", "kpi"),
          t("Unauthorized Access Attempts", "kpi"),
          t("Transaction Mix", "donut"),
          t("Vault Activity Over Time", "timeseries"),
          t("Variances by Vault", "bar"),
          t("Access Events by Type", "bar"),
        ],
      },
      {
        key: "counterfeit_detection",
        name: "Counterfeit Detection",
        description: "Currency authentication, counterfeit flagging, and suspect batch handling.",
        services: ["note-validator", "sensor-array", "alert-service", "evidence-mgmt", "reporting-service"],
        businessValue: "Quantify counterfeit interception rate and false-positive cost across all processing centers.",
        tiles: [
          t("Notes Validated", "kpi"),
          t("Counterfeit Detection Rate", "kpi"),
          t("Counterfeits Intercepted", "kpi"),
          t("False Positive Rate", "kpi"),
          t("Detections by Denomination", "bar"),
          t("Counterfeit Events Over Time", "timeseries"),
          t("Detection Method Mix", "donut"),
        ],
      },
    ],
  },

  // ---------- Digital Retail Solutions ----------
  {
    key: "digital_retail",
    name: "Digital Retail Solutions",
    description: "Payment terminal management, self-checkout, and digital loyalty.",
    icon: "🖥️",
    useCases: [
      {
        key: "terminal_management",
        name: "Payment Terminal Management",
        description: "Terminal fleet health, connectivity, and software compliance.",
        services: ["terminal-mgmt", "fleet-monitor", "software-distributor", "connectivity-service", "alert-service", "reporting-service"],
        businessValue: "Maximize terminal uptime — every offline lane directly impacts revenue per hour.",
        tiles: [
          t("Online Terminal Rate", "kpi"),
          t("Offline Terminals", "kpi"),
          t("Software Compliance Rate", "kpi"),
          t("Avg Transaction Latency (ms)", "kpi"),
          t("Active Store Locations", "kpi"),
          t("Terminal Status Over Time", "timeseries"),
          t("Terminals by Status", "bar"),
          t("Software Version Distribution", "bar"),
          t("Status Distribution", "donut"),
          t("Terminals Requiring Attention", "table"),
        ],
      },
      {
        key: "self_checkout",
        name: "Self-Checkout Operations",
        description: "SCO session flows, interventions, and basket management.",
        services: ["sco-controller", "weight-sensor", "payment-service", "age-verify-service", "intervention-service", "receipt-service"],
        businessValue: "Track intervention rate and basket conversion — the two metrics that decide SCO ROI.",
        tiles: [
          t("SCO Sessions", "kpi"),
          t("Completion Rate", "kpi"),
          t("Intervention Rate", "kpi"),
          t("Avg Basket Value ($)", "kpi"),
          t("Payment Success Rate", "kpi"),
          t("SCO Session Flow Funnel", "funnel"),
          t("Session Volume Over Time", "timeseries"),
          t("Intervention Reasons", "bar"),
          t("Payment Method Mix", "donut"),
        ],
      },
      {
        key: "loyalty_receipts",
        name: "Digital Receipts & Loyalty",
        description: "Loyalty point accrual, redemption, and digital receipt delivery.",
        services: ["loyalty-engine", "receipt-service", "notification-service", "member-portal", "offer-engine"],
        businessValue: "Connect loyalty engagement to basket size and retention — the proof points for the program ROI.",
        tiles: [
          t("Loyalty Transactions", "kpi"),
          t("Points Redeemed", "kpi"),
          t("Digital Receipt Delivery Rate", "kpi"),
          t("Redemption Failures", "kpi"),
          t("Program Distribution", "donut"),
          t("Loyalty Activity Over Time", "timeseries"),
          t("Delivery Failures by Channel", "bar"),
        ],
      },
    ],
  },

  // ---------- ATM Managed Services ----------
  {
    key: "atm_services",
    name: "ATM Managed Services",
    description: "ATM fleet health, cash replenishment, and transaction processing.",
    icon: "🏧",
    useCases: [
      {
        key: "atm_fleet_health",
        name: "ATM Fleet Health",
        description: "ATM uptime, fault management, and availability across the deployed fleet.",
        services: ["atm-monitor", "fault-mgmt", "remote-mgmt", "alert-service", "field-dispatch", "reporting-service"],
        businessValue: "Every offline ATM is lost transaction revenue and a customer service risk — visibility drives uptime.",
        tiles: [
          t("Fleet Availability Rate", "kpi"),
          t("ATMs In Service", "kpi"),
          t("ATMs Out of Service", "kpi"),
          t("Low Cash Alerts", "kpi"),
          t("Avg MTTR (min)", "kpi"),
          t("ATM Status Over Time", "timeseries"),
          t("Out-of-Service Reasons", "bar"),
          t("Availability by Region", "bar"),
          t("Status Distribution", "donut"),
          t("Critical ATMs", "table"),
        ],
      },
      {
        key: "cash_replenishment",
        name: "Cash Replenishment",
        description: "ATM cash-fill operations, cassette management, and schedule adherence.",
        services: ["replenishment-scheduler", "crew-dispatch", "cassette-mgmt", "vault-link", "audit-service"],
        businessValue: "Optimize cash-fill scheduling to reduce out-of-cash events without over-provisioning float.",
        tiles: [
          t("Replenishments Completed", "kpi"),
          t("On-Schedule Rate", "kpi"),
          t("Cash-Out Events", "kpi"),
          t("Total Cash Loaded ($)", "kpi"),
          t("Replenishments Over Time", "timeseries"),
          t("Fill Events by ATM Cluster", "bar"),
          t("Failure Reasons", "bar"),
          t("Cassette Type Mix", "donut"),
        ],
      },
      {
        key: "atm_transactions",
        name: "ATM Transaction Processing",
        description: "Cash withdrawals, deposits, balance inquiries, and fraud detection.",
        services: ["txn-processor", "auth-service", "fraud-engine", "card-network-gateway", "receipt-printer", "audit-service"],
        businessValue: "Track authorization success rate and fraud interception as core ATM operational KPIs.",
        tiles: [
          t("Transaction Success Rate", "kpi"),
          t("Transactions Processed", "kpi"),
          t("Fraud Alerts", "kpi"),
          t("p95 Authorization Latency (ms)", "kpi"),
          t("Card Network Distribution", "donut"),
          t("Transaction Volume Over Time", "timeseries"),
          t("Failure Reasons", "bar"),
          t("Transactions by Type", "bar"),
          t("Fraud Alerts by Alert Type", "bar"),
          t("Recent Fraud Events", "table"),
        ],
      },
    ],
  },
];

export const findVertical = (key: VerticalKey | null): Vertical | undefined =>
  VERTICALS.find((v) => v.key === key);

export const findUseCase = (vertical: Vertical | undefined, key: UseCaseKey | null): UseCase | undefined =>
  vertical?.useCases.find((u) => u.key === key);
