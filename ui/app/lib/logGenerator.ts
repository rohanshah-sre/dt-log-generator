import type { VerticalKey, UseCaseKey } from "./verticals";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export interface GeneratorConfig {
  vertical: VerticalKey;
  useCase: UseCaseKey;
  scenarioName: string;
  customerName?: string;
  /** logs per minute target */
  logsPerMinute: number;
  /** 0..1 */
  errorRate: number;
  /** how many fake services to mix into hosts/hosts */
  serviceCount: number;
  /** subset of the use case's service pool actually used */
  services: string[];
  /** stable host pool */
  hosts: string[];
}

const PROD_WEIGHT = 0.9;

let _seed = 0xc0ffee;
const seedRand = (): number => {
  _seed = (_seed * 1664525 + 1013904223) | 0;
  return ((_seed >>> 0) % 1_000_000) / 1_000_000;
};

const r = (): number => Math.random();

export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];
export const pickWeighted = <T,>(items: { value: T; weight: number }[]): T => {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let v = r() * total;
  for (const i of items) {
    v -= i.weight;
    if (v <= 0) return i.value;
  }
  return items[items.length - 1].value;
};
export const intBetween = (a: number, b: number) => Math.floor(a + r() * (b - a + 1));
export const numBetween = (a: number, b: number) => +(a + r() * (b - a)).toFixed(2);
export const chance = (p: number) => r() < p;

const HEX = "0123456789abcdef";
const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const randHex = (n: number) => Array.from({ length: n }, () => HEX[Math.floor(r() * 16)]).join("");
const randDigits = (n: number) => Array.from({ length: n }, () => Math.floor(r() * 10)).join("");
const randAlnum = (n: number) => Array.from({ length: n }, () => ALPHANUM[Math.floor(r() * 36)]).join("");

const uuidLike = () =>
  `${randHex(8)}-${randHex(4)}-${randHex(4)}-${randHex(4)}-${randHex(12)}`;

export const buildHostPool = (count: number): string[] =>
  Array.from({ length: count }, () => `HOST-${randHex(8)}`);

// =============================================================================
// Geo / IP enrichment
// =============================================================================

export interface GeoEntry {
  country: string;
  city: string;
  lat: number;
  lon: number;
  region: string;
}

export const GEO_POOLS: Record<VerticalKey, GeoEntry[]> = {
  financial: [
    { country: "United States", city: "New York", lat: 40.71, lon: -74.01, region: "NA" },
    { country: "United States", city: "Chicago", lat: 41.88, lon: -87.63, region: "NA" },
    { country: "United Kingdom", city: "London", lat: 51.51, lon: -0.13, region: "EU" },
    { country: "Germany", city: "Frankfurt", lat: 50.11, lon: 8.68, region: "EU" },
    { country: "Singapore", city: "Singapore", lat: 1.35, lon: 103.82, region: "APAC" },
    { country: "Brazil", city: "São Paulo", lat: -23.55, lon: -46.63, region: "LATAM" },
    { country: "Hong Kong", city: "Hong Kong", lat: 22.32, lon: 114.17, region: "APAC" },
    { country: "Japan", city: "Tokyo", lat: 35.68, lon: 139.69, region: "APAC" },
    { country: "Australia", city: "Sydney", lat: -33.87, lon: 151.21, region: "APAC" },
    { country: "Canada", city: "Toronto", lat: 43.65, lon: -79.38, region: "NA" },
  ],
  healthcare: [
    { country: "United States", city: "New York", lat: 40.71, lon: -74.01, region: "NA" },
    { country: "United States", city: "Houston", lat: 29.76, lon: -95.37, region: "NA" },
    { country: "United States", city: "Los Angeles", lat: 34.05, lon: -118.24, region: "NA" },
    { country: "Canada", city: "Toronto", lat: 43.65, lon: -79.38, region: "NA" },
    { country: "United Kingdom", city: "London", lat: 51.51, lon: -0.13, region: "EU" },
    { country: "Germany", city: "Berlin", lat: 52.52, lon: 13.40, region: "EU" },
    { country: "Australia", city: "Melbourne", lat: -37.81, lon: 144.96, region: "APAC" },
    { country: "France", city: "Paris", lat: 48.86, lon: 2.35, region: "EU" },
  ],
  retail: [
    { country: "United States", city: "New York", lat: 40.71, lon: -74.01, region: "NA" },
    { country: "United States", city: "Los Angeles", lat: 34.05, lon: -118.24, region: "NA" },
    { country: "United States", city: "Chicago", lat: 41.88, lon: -87.63, region: "NA" },
    { country: "United Kingdom", city: "London", lat: 51.51, lon: -0.13, region: "EU" },
    { country: "Germany", city: "Munich", lat: 48.14, lon: 11.58, region: "EU" },
    { country: "France", city: "Paris", lat: 48.86, lon: 2.35, region: "EU" },
    { country: "Japan", city: "Tokyo", lat: 35.68, lon: 139.69, region: "APAC" },
    { country: "Australia", city: "Sydney", lat: -33.87, lon: 151.21, region: "APAC" },
    { country: "Brazil", city: "São Paulo", lat: -23.55, lon: -46.63, region: "LATAM" },
  ],
  gaming: [
    { country: "United States", city: "Los Angeles", lat: 34.05, lon: -118.24, region: "NA" },
    { country: "United States", city: "New York", lat: 40.71, lon: -74.01, region: "NA" },
    { country: "Germany", city: "Berlin", lat: 52.52, lon: 13.40, region: "EU" },
    { country: "United Kingdom", city: "London", lat: 51.51, lon: -0.13, region: "EU" },
    { country: "South Korea", city: "Seoul", lat: 37.57, lon: 126.98, region: "APAC" },
    { country: "Japan", city: "Tokyo", lat: 35.68, lon: 139.69, region: "APAC" },
    { country: "Brazil", city: "São Paulo", lat: -23.55, lon: -46.63, region: "LATAM" },
    { country: "Australia", city: "Sydney", lat: -33.87, lon: 151.21, region: "APAC" },
    { country: "India", city: "Mumbai", lat: 19.08, lon: 72.88, region: "APAC" },
  ],
  logistics: [
    { country: "United States", city: "Louisville", lat: 38.25, lon: -85.76, region: "NA" },
    { country: "United States", city: "Memphis", lat: 35.15, lon: -90.05, region: "NA" },
    { country: "Germany", city: "Leipzig", lat: 51.34, lon: 12.37, region: "EU" },
    { country: "United Kingdom", city: "London", lat: 51.51, lon: -0.13, region: "EU" },
    { country: "China", city: "Shanghai", lat: 31.23, lon: 121.47, region: "APAC" },
    { country: "Singapore", city: "Singapore", lat: 1.35, lon: 103.82, region: "APAC" },
    { country: "Australia", city: "Sydney", lat: -33.87, lon: 151.21, region: "APAC" },
    { country: "Brazil", city: "Campinas", lat: -22.91, lon: -47.06, region: "LATAM" },
  ],
  energy: [
    { country: "United States", city: "Houston", lat: 29.76, lon: -95.37, region: "SOUTHWEST" },
    { country: "United States", city: "Chicago", lat: 41.88, lon: -87.63, region: "MIDWEST" },
    { country: "United States", city: "Phoenix", lat: 33.45, lon: -112.07, region: "WEST" },
    { country: "United States", city: "Atlanta", lat: 33.75, lon: -84.39, region: "SOUTHEAST" },
    { country: "United States", city: "New York", lat: 40.71, lon: -74.01, region: "NORTHEAST" },
    { country: "Germany", city: "Hamburg", lat: 53.55, lon: 10.00, region: "EU" },
    { country: "United Kingdom", city: "Birmingham", lat: 52.49, lon: -1.90, region: "EU" },
    { country: "Australia", city: "Brisbane", lat: -27.47, lon: 153.02, region: "APAC" },
  ],
  automotive: [
    { country: "United States", city: "Detroit", lat: 42.33, lon: -83.05, region: "NA" },
    { country: "Germany", city: "Munich", lat: 48.14, lon: 11.58, region: "EU" },
    { country: "Germany", city: "Stuttgart", lat: 48.78, lon: 9.18, region: "EU" },
    { country: "Japan", city: "Toyota City", lat: 35.08, lon: 137.16, region: "APAC" },
    { country: "South Korea", city: "Seoul", lat: 37.57, lon: 126.98, region: "APAC" },
    { country: "United States", city: "Los Angeles", lat: 34.05, lon: -118.24, region: "NA" },
    { country: "China", city: "Shanghai", lat: 31.23, lon: 121.47, region: "APAC" },
    { country: "United Kingdom", city: "Coventry", lat: 52.41, lon: -1.51, region: "EU" },
  ],
  manufacturing: [
    { country: "United States", city: "Detroit", lat: 42.33, lon: -83.05, region: "NA" },
    { country: "Germany", city: "Stuttgart", lat: 48.78, lon: 9.18, region: "EU" },
    { country: "Japan", city: "Osaka", lat: 34.69, lon: 135.50, region: "APAC" },
    { country: "China", city: "Shenzhen", lat: 22.54, lon: 114.06, region: "APAC" },
    { country: "Mexico", city: "Monterrey", lat: 25.67, lon: -100.31, region: "LATAM" },
    { country: "South Korea", city: "Busan", lat: 35.18, lon: 129.08, region: "APAC" },
  ],
  insurance: [
    { country: "United States", city: "Hartford", lat: 41.76, lon: -72.68, region: "NA" },
    { country: "United States", city: "New York", lat: 40.71, lon: -74.01, region: "NA" },
    { country: "United Kingdom", city: "London", lat: 51.51, lon: -0.13, region: "EU" },
    { country: "Germany", city: "Munich", lat: 48.14, lon: 11.58, region: "EU" },
    { country: "Australia", city: "Sydney", lat: -33.87, lon: 151.21, region: "APAC" },
    { country: "Canada", city: "Toronto", lat: 43.65, lon: -79.38, region: "NA" },
    { country: "France", city: "Paris", lat: 48.86, lon: 2.35, region: "EU" },
  ],
  airlines: [
    { country: "United States", city: "Atlanta", lat: 33.75, lon: -84.39, region: "NA" },
    { country: "United States", city: "Chicago", lat: 41.88, lon: -87.63, region: "NA" },
    { country: "United Kingdom", city: "London", lat: 51.51, lon: -0.13, region: "EU" },
    { country: "Germany", city: "Frankfurt", lat: 50.11, lon: 8.68, region: "EU" },
    { country: "United Arab Emirates", city: "Dubai", lat: 25.20, lon: 55.27, region: "MEA" },
    { country: "Singapore", city: "Singapore", lat: 1.35, lon: 103.82, region: "APAC" },
    { country: "Japan", city: "Tokyo", lat: 35.68, lon: 139.69, region: "APAC" },
    { country: "Australia", city: "Sydney", lat: -33.87, lon: 151.21, region: "APAC" },
  ],
  media: [
    { country: "United States", city: "Los Angeles", lat: 34.05, lon: -118.24, region: "NA" },
    { country: "United States", city: "New York", lat: 40.71, lon: -74.01, region: "NA" },
    { country: "United Kingdom", city: "London", lat: 51.51, lon: -0.13, region: "EU" },
    { country: "Brazil", city: "São Paulo", lat: -23.55, lon: -46.63, region: "LATAM" },
    { country: "India", city: "Mumbai", lat: 19.08, lon: 72.88, region: "APAC" },
    { country: "Germany", city: "Berlin", lat: 52.52, lon: 13.40, region: "EU" },
    { country: "Australia", city: "Sydney", lat: -33.87, lon: 151.21, region: "APAC" },
    { country: "Japan", city: "Tokyo", lat: 35.68, lon: 139.69, region: "APAC" },
  ],
  pos: [
    { country: "United States", city: "New York", lat: 40.71, lon: -74.01, region: "NA" },
    { country: "United States", city: "Chicago", lat: 41.88, lon: -87.63, region: "NA" },
    { country: "United Kingdom", city: "London", lat: 51.51, lon: -0.13, region: "EU" },
    { country: "Australia", city: "Melbourne", lat: -37.81, lon: 144.96, region: "APAC" },
    { country: "Canada", city: "Vancouver", lat: 49.28, lon: -123.12, region: "NA" },
    { country: "Germany", city: "Hamburg", lat: 53.55, lon: 10.00, region: "EU" },
  ],
  iot: [
    { country: "United States", city: "San Jose", lat: 37.34, lon: -121.89, region: "NA" },
    { country: "Germany", city: "Munich", lat: 48.14, lon: 11.58, region: "EU" },
    { country: "Japan", city: "Tokyo", lat: 35.68, lon: 139.69, region: "APAC" },
    { country: "China", city: "Shenzhen", lat: 22.54, lon: 114.06, region: "APAC" },
    { country: "United Kingdom", city: "London", lat: 51.51, lon: -0.13, region: "EU" },
    { country: "South Korea", city: "Seoul", lat: 37.57, lon: 126.98, region: "APAC" },
    { country: "India", city: "Bangalore", lat: 12.97, lon: 77.59, region: "APAC" },
  ],
  telco: [
    { country: "United States", city: "Dallas", lat: 32.78, lon: -96.80, region: "SOUTHWEST" },
    { country: "United States", city: "Atlanta", lat: 33.75, lon: -84.39, region: "SOUTHEAST" },
    { country: "Germany", city: "Berlin", lat: 52.52, lon: 13.40, region: "EU" },
    { country: "United Kingdom", city: "Manchester", lat: 53.48, lon: -2.24, region: "EU" },
    { country: "India", city: "Mumbai", lat: 19.08, lon: 72.88, region: "APAC" },
    { country: "Brazil", city: "Brasília", lat: -15.78, lon: -47.93, region: "LATAM" },
    { country: "Mexico", city: "Mexico City", lat: 19.43, lon: -99.13, region: "LATAM" },
  ],
};

