// OpenTelemetry SDK initialisation — loaded via --require before dt-app starts.
// Transport config (endpoint, headers, protocol) is read from OTEL_* env vars
// in .env.otel.  Never hardcode secrets or endpoints here.
'use strict';

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('SIGTERM', () => sdk.shutdown());
process.on('SIGINT', () => sdk.shutdown());
