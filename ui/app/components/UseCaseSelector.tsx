import React from "react";
import { Flex, Grid } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph, Text } from "@dynatrace/strato-components/typography";
import { Button } from "@dynatrace/strato-components/buttons";
import { findVertical } from "../lib/verticals";
import { COLORS } from "../styles/theme";
import { useWizard } from "../lib/wizardContext";

export const UseCaseSelector: React.FC = () => {
  const { vertical, useCase, setUseCase, setStep, setScenarioName, scenarioName } = useWizard();
  const v = findVertical(vertical);

  if (!v) return null;

  const onPick = (key: string) => {
    setUseCase(key);
    if (!scenarioName) {
      const uc = v.useCases.find((u) => u.key === key);
      if (uc) setScenarioName(`${v.name} — ${uc.name}`);
    }
  };

  return (
    <Flex flexDirection="column" gap={24}>
      <div>
        <Heading level={2} style={{ color: COLORS.title }}>
          2. Pick a use case
        </Heading>
        <Paragraph style={{ color: COLORS.muted }}>
          Each use case generates a different log schema and a tailored business dashboard.
        </Paragraph>
      </div>

      <Grid gridTemplateColumns="repeat(3, 1fr)" gap={20}>
        {v.useCases.map((u) => {
          const selected = useCase === u.key;
          return (
            <button
              key={u.key}
              onClick={() => onPick(u.key)}
              style={{
                cursor: "pointer",
                background: COLORS.cardBg,
                border: `1px solid ${selected ? COLORS.green : COLORS.cardBorder}`,
                borderRadius: 12,
                padding: 24,
                textAlign: "left",
                color: COLORS.title,
                transition: "all 180ms ease",
                boxShadow: selected ? `0 0 22px ${COLORS.green}55` : "none",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{u.name}</div>
              <Text style={{ color: COLORS.label, fontSize: 13, display: "block", marginBottom: 12 }}>
                {u.description}
              </Text>
              <div style={{ borderTop: `1px solid ${COLORS.cardBorder}`, paddingTop: 10 }}>
                <Text style={{ color: COLORS.blueLight, fontSize: 12 }}>
                  Services: {u.services.length}
                </Text>
                <Text style={{ color: COLORS.greenBright, fontSize: 12, marginLeft: 12 }}>
                  Tiles: {u.tiles.length}
                </Text>
              </div>
            </button>
          );
        })}
      </Grid>

      <Flex justifyContent="space-between" gap={12}>
        <Button onClick={() => setStep(1)}>← Back</Button>
        <Button
          variant="emphasized"
          disabled={!useCase}
          onClick={() => setStep(3)}
          style={{ background: COLORS.green, color: COLORS.bg, fontWeight: 700 }}
        >
          Next: parameters →
        </Button>
      </Flex>
    </Flex>
  );
};
