import React from "react";
import { Flex, Grid } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph, Text } from "@dynatrace/strato-components/typography";
import { Button } from "@dynatrace/strato-components/buttons";
import { COLORS } from "../styles/theme";
import {
  useWizard,
  type LogVolume,
  type ErrorRateLevel,
  type DurationOption,
  type ServiceCount,
  VOLUME_TO_LPM,
  ERROR_RATE_TO_PCT,
} from "../lib/wizardContext";

const Pill: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      cursor: "pointer",
      padding: "10px 16px",
      borderRadius: 999,
      border: `1px solid ${active ? COLORS.green : COLORS.cardBorder}`,
      background: active ? `${COLORS.green}20` : "transparent",
      color: active ? COLORS.title : COLORS.label,
      fontWeight: active ? 600 : 400,
      transition: "all 150ms ease",
    }}
  >
    {children}
  </button>
);

const Group: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Flex flexDirection="column" gap={8}>
    <Text style={{ color: COLORS.label, fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>{label}</Text>
    <Flex gap={8} flexWrap="wrap">
      {children}
    </Flex>
  </Flex>
);

export const ParameterForm: React.FC = () => {
  const w = useWizard();

  const volumes: { key: LogVolume; label: string }[] = [
    { key: "light", label: `Light (~${VOLUME_TO_LPM.light}/min)` },
    { key: "medium", label: `Medium (~${VOLUME_TO_LPM.medium}/min)` },
    { key: "heavy", label: `Heavy (~${VOLUME_TO_LPM.heavy}/min)` },
  ];
  const errorRates: { key: ErrorRateLevel; label: string }[] = [
    { key: "low", label: `Low (${(ERROR_RATE_TO_PCT.low * 100).toFixed(0)}%)` },
    { key: "medium", label: `Medium (${(ERROR_RATE_TO_PCT.medium * 100).toFixed(0)}%)` },
    { key: "high", label: `High (${(ERROR_RATE_TO_PCT.high * 100).toFixed(0)}%)` },
  ];
  const durations: { key: DurationOption; label: string }[] = [
    { key: 30, label: "30 min" },
    { key: 60, label: "1 hour" },
    { key: 240, label: "4 hours" },
    { key: 480, label: "8 hours" },
    { key: 1440, label: "24 hours" },
  ];
  const services: ServiceCount[] = [3, 5, 8];

  const inputStyle: React.CSSProperties = {
    background: "transparent",
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: 8,
    padding: "10px 14px",
    color: COLORS.title,
    fontSize: 14,
    width: "100%",
    outline: "none",
  };

  return (
    <Flex flexDirection="column" gap={24}>
      <div>
        <Heading level={2} style={{ color: COLORS.title }}>
          3. Configure parameters
        </Heading>
        <Paragraph style={{ color: COLORS.muted }}>
          Tune log volume, error mix, and the demo runtime. The workflow scales batches automatically.
        </Paragraph>
      </div>

      <Grid gridTemplateColumns="1fr 1fr" gap={32}>
        <Group label="Log volume">
          {volumes.map((v) => (
            <Pill key={v.key} active={w.volume === v.key} onClick={() => w.setVolume(v.key)}>
              {v.label}
            </Pill>
          ))}
        </Group>
        <Group label="Error rate">
          {errorRates.map((e) => (
            <Pill key={e.key} active={w.errorRate === e.key} onClick={() => w.setErrorRate(e.key)}>
              {e.label}
            </Pill>
          ))}
        </Group>
        <Group label="Duration">
          {durations.map((d) => (
            <Pill key={d.key} active={w.duration === d.key} onClick={() => w.setDuration(d.key)}>
              {d.label}
            </Pill>
          ))}
        </Group>
        <Group label="Services">
          {services.map((s) => (
            <Pill key={s} active={w.serviceCount === s} onClick={() => w.setServiceCount(s)}>
              {s} services
            </Pill>
          ))}
        </Group>
      </Grid>

      <Grid gridTemplateColumns="1fr 1fr" gap={32}>
        <Flex flexDirection="column" gap={6}>
          <Text style={{ color: COLORS.label, fontSize: 13 }}>Customer name (optional)</Text>
          <input
            style={inputStyle}
            type="text"
            value={w.customerName}
            placeholder="e.g. Globex Insurance"
            onChange={(e) => w.setCustomerName(e.target.value)}
          />
        </Flex>
        <Flex flexDirection="column" gap={6}>
          <Text style={{ color: COLORS.label, fontSize: 13 }}>Scenario name</Text>
          <input
            style={inputStyle}
            type="text"
            value={w.scenarioName}
            onChange={(e) => w.setScenarioName(e.target.value)}
          />
        </Flex>
      </Grid>

      <Flex justifyContent="space-between" gap={12}>
        <Button onClick={() => w.setStep(2)}>← Back</Button>
        <Button
          variant="emphasized"
          disabled={!w.scenarioName.trim()}
          onClick={() => w.setStep(4)}
          style={{ background: COLORS.green, color: COLORS.bg, fontWeight: 700 }}
        >
          Next: preview & deploy →
        </Button>
      </Flex>
    </Flex>
  );
};
