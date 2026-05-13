import React from "react";
import { Flex, Grid } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph, Text } from "@dynatrace/strato-components/typography";
import { Button } from "@dynatrace/strato-components/buttons";
import { VERTICALS } from "../lib/verticals";
import { COLORS } from "../styles/theme";
import { useWizard } from "../lib/wizardContext";

export const VerticalSelector: React.FC = () => {
  const { vertical, setVertical, setStep } = useWizard();

  return (
    <Flex flexDirection="column" gap={24}>
      <div>
        <Heading level={2} style={{ color: COLORS.title }}>
          1. Pick an industry vertical
        </Heading>
        <Paragraph style={{ color: COLORS.muted }}>
          Each vertical defines a realistic log schema, service mesh, and dashboard story. Pick the one your audience cares about.
        </Paragraph>
      </div>
      <Grid gridTemplateColumns="repeat(3, 1fr)" gap={20}>
        {VERTICALS.map((v) => {
          const selected = vertical === v.key;
          return (
            <button
              key={v.key}
              onClick={() => setVertical(v.key)}
              onDoubleClick={() => { setVertical(v.key); setStep(2); }}
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
                position: "relative",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                if (!selected) e.currentTarget.style.boxShadow = `0 0 14px ${COLORS.blue}40`;
              }}
              onMouseLeave={(e) => {
                if (!selected) e.currentTarget.style.boxShadow = "none";
              }}
            >
              {selected && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: COLORS.green,
                    color: COLORS.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  ✓
                </div>
              )}
              <div style={{ fontSize: 32, marginBottom: 12 }}>{v.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{v.name}</div>
              <Text style={{ color: COLORS.label, fontSize: 13 }}>{v.description}</Text>
            </button>
          );
        })}
      </Grid>
      <Flex justifyContent="flex-end" gap={12}>
        <Button
          variant="emphasized"
          disabled={!vertical}
          onClick={() => setStep(2)}
          style={{ background: COLORS.green, color: COLORS.bg, fontWeight: 700 }}
        >
          Next: choose use case →
        </Button>
      </Flex>
    </Flex>
  );
};
