import React, { useMemo } from "react";
import { Flex, Grid } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph, Text } from "@dynatrace/strato-components/typography";
import { COLORS, FONTS } from "../styles/theme";
import {
  useWizard,
  VOLUME_TO_LPM,
  ERROR_RATE_TO_PCT,
} from "../lib/wizardContext";
import { findVertical, findUseCase } from "../lib/verticals";
import { buildHostPool, generateLogLine, pickServices } from "../lib/logGenerator";

const Stat: React.FC<{ label: string; value: React.ReactNode; color?: string }> = ({ label, value, color }) => (
  <Flex flexDirection="column" gap={4}>
    <Text style={{ color: COLORS.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>{label}</Text>
    <div style={{ color: color ?? COLORS.title, fontSize: 28, fontWeight: 700 }}>{value}</div>
  </Flex>
);

/** Highlight a JSON object: keys purple-bright, strings blue-light, numbers green-bright. */
const renderJsonLine = (obj: Record<string, unknown>): React.ReactNode => {
  const lines: React.ReactNode[] = [];
  const entries = Object.entries(obj);
  lines.push(<span key="open" style={{ color: COLORS.label }}>{"{"}</span>);
  entries.forEach(([k, v], i) => {
    let valueNode: React.ReactNode;
    if (typeof v === "string") {
      valueNode = <span style={{ color: COLORS.blueLight }}>&quot;{v}&quot;</span>;
    } else if (typeof v === "number") {
      valueNode = <span style={{ color: COLORS.greenBright }}>{String(v)}</span>;
    } else if (typeof v === "boolean") {
      valueNode = <span style={{ color: COLORS.greenBright }}>{String(v)}</span>;
    } else if (v === null || v === undefined) {
      valueNode = <span style={{ color: COLORS.muted }}>null</span>;
    } else {
      valueNode = <span style={{ color: COLORS.blueLight }}>{JSON.stringify(v)}</span>;
    }
    lines.push(
      <div key={k} style={{ paddingLeft: 16 }}>
        <span style={{ color: COLORS.purpleBright }}>&quot;{k}&quot;</span>
        <span style={{ color: COLORS.label }}>: </span>
        {valueNode}
        {i < entries.length - 1 ? <span style={{ color: COLORS.label }}>,</span> : null}
      </div>,
    );
  });
  lines.push(<span key="close" style={{ color: COLORS.label }}>{"}"}</span>);
  return <>{lines}</>;
};

export const PreviewPanel: React.FC = () => {
  const w = useWizard();
  const vertical = findVertical(w.vertical);
  const useCase = findUseCase(vertical, w.useCase);

  const sample = useMemo(() => {
    if (!vertical || !useCase) return null;
    const services = pickServices(useCase.services, w.serviceCount);
    const hosts = buildHostPool(Math.min(8, Math.max(3, w.serviceCount)));
    const cfg = {
      vertical: vertical.key,
      useCase: useCase.key,
      scenarioName: w.scenarioName,
      customerName: w.customerName,
      logsPerMinute: VOLUME_TO_LPM[w.volume],
      errorRate: ERROR_RATE_TO_PCT[w.errorRate],
      services,
      hosts,
      serviceCount: w.serviceCount,
    };
    return { cfg, line: generateLogLine(cfg, new Date()), services };
  }, [vertical, useCase, w.serviceCount, w.volume, w.errorRate, w.scenarioName, w.customerName]);

  if (!vertical || !useCase || !sample) return null;

  const totalLogs = Math.round((VOLUME_TO_LPM[w.volume] * w.duration));
  const durationLabel =
    w.duration < 60
      ? `${w.duration} min`
      : w.duration < 1440
      ? `${w.duration / 60}h`
      : "24h";

  return (
    <Flex flexDirection="column" gap={20}>
      <div>
        <Heading level={3} style={{ color: COLORS.title }}>Preview</Heading>
        <Paragraph style={{ color: COLORS.muted }}>
          Review the scenario before deploying. The workflow will run on a 1-minute schedule and ingest in batches.
        </Paragraph>
      </div>

      <Grid gridTemplateColumns="repeat(4, 1fr)" gap={20}>
        <Stat label="Logs Generated" value={`~${totalLogs.toLocaleString()}`} color={COLORS.greenBright} />
        <Stat label="Duration" value={durationLabel} color={COLORS.blueLight} />
        <Stat label="Services" value={sample.services.length} color={COLORS.purpleBright} />
        <Stat label="Dashboard Tiles" value={useCase.tiles.length + 1} color={COLORS.greenBright} />
      </Grid>

      <div
        style={{
          background: "rgba(13,13,26,0.6)",
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 12,
          padding: 20,
        }}
      >
        <Text style={{ color: COLORS.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
          Sample log line
        </Text>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 12.5,
            lineHeight: 1.7,
            marginTop: 10,
            color: COLORS.title,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {renderJsonLine(sample.line as Record<string, unknown>)}
        </div>
      </div>

      <Grid gridTemplateColumns="1fr 1fr" gap={20}>
        <div
          style={{
            background: COLORS.cardBg,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <Text style={{ color: COLORS.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
            Services included
          </Text>
          <Flex gap={6} flexWrap="wrap" paddingTop={8}>
            {sample.services.map((s) => (
              <span
                key={s}
                style={{
                  background: `${COLORS.blue}30`,
                  color: COLORS.blueLight,
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontFamily: FONTS.mono,
                }}
              >
                {s}
              </span>
            ))}
          </Flex>
        </div>

        <div
          style={{
            background: COLORS.cardBg,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <Text style={{ color: COLORS.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
            Dashboard will include
          </Text>
          <Flex flexDirection="column" gap={4} paddingTop={8}>
            {useCase.tiles.slice(0, 8).map((t) => (
              <Text key={t.title} style={{ color: COLORS.label, fontSize: 13 }}>
                • {t.title} <span style={{ color: COLORS.muted }}>({t.kind})</span>
              </Text>
            ))}
            {useCase.tiles.length > 8 && (
              <Text style={{ color: COLORS.muted, fontSize: 12 }}>+ {useCase.tiles.length - 8} more…</Text>
            )}
          </Flex>
        </div>
      </Grid>

      <div
        style={{
          background: `${COLORS.green}15`,
          border: `1px solid ${COLORS.green}55`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <Text style={{ color: COLORS.greenBright, fontWeight: 600 }}>Business value:</Text>{" "}
        <Text style={{ color: COLORS.title }}>{useCase.businessValue}</Text>
      </div>
    </Flex>
  );
};