// Realistic public IP ranges (avoiding RFC1918 private ranges)
const PUBLIC_IP_PREFIXES = [
  "203.0", "185.220", "52.84", "34.102", "104.16", "172.217", "151.101",
  "18.232", "13.107", "199.232", "208.67", "8.8", "1.1", "23.45",
  "67.220", "76.76", "162.158", "192.0", "200.144",
];

const randPublicIp = (): string => {
  const prefix = pick(PUBLIC_IP_PREFIXES);
  return `${prefix}.${intBetween(1, 254)}.${intBetween(1, 254)}`;
};

export const pickGeo = (vertical: VerticalKey): GeoEntry => {
  const pool = GEO_POOLS[vertical] ?? GEO_POOLS.financial;
  return pick(pool);
};

export const geoFields = (vertical: VerticalKey) => {
  const g = pickGeo(vertical);
  return {
    "source.ip": randPublicIp(),
    "geo.country": g.country,
    "geo.city": g.city,
    "geo.lat": g.lat,
    "geo.lon": g.lon,
    "geo.region": g.region,
  };
};

export const pickServices = (pool: string[], n: number): string[] => {
  const c = Math.min(n, pool.length);
  const copy = [...pool];
  const out: string[] = [];
  for (let i = 0; i < c; i++) {
    const idx = Math.floor(r() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
};

export const pickLogLevel = (errorRate: number): LogLevel => {
  // Distribute remaining probability between INFO/WARN/DEBUG
  const errP = errorRate;
  const warnP = errorRate * 1.5; // warns track errors loosely
  const debugP = 0.07;
  const roll = r();
  if (roll < errP) return "ERROR";
  if (roll < errP + warnP) return "WARN";
  if (roll < errP + warnP + debugP) return "DEBUG";
  return "INFO";
};

export const baseFields = (cfg: GeneratorConfig, ts: Date) => {
  const host = pick(cfg.hosts);
  return {
    timestamp: ts.toISOString(),
    "log.level": "INFO" as LogLevel,
    "service.name": pick(cfg.services),
    "service.version": `v${intBetween(1, 5)}.${intBetween(0, 20)}.${intBetween(0, 30)}`,
    "trace.id": uuidLike(),
    "span.id": randHex(16),
    "dt.entity.host": host,
    "host.name": host,
    "host.ip": randPublicIp(),
    environment: chance(PROD_WEIGHT) ? "production" : "staging",
    "log.generator": "dt-biz-log-gen",
    "scenario.vertical": cfg.vertical,
    "scenario.usecase": cfg.useCase,
    "scenario.name": cfg.scenarioName,
    ...geoFields(cfg.vertical),
  };
};

// ---- Per-vertical event payload generators ------------------------------

const FIN_PAYMENTS = {
  ok(): Record<string, unknown> {
    const txnId = `TXN-${randAlnum(12)}`;
    const amount = numBetween(5, 5000);
    const currency = pick(["USD", "EUR", "GBP"]);
    return {
      "event.type": "TRANSACTION_COMPLETED",
      "transaction.id": txnId,
      "transaction.amount": amount,
      "transaction.currency": currency,
      "transaction.type": pick(["PURCHASE", "REFUND", "TRANSFER"]),
      "payment.method": pick(["CARD", "ACH", "WIRE", "DIGITAL_WALLET"]),
      "card.network": pick(["VISA", "MASTERCARD", "AMEX", "DISCOVER"]),
      "merchant.category": pick(["RETAIL", "TRAVEL", "FOOD", "UTILITIES", "HEALTHCARE"]),
      "customer.tier": pick(["PLATINUM", "GOLD", "SILVER", "STANDARD"]),
      latency_ms: intBetween(20, 450),
      "fraud.score": +numBetween(0.01, 0.15),
      message: `Transaction ${txnId} authorized for ${amount} ${currency}`,
    };
  },
  err(): Record<string, unknown> {
    const reason = pick(["INSUFFICIENT_FUNDS", "CARD_EXPIRED", "FRAUD_BLOCK", "VELOCITY_LIMIT", "INVALID_CVV"]);
    return {
      "event.type": "TRANSACTION_DECLINED",
      "decline.reason": reason,
      "transaction.amount": numBetween(5, 5000),
      "customer.tier": pick(["PLATINUM", "GOLD", "SILVER", "STANDARD"]),
      latency_ms: intBetween(5, 50),
      message: `Transaction declined: ${reason}`,
    };
  },
  warn(): Record<string, unknown> {
    const score = +numBetween(0.75, 0.99);
    const action = pick(["STEP_UP_AUTH", "BLOCK", "FLAG"]);
    return {
      "event.type": "FRAUD_ALERT",
      "fraud.score": score,
      "fraud.reason": pick(["UNUSUAL_LOCATION", "VELOCITY_SPIKE", "DEVICE_MISMATCH", "AMOUNT_ANOMALY"]),
      "action.taken": action,
      message: `High fraud score ${score} — action: ${action}`,
    };
  },
};

const FIN_FRAUD = {
  base() {
    return {
      "model.version": pick(["v3.2.1", "v3.1.8", "v2.9.4"]),
      "features.evaluated": intBetween(15, 120),
      "inference.latency_ms": intBetween(5, 80),
      "rule.triggered": pick(["VELOCITY_24H", "GEO_ANOMALY", "DEVICE_FINGERPRINT", "BEHAVIOR_MODEL", "NETWORK_GRAPH"]),
      "fraud.reason": pick(["VELOCITY", "GEO_MISMATCH", "DEVICE_RISK", "BEHAVIOR_DRIFT", "CARD_TESTING", "ACCOUNT_TAKEOVER", "SYNTHETIC_ID"]),
    };
  },
  ok() {
    return {
      ...FIN_FRAUD.base(),
      "event.type": "FRAUD_SCORED",
      "fraud.score": +numBetween(0.0, 0.4),
      "action.taken": "ALLOW",
      message: "Transaction scored low risk",
    };
  },
  warn() {
    return {
      ...FIN_FRAUD.base(),
      "event.type": "FRAUD_ELEVATED",
      "fraud.score": +numBetween(0.6, 0.85),
      "case.id": `CASE-${randDigits(7)}`,
      "action.taken": pick(["REVIEW", "STEP_UP_AUTH", "FLAG"]),
      message: "Elevated risk — case opened for review",
    };
  },
  err() {
    return {
      ...FIN_FRAUD.base(),
      "event.type": "FRAUD_BLOCKED",
      "fraud.score": +numBetween(0.85, 0.99),
      "case.id": `CASE-${randDigits(7)}`,
      "action.taken": "BLOCK",
      message: "Transaction blocked by fraud engine",
    };
  },
};

const FIN_TRADING = {
  ok() {
    return {
      "event.type": "ORDER_EXECUTED",
      "order.id": `ORD-${randAlnum(10)}`,
      "instrument.symbol": pick(["AAPL", "MSFT", "NVDA", "TSLA", "JPM", "GOOGL", "AMZN"]),
      side: pick(["BUY", "SELL"]),
      quantity: intBetween(10, 5000),
      price: +numBetween(20, 950),
      latency_ms: intBetween(1, 80),
      venue: pick(["NYSE", "NASDAQ", "ARCA", "BATS"]),
      message: "Order executed",
    };
  },
  err() {
    return {
      "event.type": "ORDER_REJECTED",
      "reject.reason": pick(["RISK_LIMIT", "INSUFFICIENT_MARGIN", "STALE_QUOTE", "MARKET_CLOSED"]),
      latency_ms: intBetween(1, 25),
      message: "Order rejected by risk engine",
    };
  },
  warn() {
    return {
      "event.type": "MARKET_DATA_LAG",
      "lag_ms": intBetween(150, 2000),
      "feed.id": pick(["FEED-A", "FEED-B", "FEED-C"]),
      message: "Market data feed lagging beyond threshold",
    };
  },
};

const HC_PORTAL = {
  ok() {
    const action = pick(["LOGIN", "VIEW_RECORDS", "BOOK_APPOINTMENT", "DOWNLOAD_REPORT", "MESSAGE_PROVIDER"]);
    const ptId = `PT-${randDigits(8)}`;
    return {
      "event.type": "PATIENT_ACTION",
      action,
      "patient.id": ptId,
      department: pick(["CARDIOLOGY", "ONCOLOGY", "PEDIATRICS", "ORTHOPEDICS", "GENERAL"]),
      "session.duration_ms": intBetween(500, 120000),
      "mfa.method": pick(["SMS", "TOTP", "BIOMETRIC"]),
      "record.type": pick(["LAB_RESULT", "IMAGING", "PRESCRIPTION", "VISIT_SUMMARY"]),
      latency_ms: intBetween(80, 2000),
      "hipaa.compliant": true,
      message: `Patient ${ptId} — ${action} completed`,
    };
  },
  err() {
    const code = pick(["HL7_PARSE_ERROR", "TIMEOUT", "AUTH_FAILURE", "RECORD_LOCKED"]);
    const msgType = pick(["ADT_A01", "ORU_R01", "ORM_O01", "RDS_O13"]);
    return {
      "event.type": "EHR_INTEGRATION_FAILURE",
      "error.code": code,
      "hl7.message_type": msgType,
      "retry.count": intBetween(0, 3),
      message: `EHR integration error: ${code} for message type ${msgType}`,
    };
  },
  warn() {
    return {
      "event.type": "SLOW_RESPONSE",
      "endpoint": pick(["/records", "/appointments", "/labs", "/messages"]),
      latency_ms: intBetween(2500, 6000),
      message: "Patient portal endpoint exceeding SLO",
    };
  },
};

const HC_CLAIMS = {
  base() {
    const status = pick(["SUBMITTED", "IN_REVIEW", "APPROVED", "DENIED", "PENDING_INFO"]);
    const claimId = `CLM-${randDigits(10)}`;
    const auto = chance(0.7);
    const denied = status === "DENIED";
    const fields: Record<string, unknown> = {
      "event.type": "CLAIM_EVENT",
      "claim.id": claimId,
      "claim.status": status,
      "claim.type": pick(["MEDICAL", "DENTAL", "VISION", "PHARMACY", "BEHAVIORAL"]),
      "claim.amount": +numBetween(50, 85000),
      "diagnosis.code": pick(["J20.9", "M54.5", "K21.0", "I10", "E11.9"]),
      "processing.time_ms": intBetween(200, 15000),
      "auto.adjudicated": auto,
      "sla.met": chance(0.85),
      message: `Claim ${claimId} — ${status}`,
    };
    if (denied) fields["denial.reason"] = pick(["NOT_COVERED", "AUTH_REQUIRED", "DUPLICATE", "MISSING_INFO"]);
    return fields;
  },
  ok() { return HC_CLAIMS.base(); },
  err() {
    return {
      ...HC_CLAIMS.base(),
      "claim.status": "DENIED",
      "denial.reason": pick(["NOT_COVERED", "AUTH_REQUIRED", "DUPLICATE", "MISSING_INFO"]),
      message: "Claim denied",
    };
  },
  warn() {
    return {
      ...HC_CLAIMS.base(),
      "claim.status": "PENDING_INFO",
      message: "Claim pending additional information",
    };
  },
};

const HC_EHR = {
  base() {
    const types = ["ADT_A01", "ORU_R01", "ORM_O01", "RDS_O13", "MDM_T02"];
    return {
      "hl7.message_type": pick(types),
      "facility": pick(["MAIN_HOSPITAL", "WEST_CLINIC", "EAST_CLINIC", "PEDS_CENTER"]),
    };
  },
  ok() {
    return {
      ...HC_EHR.base(),
      "event.type": "HL7_MESSAGE",
      latency_ms: intBetween(20, 600),
      message: "HL7 message processed",
    };
  },
  err() {
    return {
      ...HC_EHR.base(),
      "event.type": "HL7_FAILURE",
      "error.code": pick(["PARSE_ERROR", "ACK_TIMEOUT", "VALIDATION_FAILED"]),
      "retry.count": intBetween(0, 3),
      message: "HL7 message failed processing",
    };
  },
  warn() {
    return {
      ...HC_EHR.base(),
      "event.type": "HL7_DELAY",
      latency_ms: intBetween(2500, 8000),
      message: "HL7 message processing exceeded SLO",
    };
  },
};

const RETAIL_ORDERS = {
  ok() {
    const status = pick(["PLACED", "CONFIRMED", "PICKING", "PACKED", "SHIPPED", "DELIVERED"]);
    const id = `ORD-${randDigits(10)}`;
    return {
      "event.type": "ORDER_EVENT",
      "order.id": id,
      "order.status": status,
      "order.value": +numBetween(9.99, 2500),
      "order.items": intBetween(1, 12),
      "customer.segment": pick(["NEW", "RETURNING", "LOYALTY", "VIP"]),
      "product.category": pick(["ELECTRONICS", "APPAREL", "HOME", "BEAUTY", "SPORTS", "FOOD"]),
      "warehouse.id": pick(["WH-EAST", "WH-WEST", "WH-CENTRAL", "WH-NORTH"]),
      carrier: pick(["FEDEX", "UPS", "USPS", "DHL", "AMAZON_LOGISTICS"]),
      "delivery.sla": pick(["SAME_DAY", "NEXT_DAY", "2_DAY", "STANDARD"]),
      latency_ms: intBetween(50, 3000),
      message: `Order ${id} — ${status}`,
    };
  },
  err() {
    const id = `ORD-${randDigits(10)}`;
    return {
      "event.type": "ORDER_EVENT",
      "order.id": id,
      "order.status": "CANCELLED",
      "cancel.reason": pick(["INVENTORY", "PAYMENT_FAILED", "FRAUD", "CUSTOMER"]),
      latency_ms: intBetween(30, 800),
      message: `Order ${id} — CANCELLED`,
    };
  },
  warn() {
    const id = `ORD-${randDigits(10)}`;
    return {
      "event.type": "ORDER_EVENT",
      "order.id": id,
      "order.status": "RETURNED",
      "return.reason": pick(["DEFECTIVE", "WRONG_ITEM", "NO_LONGER_NEEDED"]),
      message: `Order ${id} — RETURNED`,
    };
  },
};

const RETAIL_INVENTORY = {
  ok() {
    return {
      "event.type": "STOCK_CHECK",
      "sku": `SKU-${randAlnum(8)}`,
      "warehouse.id": pick(["WH-EAST", "WH-WEST", "WH-CENTRAL", "WH-NORTH"]),
      qty: intBetween(0, 5000),
      latency_ms: intBetween(5, 100),
      message: "Stock level read",
    };
  },
  err() {
    return {
      "event.type": "STOCKOUT",
      "sku": `SKU-${randAlnum(8)}`,
      "warehouse.id": pick(["WH-EAST", "WH-WEST", "WH-CENTRAL", "WH-NORTH"]),
      message: "Stock-out detected",
    };
  },
  warn() {
    return {
      "event.type": "REORDER_TRIGGERED",
      "sku": `SKU-${randAlnum(8)}`,
      threshold: intBetween(5, 50),
      message: "Replenishment threshold reached",
    };
  },
};

const RETAIL_CX = {
  ok() {
    return {
      "event.type": "BROWSE",
      "page.type": pick(["CATEGORY", "PRODUCT", "SEARCH", "HOME"]),
      "session.id": uuidLike(),
      latency_ms: intBetween(40, 600),
      message: "Page rendered",
    };
  },
  err() {
    return {
      "event.type": "CHECKOUT_FAILURE",
      "error.code": pick(["PAYMENT_DECLINED", "INVENTORY_GONE", "ADDRESS_INVALID"]),
      message: "Checkout failed",
    };
  },
  warn() {
    return {
      "event.type": "CART_ABANDONED",
      "cart.value": +numBetween(15, 600),
      "items": intBetween(1, 7),
      message: "Cart abandoned after 30m",
    };
  },
};

const TELCO_NETWORK = {
  ok() {
    const node = `NODE-${randHex(6).toUpperCase()}`;
    const metricType = pick(["PACKET_LOSS", "LATENCY", "THROUGHPUT", "AVAILABILITY", "HANDOFF"]);
    const unit = metricType === "PACKET_LOSS" || metricType === "AVAILABILITY" ? "PERCENT"
      : metricType === "LATENCY" ? "MS" : "MBPS";
    let value: number;
    switch (metricType) {
      case "PACKET_LOSS": value = +numBetween(0, 4); break;
      case "AVAILABILITY": value = +numBetween(98, 100); break;
      case "LATENCY": value = intBetween(8, 120); break;
      case "THROUGHPUT": value = +numBetween(50, 950); break;
      default: value = intBetween(0, 50);
    }
    return {
      "event.type": "NETWORK_EVENT",
      "node.id": node,
      "node.type": pick(["ENB", "GNB", "CORE", "EDGE", "BSC"]),
      region: pick(["NORTHEAST", "SOUTHEAST", "MIDWEST", "WEST", "SOUTHWEST"]),
      "metric.type": metricType,
      "metric.value": value,
      "metric.unit": unit,
      "threshold.breach": chance(0.15),
      technology: pick(["4G", "5G", "WIFI6", "FIBER"]),
      "subscriber.impact": intBetween(0, 50000),
      "ticket.priority": pick(["P1", "P2", "P3", "P4"]),
      message: `Network event on ${node}: ${metricType} = ${value}${unit}`,
    };
  },
  err() {
    return {
      ...TELCO_NETWORK.ok(),
      "event.type": "NETWORK_OUTAGE",
      "threshold.breach": true,
      "ticket.priority": pick(["P1", "P2"]),
      message: "Outage detected — ticket auto-opened",
    };
  },
  warn() {
    return {
      ...TELCO_NETWORK.ok(),
      "event.type": "DEGRADATION",
      "threshold.breach": true,
      message: "Network performance degrading",
    };
  },
};

const TELCO_BILLING = {
  ok() {
    return {
      "event.type": "USAGE_EVENT",
      "subscriber.id": `SUB-${randDigits(9)}`,
      "usage.type": pick(["VOICE", "DATA", "SMS", "ROAMING"]),
      "usage.amount": +numBetween(0.1, 250),
      latency_ms: intBetween(10, 200),
      message: "Usage rated",
    };
  },
  err() {
    return {
      "event.type": "RATING_FAILURE",
      "error.code": pick(["UNKNOWN_PLAN", "TARIFF_MISSING", "OVERFLOW"]),
      message: "Failed to rate usage event",
    };
  },
  warn() {
    return {
      "event.type": "PROVISIONING_DELAY",
      "subscriber.id": `SUB-${randDigits(9)}`,
      "delay_ms": intBetween(5000, 30000),
      message: "Activation delayed beyond SLA",
    };
  },
};

const TELCO_CARE = {
  ok() {
    return {
      "event.type": "TICKET_EVENT",
      "ticket.id": `TKT-${randDigits(8)}`,
      action: pick(["CREATED", "UPDATED", "RESOLVED", "ESCALATED"]),
      priority: pick(["P1", "P2", "P3", "P4"]),
      latency_ms: intBetween(50, 1500),
      message: "Care ticket processed",
    };
  },
  err() {
    return {
      "event.type": "ROUTING_FAILURE",
      "ticket.id": `TKT-${randDigits(8)}`,
      message: "Ticket routing failed — fell back to queue",
    };
  },
  warn() {
    return {
      "event.type": "SLA_RISK",
      "ticket.id": `TKT-${randDigits(8)}`,
      "minutes.until.breach": intBetween(2, 30),
      message: "Ticket approaching SLA breach",
    };
  },
};

const MFG_PRODUCTION = {
  base() {
    const machine = `MCH-${randAlnum(6)}`;
    return {
      "event.type": "PRODUCTION_EVENT",
      "line.id": `LINE-${randDigits(2)}`,
      "machine.id": machine,
      "machine.type": pick(["CNC", "ROBOT", "CONVEYOR", "PRESS", "INSPECTION"]),
      shift: pick(["MORNING", "AFTERNOON", "NIGHT"]),
      latency_ms: intBetween(2, 100),
    };
  },
  ok() {
    const b = MFG_PRODUCTION.base();
    return {
      ...b,
      "event.subtype": "CYCLE_COMPLETE",
      "units.produced": intBetween(1, 500),
      "defect.rate": +numBetween(0, 2),
      "oee.score": +numBetween(80, 98),
      message: `${b["machine.id"]} — CYCLE_COMPLETE on ${b["line.id"]}`,
    };
  },
  err() {
    const b = MFG_PRODUCTION.base();
    return {
      ...b,
      "event.subtype": "DOWNTIME_START",
      "downtime.reason": pick(["BREAKDOWN", "QUALITY_HOLD", "MATERIAL_SHORTAGE"]),
      "oee.score": +numBetween(65, 80),
      message: `${b["machine.id"]} — DOWNTIME_START on ${b["line.id"]}`,
    };
  },
  warn() {
    const b = MFG_PRODUCTION.base();
    return {
      ...b,
      "event.subtype": "DEFECT_DETECTED",
      "defect.rate": +numBetween(2, 8),
      "oee.score": +numBetween(70, 88),
      message: `${b["machine.id"]} — DEFECT_DETECTED on ${b["line.id"]}`,
    };
  },
};

const MFG_QUALITY = {
  ok() {
    return {
      "event.type": "INSPECTION",
      "result": "PASS",
      "lot.id": `LOT-${randAlnum(8)}`,
      "defect.rate": +numBetween(0, 1.5),
      message: "Inspection passed",
    };
  },
  err() {
    return {
      "event.type": "INSPECTION",
      "result": "FAIL",
      "defect.code": pick(["DIM_OUT_OF_SPEC", "SURFACE_DEFECT", "WELD_FAULT", "TORQUE_FAIL"]),
      "lot.id": `LOT-${randAlnum(8)}`,
      message: "Inspection failed — lot held",
    };
  },
  warn() {
    return {
      "event.type": "INSPECTION",
      "result": "MARGINAL",
      "lot.id": `LOT-${randAlnum(8)}`,
      message: "Inspection marginal — flagged for retest",
    };
  },
};

const MFG_SUPPLY = {
  ok() {
    return {
      "event.type": "PO_EVENT",
      "po.id": `PO-${randDigits(8)}`,
      action: pick(["CREATED", "ACK", "SHIPPED", "RECEIVED"]),
      "supplier.id": `SUP-${randDigits(4)}`,
      message: "Purchase order processed",
    };
  },
  err() {
    return {
      "event.type": "SUPPLIER_SLA_BREACH",
      "supplier.id": `SUP-${randDigits(4)}`,
      "delay.days": intBetween(1, 14),
      message: "Supplier missed delivery SLA",
    };
  },
  warn() {
    return {
      "event.type": "SUPPLIER_SLA_RISK",
      "supplier.id": `SUP-${randDigits(4)}`,
      "minutes.until.breach": intBetween(60, 600),
      message: "Supplier nearing SLA threshold",
    };
  },
};

const INS_CLAIMS = {
  base() {
    const id = `IC-${randDigits(10)}`;
    const status = pick(["FNOL_RECEIVED", "ASSIGNED", "INSPECTION", "ESTIMATE", "APPROVED", "DENIED", "CLOSED"]);
    return {
      "event.type": "CLAIM_LIFECYCLE",
      "claim.id": id,
      "policy.type": pick(["AUTO", "HOME", "LIFE", "COMMERCIAL", "HEALTH"]),
      "claim.status": status,
      "claim.severity": pick(["MINOR", "MODERATE", "MAJOR", "CATASTROPHIC"]),
      "claim.amount": +numBetween(500, 2_500_000),
      "days.open": intBetween(0, 120),
      "adjuster.id": `ADJ-${randDigits(4)}`,
      "fraud.indicator": chance(0.08),
      "sla.status": pick(["ON_TRACK", "AT_RISK", "BREACHED"]),
      message: `Claim ${id} — ${status} (severity: ${pick(["MINOR", "MODERATE", "MAJOR"])})`,
    };
  },
  ok() { return INS_CLAIMS.base(); },
  err() {
    return {
      ...INS_CLAIMS.base(),
      "claim.status": "DENIED",
      "sla.status": "BREACHED",
    };
  },
  warn() {
    return {
      ...INS_CLAIMS.base(),
      "sla.status": "AT_RISK",
    };
  },
};

const INS_UW = {
  ok() {
    return {
      "event.type": "UNDERWRITING",
      "quote.id": `QT-${randDigits(8)}`,
      "policy.type": pick(["AUTO", "HOME", "LIFE", "COMMERCIAL"]),
      "risk.score": +numBetween(0, 1),
      "decision": pick(["APPROVED", "REFER", "DECLINED"]),
      "premium": +numBetween(120, 8000),
      latency_ms: intBetween(80, 2200),
      message: "Underwriting decision recorded",
    };
  },
  err() {
    return {
      "event.type": "UNDERWRITING_ERROR",
      "error.code": pick(["MODEL_TIMEOUT", "DATA_MISSING", "RULES_FAILURE"]),
      message: "Underwriting flow errored",
    };
  },
  warn() {
    return {
      "event.type": "MANUAL_REFERRAL",
      "quote.id": `QT-${randDigits(8)}`,
      message: "Quote referred to senior underwriter",
    };
  },
};

const INS_POLICY = {
  ok() {
    return {
      "event.type": "POLICY_EVENT",
      "policy.id": `POL-${randDigits(9)}`,
      action: pick(["RENEWAL", "ENDORSEMENT", "CANCELLATION", "ISSUE"]),
      latency_ms: intBetween(50, 1200),
      message: "Policy event processed",
    };
  },
  err() {
    return {
      "event.type": "POLICY_FAILURE",
      "error.code": pick(["BILLING_REJECT", "DOC_GEN_FAIL", "STATE_FILING_FAIL"]),
      message: "Policy operation failed",
    };
  },
  warn() {
    return {
      "event.type": "POLICY_LAPSE_RISK",
      "policy.id": `POL-${randDigits(9)}`,
      "days.to.lapse": intBetween(1, 14),
      message: "Policy approaching lapse",
    };
  },
};

const GAME_SESSIONS = {
  base() {
    const id = `PLR-${randDigits(8)}`;
    const region = pick(["NA", "EU", "APAC", "LATAM", "MEA"]);
    return {
      "event.type": "PLAYER_EVENT",
      "player.id": id,
      "player.level": intBetween(1, 100),
      "player.region": region,
      "game.mode": pick(["RANKED", "CASUAL", "TOURNAMENT", "PRACTICE"]),
      latency_ms: intBetween(15, 250),
      "server.id": `SRV-${region}-${randDigits(3)}`,
      "anti_cheat.flag": chance(0.01),
    };
  },
  ok() {
    const b = GAME_SESSIONS.base();
    const subtype = pick(["LOGIN", "MATCH_START", "MATCH_END", "PURCHASE", "ACHIEVEMENT"]);
    const extra: Record<string, unknown> = {};
    if (subtype === "MATCH_END") {
      extra["match.duration_ms"] = intBetween(120000, 3600000);
      extra["match.result"] = pick(["WIN", "LOSS", "DRAW"]);
    }
    return {
      ...b,
      "event.subtype": subtype,
      ...extra,
      message: `Player ${b["player.id"]} — ${subtype}`,
    };
  },
  err() {
    const b = GAME_SESSIONS.base();
    return {
      ...b,
      "event.subtype": "DISCONNECT",
      "disconnect.reason": pick(["TIMEOUT", "CLIENT_CRASH", "SERVER_KICK"]),
      message: `Player ${b["player.id"]} — DISCONNECT`,
    };
  },
  warn() {
    const b = GAME_SESSIONS.base();
    return {
      ...b,
      "event.subtype": "MATCH_ABANDONED",
      "match.result": "ABANDONED",
      message: `Player ${b["player.id"]} — MATCH_ABANDONED`,
    };
  },
};

const GAME_MONETIZATION = {
  ok() {
    return {
      "event.type": "IAP",
      "player.id": `PLR-${randDigits(8)}`,
      "offer.id": `OFR-${randAlnum(6)}`,
      "amount": +numBetween(0.99, 99.99),
      "currency": pick(["USD", "EUR", "GBP", "JPY"]),
      latency_ms: intBetween(40, 800),
      message: "IAP completed",
    };
  },
  err() {
    return {
      "event.type": "IAP_FAILED",
      "error.code": pick(["RECEIPT_INVALID", "PAYMENT_DECLINED", "STORE_TIMEOUT"]),
      message: "IAP failed",
    };
  },
  warn() {
    return {
      "event.type": "IAP_FRAUD_FLAG",
      "player.id": `PLR-${randDigits(8)}`,
      message: "IAP flagged for review",
    };
  },
};

const GAME_LIVEOPS = {
  ok() {
    return {
      "event.type": "LIVEOPS",
      "event.id": `EVT-${randAlnum(6)}`,
      "players.online": intBetween(1000, 250000),
      "server.region": pick(["NA", "EU", "APAC", "LATAM", "MEA"]),
      "cpu.pct": +numBetween(15, 85),
      message: "Live ops heartbeat",
    };
  },
  err() {
    return {
      "event.type": "LIVEOPS_INCIDENT",
      "incident.severity": pick(["SEV1", "SEV2", "SEV3"]),
      message: "Live ops incident opened",
    };
  },
  warn() {
    return {
      "event.type": "CAPACITY_WARNING",
      "cpu.pct": +numBetween(85, 99),
      message: "Server fleet near capacity",
    };
  },
};

// ===== Logistics =========================================================

const LOG_LASTMILE = {
  ok() {
    const id = `PKG-${randDigits(10)}`;
    const subtype = pick(["DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED"]);
    const attempt = subtype === "DELIVERED" ? intBetween(1, 2) : 1;
    return {
      "event.type": "DELIVERY_EVENT",
      "package.id": id,
      "event.subtype": subtype,
      "driver.id": `DRV-${randDigits(5)}`,
      "route.id": `RTE-${randAlnum(6)}`,
      zone: pick(["URBAN", "SUBURBAN", "RURAL", "REMOTE"]),
      carrier: pick(["FEDEX", "UPS", "DHL", "USPS", "AMAZON_LOGISTICS", "ONTRACK"]),
      "sla.type": pick(["SAME_DAY", "NEXT_DAY", "2_DAY", "STANDARD"]),
      "sla.met": subtype === "DELIVERED" ? chance(0.88) : true,
      "attempt.number": attempt,
      "estimated.delivery_ts": new Date(Date.now() + intBetween(60_000, 3_600_000)).toISOString(),
      "stop.sequence": intBetween(1, 35),
      latency_ms: intBetween(50, 3000),
      message: `Package ${id} — ${subtype} (attempt ${attempt})`,
    };
  },
  warn() {
    const id = `PKG-${randDigits(10)}`;
    return {
      "event.type": "DELIVERY_EVENT",
      "package.id": id,
      "event.subtype": "DELIVERY_ATTEMPT",
      "driver.id": `DRV-${randDigits(5)}`,
      "route.id": `RTE-${randAlnum(6)}`,
      zone: pick(["URBAN", "SUBURBAN", "RURAL", "REMOTE"]),
      carrier: pick(["FEDEX", "UPS", "DHL", "USPS", "AMAZON_LOGISTICS", "ONTRACK"]),
      "sla.type": pick(["SAME_DAY", "NEXT_DAY", "2_DAY", "STANDARD"]),
      "attempt.number": intBetween(2, 3),
      "stop.sequence": intBetween(1, 35),
      latency_ms: intBetween(50, 3000),
      message: `Package ${id} — DELIVERY_ATTEMPT`,
    };
  },
  err() {
    const id = `PKG-${randDigits(10)}`;
    const subtype = pick(["FAILED_DELIVERY", "RETURNED_TO_DEPOT"]);
    return {
      "event.type": "DELIVERY_EVENT",
      "package.id": id,
      "event.subtype": subtype,
      "driver.id": `DRV-${randDigits(5)}`,
      "route.id": `RTE-${randAlnum(6)}`,
      zone: pick(["URBAN", "SUBURBAN", "RURAL", "REMOTE"]),
      carrier: pick(["FEDEX", "UPS", "DHL", "USPS", "AMAZON_LOGISTICS", "ONTRACK"]),
      "sla.type": pick(["SAME_DAY", "NEXT_DAY", "2_DAY", "STANDARD"]),
      "sla.met": false,
      "attempt.number": intBetween(1, 3),
      "failure.reason": pick(["NOT_HOME", "ACCESS_DENIED", "ADDRESS_ERROR", "DAMAGED", "WEATHER"]),
      "stop.sequence": intBetween(1, 35),
      latency_ms: intBetween(50, 3000),
      message: `Package ${id} — ${subtype}`,
    };
  },
};

const LOG_WAREHOUSE = {
  base() {
    const id = `ITM-${randDigits(8)}`;
    const sub = pick(["INBOUND_SCAN", "PUTAWAY", "PICK", "PACK", "QUALITY_CHECK", "OUTBOUND_SCAN"]);
    const zone = pick(["RECEIVING", "STORAGE", "PICKING", "PACKING", "DISPATCH", "RETURNS"]);
    return {
      "event.type": "WAREHOUSE_EVENT",
      "event.subtype": sub,
      "item.id": id,
      "warehouse.id": `WH-${pick(["EAST", "WEST", "CENTRAL", "NORTH", "SOUTH"])}`,
      zone,
      "operator.id": `OPR-${randDigits(4)}`,
      "processing.time_ms": intBetween(500, 15000),
      "conveyor.id": `CVR-${randDigits(3)}`,
      "throughput.rate": intBetween(200, 2000),
      message: `${sub} for item ${id} in zone ${zone}`,
    };
  },
  ok() { return LOG_WAREHOUSE.base(); },
  warn() {
    return { ...LOG_WAREHOUSE.base(), "event.subtype": "QUALITY_CHECK", message: "Quality hold opened" };
  },
  err() {
    return {
      ...LOG_WAREHOUSE.base(),
      "event.subtype": "EXCEPTION",
      "exception.type": pick(["MISMATCH", "DAMAGED", "LOST", "OVERSIZE", "HAZMAT"]),
      message: "Warehouse exception raised",
    };
  },
};

const LOG_FLEET = {
  base() {
    return {
      "event.type": "FLEET_TELEMETRY",
      "vehicle.id": `VEH-${randAlnum(8)}`,
      make: pick(["FORD", "MERCEDES", "ISUZU", "VOLVO"]),
      "speed.kmh": intBetween(0, 110),
      "odometer.km": intBetween(1000, 350000),
      region: pick(["NA", "EU", "APAC"]),
      latency_ms: intBetween(20, 800),
    };
  },
  ok() { return { ...LOG_FLEET.base(), "event.subtype": "HEARTBEAT", message: "Vehicle heartbeat" }; },
  warn() { return { ...LOG_FLEET.base(), "event.subtype": "MAINTENANCE_DUE", message: "Maintenance due soon" }; },
  err() {
    return {
      ...LOG_FLEET.base(),
      "event.subtype": "FAULT",
      "fault.code": pick(["P0301", "P0420", "P0171", "U0100"]),
      severity: pick(["MEDIUM", "HIGH", "CRITICAL"]),
      message: "Vehicle fault detected",
    };
  },
};

// ===== Energy & Utilities =================================================

const ENERGY_GRID = {
  base() {
    const sub = pick(["LOAD_READING", "VOLTAGE_ANOMALY", "FREQUENCY_DEVIATION", "SWITCH_OPERATION"]);
    return {
      "event.type": "GRID_EVENT",
      "event.subtype": sub,
      "node.id": `GRD-${randHex(8).toUpperCase()}`,
      "node.type": pick(["SUBSTATION", "FEEDER", "TRANSFORMER", "SWITCH", "METER_AGGREGATOR"]),
      region: pick(["NORTHEAST", "SOUTHEAST", "MIDWEST", "WEST", "SOUTHWEST"]),
      "load.mw": +numBetween(0.5, 500),
      "voltage.kv": +numBetween(4, 500),
      "frequency.hz": +numBetween(59.95, 60.05),
      "customers.affected": 0,
      severity: "INFO",
      message: `${sub} on grid node`,
    };
  },
  ok() { return ENERGY_GRID.base(); },
  warn() {
    const b = ENERGY_GRID.base();
    return {
      ...b,
      "event.subtype": pick(["VOLTAGE_ANOMALY", "FREQUENCY_DEVIATION"]),
      "frequency.hz": +numBetween(59.85, 59.95),
      "customers.affected": intBetween(50, 5000),
      severity: "MINOR",
      message: `Anomaly detected on ${b["node.id"]}`,
    };
  },
  err() {
    const customers = intBetween(500, 50000);
    const b = ENERGY_GRID.base();
    return {
      ...b,
      "event.subtype": "FAULT_DETECTED",
      "customers.affected": customers,
      severity: pick(["MAJOR", "CRITICAL"]),
      "auto.restored": chance(0.75),
      "restoration.time_ms": intBetween(500, 1_800_000),
      message: `FAULT_DETECTED on ${b["node.id"]} — ${customers} customers affected`,
    };
  },
};

const ENERGY_OUTAGE = {
  base() {
    const id = `OUT-${randDigits(8)}`;
    const customers = intBetween(10, 250000);
    return {
      "event.type": "OUTAGE_EVENT",
      "outage.id": id,
      cause: pick(["EQUIPMENT_FAILURE", "WEATHER", "VEGETATION", "ANIMAL", "VEHICLE_IMPACT", "UNKNOWN"]),
      "customers.affected": customers,
      region: pick(["NORTHEAST", "SOUTHEAST", "MIDWEST", "WEST", "SOUTHWEST"]),
      "estimated.restore_ts": new Date(Date.now() + intBetween(900_000, 28_800_000)).toISOString(),
      "regulatory.reportable": customers > 10000,
    };
  },
  ok() {
    const b = ENERGY_OUTAGE.base();
    const sub = pick(["CREW_DISPATCHED", "FAULT_ISOLATED", "RESTORATION_BEGIN", "PARTIAL_RESTORE"]);
    return {
      ...b,
      "event.subtype": sub,
      "crew.id": `CREW-${randDigits(4)}`,
      message: `Outage ${b["outage.id"]} — ${sub} (${b["customers.affected"]} customers)`,
    };
  },
  warn() {
    const b = ENERGY_OUTAGE.base();
    return {
      ...b,
      "event.subtype": "OUTAGE_START",
      message: `Outage ${b["outage.id"]} — OUTAGE_START (${b["customers.affected"]} customers)`,
    };
  },
  err() {
    const b = ENERGY_OUTAGE.base();
    return {
      ...b,
      "event.subtype": "RESTORED",
      "mttr.minutes": intBetween(15, 480),
      "crew.id": `CREW-${randDigits(4)}`,
      message: `Outage ${b["outage.id"]} — RESTORED`,
    };
  },
};

const ENERGY_METER = {
  ok() {
    return {
      "event.type": "METER_READ",
      "meter.id": `MTR-${randAlnum(10)}`,
      "reading.kwh": +numBetween(0, 60),
      region: pick(["NORTHEAST", "SOUTHEAST", "MIDWEST", "WEST", "SOUTHWEST"]),
      latency_ms: intBetween(10, 600),
      message: "Meter read accepted",
    };
  },
  warn() {
    return {
      "event.type": "MISSED_READ",
      "meter.id": `MTR-${randAlnum(10)}`,
      message: "Meter missed read window",
    };
  },
  err() {
    return {
      "event.type": "TAMPER_ALERT",
      "meter.id": `MTR-${randAlnum(10)}`,
      "tamper.type": pick(["SEAL_BROKEN", "MAGNETIC", "REVERSE_FLOW"]),
      message: "Tamper alert raised",
    };
  },
};

// ===== Automotive =========================================================

const VIN_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"; // no I, O, Q per VIN spec
const randVin = () => Array.from({ length: 17 }, () => VIN_CHARS[Math.floor(r() * VIN_CHARS.length)]).join("");
const semver = () => `v${intBetween(1, 6)}.${intBetween(0, 12)}.${intBetween(0, 25)}`;

const AUTO_TELEMATICS = {
  base() {
    const isEv = chance(0.4);
    return {
      "event.type": "VEHICLE_TELEMETRY",
      "vehicle.id": `VIN-${randVin()}`,
      make: pick(["TOYOTA", "FORD", "BMW", "TESLA", "GM", "HONDA", "VOLKSWAGEN", "MERCEDES"]),
      "model.year": intBetween(2020, 2026),
      region: pick(["NA", "EU", "APAC", "LATAM"]),
      "speed.kmh": intBetween(0, 200),
      "battery.pct": isEv ? intBetween(0, 100) : null,
      "fuel.pct": isEv ? null : intBetween(0, 100),
      "ota.version": semver(),
      latency_ms: intBetween(50, 2000),
    };
  },
  ok() {
    const b = AUTO_TELEMATICS.base();
    const sub = pick(["TRIP_START", "TRIP_END", "HEARTBEAT", "DIAGNOSTIC"]);
    return { ...b, "event.subtype": sub, message: `Vehicle ${b["vehicle.id"]} — ${sub}` };
  },
  warn() {
    const b = AUTO_TELEMATICS.base();
    return {
      ...b,
      "event.subtype": "ALERT",
      "alert.type": pick(["LOW_BATTERY", "MAINTENANCE_DUE", "RECALL_ACTIVE"]),
      "alert.severity": pick(["LOW", "MEDIUM"]),
      message: `Vehicle ${b["vehicle.id"]} — ALERT`,
    };
  },
  err() {
    const b = AUTO_TELEMATICS.base();
    const sub = pick(["ALERT", "CRASH_DETECT"]);
    return {
      ...b,
      "event.subtype": sub,
      "alert.type": sub === "CRASH_DETECT" ? "COLLISION_RISK" : pick(["ENGINE_FAULT", "COLLISION_RISK"]),
      "alert.severity": pick(["HIGH", "CRITICAL"]),
      message: `Vehicle ${b["vehicle.id"]} — ${sub}`,
    };
  },
};

const AUTO_OTA = {
  base() {
    return {
      "event.type": "OTA_EVENT",
      "vehicle.id": `VIN-${randVin()}`,
      "firmware.version.from": semver(),
      "firmware.version.to": semver(),
      "package.size.mb": intBetween(50, 2000),
      "download.speed.mbps": +numBetween(1, 50),
      region: pick(["NA", "EU", "APAC", "LATAM"]),
    };
  },
  ok() {
    const b = AUTO_OTA.base();
    const sub = pick(["UPDATE_AVAILABLE", "DOWNLOAD_START", "DOWNLOAD_COMPLETE", "INSTALL_START", "INSTALL_SUCCESS"]);
    return { ...b, "event.subtype": sub, message: `OTA ${sub} for ${b["vehicle.id"]}` };
  },
  warn() {
    const b = AUTO_OTA.base();
    return { ...b, "event.subtype": "ROLLBACK", "rollback.triggered": true, message: `OTA ROLLBACK for ${b["vehicle.id"]}` };
  },
  err() {
    const b = AUTO_OTA.base();
    return {
      ...b,
      "event.subtype": "INSTALL_FAIL",
      "failure.reason": pick(["CONNECTIVITY", "STORAGE", "VALIDATION", "POWER", "TIMEOUT"]),
      "rollback.triggered": chance(0.3),
      message: `OTA INSTALL_FAIL for ${b["vehicle.id"]}`,
    };
  },
};

const AUTO_EV = {
  ok() {
    return {
      "event.type": "EV_SESSION",
      "session.id": `EV-${randAlnum(10)}`,
      "station.id": `STN-${randDigits(5)}`,
      "session.kwh": +numBetween(5, 80),
      "session.minutes": intBetween(5, 90),
      region: pick(["NA", "EU", "APAC", "LATAM"]),
      revenue: +numBetween(2, 35),
      message: "EV session completed",
    };
  },
  warn() {
    return {
      "event.type": "EV_THROTTLE",
      "station.id": `STN-${randDigits(5)}`,
      message: "Charger throttled due to grid demand",
    };
  },
  err() {
    return {
      "event.type": "EV_SESSION_FAILED",
      "station.id": `STN-${randDigits(5)}`,
      "fail.reason": pick(["AUTH_FAIL", "HARDWARE", "NETWORK", "PAYMENT"]),
      message: "EV session failed",
    };
  },
};

// ===== Point of Sale ======================================================

const POS_TXN = {
  base() {
    const id = `POS-${randDigits(10)}`;
    return {
      "event.type": "POS_TRANSACTION",
      "transaction.id": id,
      "terminal.id": `TRM-${randAlnum(6)}`,
      "store.id": `STR-${randDigits(4)}`,
      amount: +numBetween(1, 500),
      "tender.type": pick(["CASH", "CREDIT", "DEBIT", "CONTACTLESS", "MOBILE_PAY", "GIFT_CARD"]),
      "items.count": intBetween(1, 20),
      "transaction.time_ms": intBetween(3000, 45000),
      "operator.id": `OPR-${randDigits(4)}`,
      "loyalty.applied": chance(0.35),
      _id: id,
    };
  },
  ok() {
    const b = POS_TXN.base();
    const sub = pick(["SALE", "TENDER_CHANGE"]);
    if (b["loyalty.applied"]) (b as Record<string, unknown>)["discount.pct"] = +numBetween(0, 30);
    delete (b as Record<string, unknown>)._id;
    return { ...b, "event.subtype": sub, message: `${sub} on terminal ${b["terminal.id"]}: $${b.amount}` };
  },
  warn() {
    const b = POS_TXN.base();
    delete (b as Record<string, unknown>)._id;
    return { ...b, "event.subtype": "VOID", message: `VOID on terminal ${b["terminal.id"]}: $${b.amount}` };
  },
  err() {
    const b = POS_TXN.base();
    delete (b as Record<string, unknown>)._id;
    return {
      ...b,
      "event.subtype": "SALE",
      "error.code": pick(["DECLINED", "TIMEOUT", "OFFLINE", "PRINTER_FAIL"]),
      message: `Failed transaction on terminal ${b["terminal.id"]}`,
    };
  },
};

const POS_TERMINAL = {
  base() {
    const status = pick(["ONLINE", "OFFLINE", "DEGRADED", "UPDATING"]);
    return {
      "event.type": "TERMINAL_HEALTH",
      "terminal.id": `TRM-${randAlnum(6)}`,
      "store.id": `STR-${randDigits(4)}`,
      "terminal.status": status,
      "uptime.pct": status === "OFFLINE" ? 0 : +numBetween(95, 100),
      "last.transaction.mins": intBetween(0, 120),
      "software.version": `v${randDigits(2)}.${randDigits(2)}`,
      region: pick(["NORTHEAST", "SOUTHEAST", "MIDWEST", "WEST", "SOUTHWEST"]),
    };
  },
  ok() {
    const b = POS_TERMINAL.base();
    return { ...b, "event.subtype": pick(["HEARTBEAT", "ONLINE"]), message: `Terminal ${b["terminal.id"]} healthy` };
  },
  warn() {
    const b = POS_TERMINAL.base();
    return { ...b, "event.subtype": "PAPER_LOW", "terminal.status": "DEGRADED", message: `Terminal ${b["terminal.id"]} paper low` };
  },
  err() {
    const b = POS_TERMINAL.base();
    return { ...b, "event.subtype": pick(["OFFLINE", "PRINTER_ERROR"]), "terminal.status": "OFFLINE", "uptime.pct": 0, message: `Terminal ${b["terminal.id"]} offline` };
  },
};

const POS_KITCHEN = {
  ok() {
    return {
      "event.type": "KDS_EVENT",
      "order.id": `KDS-${randDigits(8)}`,
      "station.id": pick(["GRILL", "FRYER", "SALAD", "DRINKS", "EXPO"]),
      "prep.time_ms": intBetween(60_000, 600_000),
      message: "Order routed to KDS",
    };
  },
  warn() {
    return {
      "event.type": "KDS_DELAY",
      "order.id": `KDS-${randDigits(8)}`,
      "station.id": pick(["GRILL", "FRYER", "SALAD", "DRINKS", "EXPO"]),
      message: "Order prep exceeding target time",
    };
  },
  err() {
    return {
      "event.type": "KDS_ROUTING_FAILURE",
      "order.id": `KDS-${randDigits(8)}`,
      "fail.reason": pick(["STATION_OFFLINE", "PRINTER_FAIL", "NETWORK"]),
      message: "Failed to route to kitchen",
    };
  },
};

// ===== Airlines & Aviation ================================================

const AIRPORT_CODES = ["JFK", "LAX", "ORD", "ATL", "SFO", "LHR", "CDG", "FRA", "DXB", "HND", "SIN", "SYD", "GRU", "DEL"];
const randGate = () => `${pick("ABCDEF".split(""))}${randDigits(2)}`;

const AIRLINES_FLIGHT = {
  base() {
    const airline = pick(["AA", "UA", "DL", "SW", "BA", "LH", "AF", "EK"]);
    const id = `FLT-${airline}${randDigits(4)}`;
    return {
      "event.type": "FLIGHT_EVENT",
      "flight.id": id,
      airline,
      origin: pick(AIRPORT_CODES),
      destination: pick(AIRPORT_CODES),
      "aircraft.type": pick(["B737", "B777", "B787", "A320", "A350", "A380"]),
      passengers: intBetween(100, 550),
      gate: randGate(),
      "on.time": chance(0.8),
    };
  },
  ok() {
    const b = AIRLINES_FLIGHT.base();
    const sub = pick(["SCHEDULED", "BOARDING", "DEPARTED", "AIRBORNE", "LANDED", "ARRIVED"]);
    return { ...b, "event.subtype": sub, message: `Flight ${b["flight.id"]} ${b.origin}→${b.destination} — ${sub}` };
  },
  warn() {
    const b = AIRLINES_FLIGHT.base();
    return {
      ...b,
      "event.subtype": "DELAYED",
      "delay.minutes": intBetween(15, 240),
      "delay.reason": pick(["ATC", "WEATHER", "MECHANICAL", "CREW", "FUELING", "CATERING", "LATE_AIRCRAFT"]),
      "on.time": false,
      message: `Flight ${b["flight.id"]} ${b.origin}→${b.destination} — DELAYED`,
    };
  },
  err() {
    const b = AIRLINES_FLIGHT.base();
    const sub = pick(["CANCELLED", "DIVERTED"]);
    return {
      ...b,
      "event.subtype": sub,
      "delay.reason": pick(["ATC", "WEATHER", "MECHANICAL", "CREW"]),
      "on.time": false,
      message: `Flight ${b["flight.id"]} ${b.origin}→${b.destination} — ${sub}`,
    };
  },
};

const AIRLINES_PAX = {
  base() {
    return {
      "event.type": "PASSENGER_EVENT",
      "pax.id": `PAX-${randDigits(8)}`,
      "flight.id": `FLT-${pick(["AA", "UA", "DL"])}${randDigits(4)}`,
      channel: pick(["WEB", "MOBILE", "KIOSK", "COUNTER", "AGENT"]),
      class: pick(["FIRST", "BUSINESS", "PREMIUM_ECONOMY", "ECONOMY"]),
      "frequent.flyer": chance(0.25),
      "bag.count": intBetween(0, 3),
      "processing.time_ms": intBetween(30000, 600000),
    };
  },
  ok() {
    const b = AIRLINES_PAX.base();
    const sub = pick(["CHECK_IN", "BAG_DROP", "SECURITY_PASS", "BOARDING", "SETTLED", "BAG_CLAIM", "EXIT"]);
    return { ...b, "event.subtype": sub, message: `Passenger ${b["pax.id"]} on ${b["flight.id"]} — ${sub} via ${b.channel}` };
  },
  warn() {
    const b = AIRLINES_PAX.base();
    return {
      ...b,
      "event.subtype": pick(["CHECK_IN", "BAG_DROP"]),
      exception: pick(["BAG_OVERWEIGHT", "UPGRADE_PROCESSED", "STANDBY_CLEARED"]),
      message: `Passenger ${b["pax.id"]} — exception handled`,
    };
  },
  err() {
    const b = AIRLINES_PAX.base();
    return {
      ...b,
      "event.subtype": "CHECK_IN",
      exception: "DOCUMENT_ISSUE",
      message: `Passenger ${b["pax.id"]} — document issue at check-in`,
    };
  },
};

const AIRLINES_GROUND = {
  ok() {
    return {
      "event.type": "GROUND_OPS",
      "flight.id": `FLT-${pick(["AA", "UA", "DL"])}${randDigits(4)}`,
      stage: pick(["DEBOARDING", "FUELING", "CATERING", "CLEANING", "LOADING", "READY"]),
      "turn.minutes": intBetween(20, 120),
      gate: randGate(),
      message: "Ground op completed",
    };
  },
  warn() {
    return {
      "event.type": "GROUND_DELAY",
      "flight.id": `FLT-${pick(["AA", "UA", "DL"])}${randDigits(4)}`,
      stage: pick(["FUELING", "CATERING"]),
      "delay.minutes": intBetween(5, 30),
      message: "Turn delay detected",
    };
  },
  err() {
    return {
      "event.type": "GROUND_FAILURE",
      "flight.id": `FLT-${pick(["AA", "UA", "DL"])}${randDigits(4)}`,
      "fail.reason": pick(["EQUIPMENT", "STAFFING", "WEATHER"]),
      message: "Ground op failure — turn at risk",
    };
  },
};

// ===== IoT & Industrial ===================================================

const IOT_FLEET = {
  base() {
    const status = pick(["ONLINE", "OFFLINE", "DEGRADED", "UPDATING", "ERROR"]);
    const wired = chance(0.4);
    return {
      "event.type": "DEVICE_EVENT",
      "device.id": `DEV-${randHex(8)}`,
      "device.type": pick(["SENSOR", "GATEWAY", "CAMERA", "ACTUATOR", "CONTROLLER", "DISPLAY"]),
      "device.status": status,
      "firmware.version": semver(),
      "firmware.latest": chance(0.7),
      "signal.strength.dbm": intBetween(-90, -40),
      "battery.pct": wired ? null : intBetween(0, 100),
      "location.zone": pick(["FLOOR_1", "FLOOR_2", "WAREHOUSE", "OUTDOOR", "SERVER_ROOM", "LOBBY"]),
      "uptime.hours": intBetween(0, 8760),
      latency_ms: intBetween(10, 5000),
    };
  },
  ok() {
    const b = IOT_FLEET.base();
    return { ...b, "event.subtype": pick(["HEARTBEAT", "ONLINE", "CONFIG_CHANGE"]), message: `Device ${b["device.id"]} healthy` };
  },
  warn() {
    const b = IOT_FLEET.base();
    return {
      ...b,
      "event.subtype": "ALERT",
      "alert.type": pick(["LOW_BATTERY", "SIGNAL_LOSS", "MEMORY_LOW"]),
      message: `Device ${b["device.id"]} — alert raised`,
    };
  },
  err() {
    const b = IOT_FLEET.base();
    return {
      ...b,
      "device.status": "OFFLINE",
      "event.subtype": pick(["OFFLINE", "ALERT"]),
      "alert.type": pick(["OFFLINE", "TAMPERING", "OVERTEMP"]),
      message: `Device ${b["device.id"]} — critical alert`,
    };
  },
};

const IOT_SENSOR = {
  reading() {
    const type = pick(["TEMPERATURE", "PRESSURE", "HUMIDITY", "VIBRATION", "FLOW", "CURRENT", "PROXIMITY"]);
    let value: number;
    let unit: string;
    switch (type) {
      case "TEMPERATURE": value = +numBetween(15, 120); unit = "CELSIUS"; break;
      case "PRESSURE": value = +numBetween(0, 150); unit = "BAR"; break;
      case "HUMIDITY": value = +numBetween(20, 95); unit = "PERCENT"; break;
      case "VIBRATION": value = +numBetween(0, 20); unit = "G"; break;
      case "FLOW": value = +numBetween(0, 500); unit = "LPS"; break;
      case "CURRENT": value = +numBetween(0, 100); unit = "AMPS"; break;
      default: value = +numBetween(0, 1000); unit = "MM";
    }
    return {
      "sensor.id": `SNS-${randHex(8)}`,
      "sensor.type": type,
      "reading.value": value,
      "reading.unit": unit,
      "plant.id": `PLT-${randDigits(3)}`,
      "asset.id": `AST-${randAlnum(6)}`,
    };
  },
  ok() {
    const r = IOT_SENSOR.reading();
    return {
      "event.type": "SENSOR_READING",
      ...r,
      "threshold.breach": false,
      "maintenance.due": chance(0.08),
      "anomaly.score": +numBetween(0, 0.4),
      message: `Sensor ${r["sensor.id"]} (${r["sensor.type"]}): ${r["reading.value"]} ${r["reading.unit"]}`,
    };
  },
  warn() {
    const r = IOT_SENSOR.reading();
    return {
      "event.type": "SENSOR_READING",
      ...r,
      "threshold.breach": true,
      "threshold.type": pick(["HIGH", "LOW", "RATE_OF_CHANGE"]),
      "anomaly.score": +numBetween(0.5, 0.79),
      message: `Sensor ${r["sensor.id"]} — threshold breach`,
    };
  },
  err() {
    const r = IOT_SENSOR.reading();
    return {
      "event.type": "SENSOR_ANOMALY",
      ...r,
      "threshold.breach": true,
      "threshold.type": "RATE_OF_CHANGE",
      "anomaly.score": +numBetween(0.85, 1.0),
      message: `Sensor ${r["sensor.id"]} — anomaly detected`,
    };
  },
};

const IOT_FIRMWARE = {
  base() {
    return {
      "event.type": "FIRMWARE_EVENT",
      "device.id": `DEV-${randHex(8)}`,
      "firmware.version.from": semver(),
      "firmware.version.to": semver(),
      region: pick(["NA", "EU", "APAC"]),
    };
  },
  ok() { return { ...IOT_FIRMWARE.base(), "event.subtype": "INSTALL_SUCCESS", message: "Firmware install succeeded" }; },
  warn() { return { ...IOT_FIRMWARE.base(), "event.subtype": "ROLLBACK", message: "Firmware rolled back" }; },
  err() {
    return {
      ...IOT_FIRMWARE.base(),
      "event.subtype": "INSTALL_FAIL",
      "fail.reason": pick(["VALIDATION", "POWER", "STORAGE", "TIMEOUT"]),
      message: "Firmware install failed",
    };
  },
};

// ===== Media & Streaming ==================================================

const MEDIA_PLAYBACK = {
  base() {
    return {
      "event.type": "PLAYBACK_EVENT",
      "session.id": `SES-${randAlnum(12)}`,
      "viewer.id": `VWR-${randDigits(8)}`,
      "content.id": `CNT-${randAlnum(8)}`,
      "content.type": pick(["LIVE", "VOD", "TRAILER", "SHORT_FORM"]),
      quality: pick(["4K", "1080P", "720P", "480P", "360P", "AUTO"]),
      "cdn.pop": pick(["US-EAST", "US-WEST", "EU-WEST", "EU-CENTRAL", "APAC-EAST", "APAC-SE"]),
      "device.type": pick(["SMART_TV", "MOBILE", "TABLET", "WEB", "STB"]),
      "bitrate.kbps": intBetween(400, 20000),
      "rebuffering.ratio": +numBetween(0, 0.05),
    };
  },
  ok() {
    const b = MEDIA_PLAYBACK.base();
    const sub = pick(["PLAY_REQUEST", "MANIFEST_FETCH", "SEGMENT_REQUEST", "SESSION_END"]);
    const extra: Record<string, unknown> = {};
    if (sub === "PLAY_REQUEST") extra["startup.time_ms"] = intBetween(500, 8000);
    return { ...b, ...extra, "event.subtype": sub, message: `Session ${b["session.id"]} — ${sub} (${b.quality} on ${b["device.type"]})` };
  },
  warn() {
    const b = MEDIA_PLAYBACK.base();
    return {
      ...b,
      "event.subtype": pick(["BUFFER_START", "BUFFER_END"]),
      "buffering.duration_ms": intBetween(500, 30000),
      "rebuffering.ratio": +numBetween(0.05, 0.15),
      message: `Session ${b["session.id"]} — buffering`,
    };
  },
  err() {
    const b = MEDIA_PLAYBACK.base();
    return {
      ...b,
      "event.subtype": "PLAYBACK_ERROR",
      "error.code": pick(["404", "502", "SEGMENT_MISSING", "DRM_FAIL", "TIMEOUT"]),
      message: `Session ${b["session.id"]} — PLAYBACK_ERROR`,
    };
  },
};

const MEDIA_LIVE = {
  ok() {
    return {
      "event.type": "LIVE_STREAM",
      "stream.id": `LIV-${randAlnum(8)}`,
      "cdn.pop": pick(["US-EAST", "US-WEST", "EU-WEST", "APAC-EAST"]),
      viewers: intBetween(1000, 500000),
      "encoder.health": pick(["GREEN", "GREEN", "AMBER"]),
      "bitrate.kbps": intBetween(2000, 12000),
      message: "Live stream healthy",
    };
  },
  warn() {
    return {
      "event.type": "LIVE_DEGRADATION",
      "stream.id": `LIV-${randAlnum(8)}`,
      "cdn.pop": pick(["US-EAST", "US-WEST", "EU-WEST", "APAC-EAST"]),
      "encoder.health": "AMBER",
      message: "Live stream degraded",
    };
  },
  err() {
    return {
      "event.type": "LIVE_ERROR",
      "stream.id": `LIV-${randAlnum(8)}`,
      "encoder.health": "RED",
      "error.code": pick(["ENCODER_DROP", "ORIGIN_FAIL", "SEGMENT_LOSS"]),
      message: "Live stream error",
    };
  },
};

const MEDIA_AD = {
  base() {
    return {
      "event.type": "AD_EVENT",
      "session.id": `SES-${randAlnum(12)}`,
      "ad.id": `AD-${randAlnum(8)}`,
      "ad.type": pick(["PRE_ROLL", "MID_ROLL", "POST_ROLL", "OVERLAY"]),
      advertiser: pick(["BRAND_A", "BRAND_B", "BRAND_C", "BRAND_D", "BRAND_E"]),
      "ad.duration_ms": intBetween(15000, 60000),
      "fill.rate": +numBetween(0.7, 1),
      "decision.latency_ms": intBetween(5, 500),
      "revenue.cpm": +numBetween(1, 50),
      "skip.eligible": chance(0.5),
    };
  },
  ok() {
    const b = MEDIA_AD.base();
    const sub = pick(["AD_REQUEST", "AD_DECISION", "AD_LOADED", "AD_STARTED", "AD_COMPLETED"]);
    return { ...b, "event.subtype": sub, message: `Ad ${sub} for session ${b["session.id"]}: ${b["ad.type"]}` };
  },
  warn() {
    const b = MEDIA_AD.base();
    return { ...b, "event.subtype": "AD_SKIPPED", message: "Ad skipped by viewer" };
  },
  err() {
    const b = MEDIA_AD.base();
    return {
      ...b,
      "event.subtype": "AD_ERROR",
      "error.type": pick(["TIMEOUT", "NO_FILL", "INVALID_VAST", "NETWORK"]),
      message: "Ad error",
    };
  },
};

// ===== PACKS registry =====================================================

type Pack = {
  ok: () => Record<string, unknown>;
  err: () => Record<string, unknown>;
  warn: () => Record<string, unknown>;
};

const PACKS: Record<string, Pack> = {
  "financial/payments": FIN_PAYMENTS,
  "financial/fraud": FIN_FRAUD,
  "financial/trading": FIN_TRADING,
  "healthcare/patient_portal": HC_PORTAL,
  "healthcare/claims": HC_CLAIMS,
  "healthcare/ehr": HC_EHR,
  "retail/orders": RETAIL_ORDERS,
  "retail/inventory": RETAIL_INVENTORY,
  "retail/cx": RETAIL_CX,
  "telco/network": TELCO_NETWORK,
  "telco/billing": TELCO_BILLING,
  "telco/care": TELCO_CARE,
  "manufacturing/production": MFG_PRODUCTION,
  "manufacturing/quality": MFG_QUALITY,
  "manufacturing/supply_chain": MFG_SUPPLY,
  "insurance/claims": INS_CLAIMS,
  "insurance/underwriting": INS_UW,
  "insurance/policy": INS_POLICY,
  "gaming/sessions": GAME_SESSIONS,
  "gaming/monetization": GAME_MONETIZATION,
  "gaming/live_ops": GAME_LIVEOPS,
  "logistics/last_mile": LOG_LASTMILE,
  "logistics/warehouse": LOG_WAREHOUSE,
  "logistics/fleet": LOG_FLEET,
  "energy/smart_grid": ENERGY_GRID,
  "energy/outage": ENERGY_OUTAGE,
  "energy/metering": ENERGY_METER,
  "automotive/telematics": AUTO_TELEMATICS,
  "automotive/ota_updates": AUTO_OTA,
  "automotive/ev_charging": AUTO_EV,
  "pos/transactions": POS_TXN,
  "pos/terminal_health": POS_TERMINAL,
  "pos/kitchen": POS_KITCHEN,
  "airlines/flight_ops": AIRLINES_FLIGHT,
  "airlines/passenger": AIRLINES_PAX,
  "airlines/ground_ops": AIRLINES_GROUND,
  "iot/device_fleet": IOT_FLEET,
  "iot/sensor_telemetry": IOT_SENSOR,
  "iot/firmware": IOT_FIRMWARE,
  "media/video_delivery": MEDIA_PLAYBACK,
  "media/live_streaming": MEDIA_LIVE,
  "media/ad_insertion": MEDIA_AD,
};

// INFO-level event.type variants (mirrors workflowBuilder.ts) so the preview
// shows a diverse Event Mix matching what the deployed workflow produces.
const INFO_TYPE_VARIANTS: Record<string, string[]> = {
  "financial/payments":         ["TRANSACTION_COMPLETED","CARD_AUTHORIZED","SETTLEMENT","REFUND_ISSUED","WALLET_TOPUP"],
  "financial/fraud":            ["FRAUD_SCORED","TRANSACTION_REVIEWED","RULE_EVALUATED","DEVICE_FINGERPRINT","WHITELIST_HIT"],
  "financial/trading":          ["ORDER_EXECUTED","ORDER_PLACED","ORDER_AMENDED","QUOTE_REQUEST","TRADE_CONFIRMED"],
  "healthcare/patient_portal":  ["PATIENT_ACTION","RECORD_VIEW","APPOINTMENT_BOOKED","MESSAGE_SENT","PRESCRIPTION_REFILL"],
  "healthcare/claims":          ["CLAIM_SUBMITTED","CLAIM_APPROVED","CLAIM_PAID","CLAIM_PENDED","ELIGIBILITY_CHECK"],
  "healthcare/ehr":             ["HL7_MESSAGE","HL7_ADT","HL7_ORM","HL7_ORU","HL7_ACK"],
  "retail/orders":              ["ORDER_CREATED","ORDER_PICKED","ORDER_SHIPPED","ORDER_DELIVERED","ORDER_CONFIRMED"],
  "retail/inventory":           ["STOCK_CHECK","REORDER_TRIGGERED","RECEIVING","CYCLE_COUNT","TRANSFER"],
  "retail/cx":                  ["BROWSE","SEARCH","ADD_TO_CART","WISHLIST_ADD","PRODUCT_VIEW"],
  "telco/network":              ["KPI_OK","HEALTH_CHECK","UTILIZATION_SAMPLE","HANDOFF","SIGNAL_REPORT"],
  "telco/billing":              ["USAGE_EVENT","CDR_RATED","INVOICE_GENERATED","PAYMENT_POSTED","ACCOUNT_ADJUSTED"],
  "telco/care":                 ["TICKET_UPDATE","CALL_LOGGED","CHAT_LOGGED","KNOWLEDGE_LOOKUP","SURVEY_RESPONSE"],
  "manufacturing/production":   ["UNIT_PRODUCED","SHIFT_START","OEE_SAMPLE","CHANGEOVER","INSPECTION_PASS"],
  "manufacturing/quality":      ["INSPECTION_PASS","SAMPLE_TAKEN","CALIBRATION_OK","AUDIT_LOGGED","SPEC_VERIFIED"],
  "manufacturing/supply_chain": ["PO_EVENT","ASN_RECEIVED","GOODS_RECEIPT","SUPPLIER_CONFIRMED","SHIPMENT_DISPATCHED"],
  "insurance/claims":           ["CLAIM_OPENED","ADJUSTER_ASSIGNED","INSPECTION_BOOKED","PAYMENT_RELEASED","CLAIM_CLOSED"],
  "insurance/underwriting":     ["QUOTE_REQUESTED","RISK_SCORED","POLICY_ISSUED","DOCUMENT_UPLOADED","BIND_CONFIRMED"],
  "insurance/policy":           ["POLICY_RENEWED","ENDORSEMENT","BENEFICIARY_UPDATED","ADDRESS_CHANGE","DOCUMENT_GENERATED"],
  "gaming/sessions":            ["MATCH_START","MATCH_END","LOGIN","LEVEL_UP","ACHIEVEMENT"],
  "gaming/monetization":        ["IAP","STORE_VIEW","OFFER_SHOWN","BUNDLE_PURCHASED","CURRENCY_EARNED"],
  "gaming/live_ops":            ["LIVEOPS","HEALTH_CHECK","DEPLOY_OK","SCALE_OUT","CONFIG_PUSH"],
  "logistics/last_mile":        ["DELIVERY_EVENT","SCAN_PICKED","SCAN_OUT_FOR_DELIVERY","SCAN_DELIVERED","ROUTE_OPTIMIZED"],
  "logistics/warehouse":        ["WAREHOUSE_EVENT","INBOUND_RECEIVED","PUTAWAY","PICK","SHIP_CONFIRM"],
  "logistics/fleet":            ["LOCATION_UPDATE","ROUTE_STARTED","ROUTE_COMPLETED","FUEL_LEVEL","DRIVER_LOGIN"],
  "energy/smart_grid":          ["GRID_EVENT","SUBSTATION_OK","LOAD_BALANCED","SWITCH_OPERATED","TELEMETRY_SAMPLE"],
  "energy/outage":              ["RESTORED","CREW_DISPATCHED","ETA_UPDATED","CUSTOMER_NOTIFIED","STATUS_UPDATE"],
  "energy/metering":            ["METER_READ","INTERVAL_READ","CONNECT","DISCONNECT","COMMAND_ACK"],
  "automotive/telematics":      ["TRIP_START","TRIP_END","HEARTBEAT","DTC_CLEARED","GEOFENCE_ENTRY"],
  "automotive/ota_updates":     ["INSTALL_SUCCESS","DOWNLOAD_STARTED","DOWNLOAD_COMPLETED","VERIFY_OK","CAMPAIGN_TARGETED"],
  "automotive/ev_charging":     ["EV_SESSION","SESSION_STARTED","SESSION_ENDED","RFID_AUTH","RATE_APPLIED"],
  "pos/transactions":           ["SALE","ITEM_SCANNED","TENDER_APPLIED","DISCOUNT_APPLIED","RECEIPT_PRINTED"],
  "pos/terminal_health":        ["HEARTBEAT","PERIPHERAL_OK","FIRMWARE_OK","CONFIG_SYNC","NETWORK_OK"],
  "pos/kitchen":                ["KDS_EVENT","ORDER_RECEIVED","ORDER_FIRED","ORDER_BUMPED","STATION_READY"],
  "airlines/flight_ops":        ["FLIGHT_EVENT","DEPARTED","ARRIVED","TAXIING","GATE_ASSIGNED"],
  "airlines/passenger":         ["CHECK_IN","BOARDING","BAG_TAGGED","SEAT_ASSIGNED","UPGRADE"],
  "airlines/ground_ops":        ["GROUND_OPS","TURNAROUND_OK","FUEL_LOADED","CARGO_LOADED","PUSHBACK"],
  "iot/device_fleet":           ["HEARTBEAT","TELEMETRY","CONFIG_SYNC","UPDATE_CHECK","REGISTRATION"],
  "iot/sensor_telemetry":       ["SENSOR_READING","SAMPLE","CALIBRATION","BASELINE","HEARTBEAT"],
  "iot/firmware":               ["INSTALL_SUCCESS","DOWNLOAD_STARTED","VERIFY_OK","REBOOT","CAMPAIGN_TARGETED"],
  "media/video_delivery":       ["PLAYBACK_START","PLAYBACK_END","QUALITY_SWITCH","SEEK","HEARTBEAT"],
  "media/live_streaming":       ["LIVE_STREAM","SEGMENT_DELIVERED","ENCODER_OK","CDN_HIT","HEALTH_CHECK"],
  "media/ad_insertion":         ["AD_REQUEST","AD_IMPRESSION","AD_COMPLETE","AD_CLICK","BEACON"],
};

export const generateLogLine = (cfg: GeneratorConfig, ts: Date): Record<string, unknown> => {
  const level = pickLogLevel(cfg.errorRate);
  const base = baseFields(cfg, ts);
  const pack = PACKS[`${cfg.vertical}/${cfg.useCase}`];
  const categories = INFO_TYPE_VARIANTS[`${cfg.vertical}/${cfg.useCase}`] ?? ["EVENT","HEARTBEAT","SAMPLE","ACTION","CHECK"];
  let payload: Record<string, unknown>;
  if (!pack) {
    payload = { "event.type": "GENERIC_EVENT", message: "Generic business event" };
  } else if (level === "ERROR") payload = pack.err();
  else if (level === "WARN") payload = pack.warn();
  else payload = pack.ok();
  if (level === "INFO") {
    payload = { ...payload, "event.type": pick(categories) };
  }
  // business.category mirrors event.type so dashboards can filter / group by
  // a single, always-present field regardless of pack branch.
  return {
    ...base,
    "log.level": level,
    ...payload,
    "business.category": payload["event.type"],
    content: payload.message ?? "",
  };
};

export const generateBatch = (cfg: GeneratorConfig, batchSeconds = 15, now = new Date()): Record<string, unknown>[] => {
  const target = Math.max(1, Math.round((cfg.logsPerMinute / 60) * batchSeconds));
  const out: Record<string, unknown>[] = [];
  let t = now.getTime() - batchSeconds * 1000;
  for (let i = 0; i < target; i++) {
    t += intBetween(50, 500);
    if (t > now.getTime()) t = now.getTime();
    out.push(generateLogLine(cfg, new Date(t)));
  }
  return out;
};

// helper for stable seed reset between previews so users see consistent samples
export const resetSeed = (seed: number) => { _seed = seed; void seedRand(); };
