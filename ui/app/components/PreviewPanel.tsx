import React, { useMemo } from "react";
import { Flex, Grid, Surface } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph, Text, Strong } from "@dynatrace/strato-components/typography";
import { CodeSnippet } from "@dynatrace/strato-components/content";
import {
  useWizard,
  VOLUME_TO_LPM,
  ERROR_RATE_TO_PCT,
} from "../lib/wizardContext";
import { findVertical, findUseCase } from "../lib/verticals";
import { buildHostPool, generateLogLine, pickServices } from "../lib/logGenerator";

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Flex flexDirection="column" gap={4}>
    <Text>{label}</Text>
    <Strong>{value}</Strong>
  </Flex>
);

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
        <Heading level={2}>Preview</Heading>
        <Paragraph>
          Review the scenario before deploying. The workflow will run on a 1-minute schedule and ingest in batches.
        </Paragraph>
      </div>

      <Grid gridTemplateColumns="repeat(4, 1fr)" gap={20}>
        <Stat label="Logs Generated" value={`~${totalLogs.toLocaleString()}`} />
        <Stat label="Duration" value={durationLabel} />
        <Stat label="Services" value={sample.services.length} />
        <Stat label="Dashboard Tiles" value={useCase.tiles.length + 1} />
      </Grid>

      <Surface>
        <Flex flexDirection="column" gap={8} padding={16}>
          <Text>Sample log line</Text>
          <CodeSnippet language="json">
            {JSON.stringify(sample.line, null, 2)}
          </CodeSnippet>
        </Flex>
      </Surface>

      <Grid gridTemplateColumns="1fr 1fr" gap={20}>
        <Surface>
          <Flex flexDirection="column" gap={8} padding={16}>
            <Text>Services included</Text>
            <Flex gap={6} flexWrap="wrap">
              {sample.services.map((s) => (
                <Text key={s}>{s}</Text>
              ))}
            </Flex>
          </Flex>
        </Surface>

        <Surface>
          <Flex flexDirection="column" gap={8} padding={16}>
            <Text>Dashboard will include</Text>
            <Flex flexDirection="column" gap={4}>
              {useCase.tiles.slice(0, 8).map((t) => (
                <Text key={t.title}>
                  {t.title} <span>({t.kind})</span>
                </Text>
              ))}
              {useCase.tiles.length > 8 && (
                <Text>+ {useCase.tiles.length - 8} more</Text>
              )}
            </Flex>
          </Flex>
        </Surface>
      </Grid>

      <Surface color="success">
        <Flex padding={16} gap={8}>
          <Strong>Business value:</Strong>
          <Text>{useCase.businessValue}</Text>
        </Flex>
      </Surface>
    </Flex>
  );
};
