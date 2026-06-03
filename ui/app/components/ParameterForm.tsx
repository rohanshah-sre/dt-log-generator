import React from "react";
import { Flex, Grid } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph } from "@dynatrace/strato-components/typography";
import { Chip, ChipGroup } from "@dynatrace/strato-components/content";
import { FormField, Label, TextInput, FieldSet } from "@dynatrace/strato-components/forms";
import {
  useWizard,
  type LogVolume,
  type ErrorRateLevel,
  type DurationOption,
  type ServiceCount,
  VOLUME_TO_LPM,
  ERROR_RATE_TO_PCT,
} from "../lib/wizardContext";

function OptionGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
}) {
  return (
    <FieldSet>
      <FieldSet.Legend>{label}</FieldSet.Legend>
      <ChipGroup style={{ flexWrap: "wrap" }}>
        {options.map((o) => (
          <Chip
            key={String(o.key)}
            as="button"
            color={value === o.key ? "primary" : "neutral"}
            variant={value === o.key ? "accent" : "emphasized"}
            onClick={() => onChange(o.key)}
            style={{ fontSize: "1rem", padding: "8px 16px" }}
          >
            {o.label}
          </Chip>
        ))}
      </ChipGroup>
    </FieldSet>
  );
}

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
  const services: { key: ServiceCount; label: string }[] = [
    { key: 3, label: "3 services" },
    { key: 5, label: "5 services" },
    { key: 8, label: "8 services" },
  ];

  return (
    <Flex flexDirection="column" gap={24}>
      <div>
        <Heading level={2}>3. Configure parameters</Heading>
        <Paragraph>
          Tune log volume, error mix, and the demo runtime. The workflow scales batches automatically.
        </Paragraph>
      </div>

      <Grid gridTemplateColumns="1fr 1fr" gap={32}>
        <OptionGroup
          label="Log volume"
          options={volumes}
          value={w.volume}
          onChange={w.setVolume}
        />
        <OptionGroup
          label="Error rate"
          options={errorRates}
          value={w.errorRate}
          onChange={w.setErrorRate}
        />
        <OptionGroup
          label="Duration"
          options={durations}
          value={w.duration}
          onChange={w.setDuration}
        />
        <OptionGroup
          label="Services"
          options={services}
          value={w.serviceCount}
          onChange={w.setServiceCount}
        />
      </Grid>

      <Grid gridTemplateColumns="1fr 1fr" gap={32}>
        <FormField>
          <Label>Customer name (optional)</Label>
          <TextInput
            value={w.customerName}
            placeholder="e.g. Globex Insurance"
            onChange={(v) => w.setCustomerName(v)}
          />
        </FormField>
        <FormField>
          <Label>Scenario name</Label>
          <TextInput
            value={w.scenarioName}
            onChange={(v) => w.setScenarioName(v)}
          />
        </FormField>
      </Grid>
    </Flex>
  );
};
