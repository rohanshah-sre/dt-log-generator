import React from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Text } from "@dynatrace/strato-components/typography";
import { COLORS } from "../styles/theme";

interface Props { current: 1 | 2 | 3 | 4; }

const STEPS: { n: 1 | 2 | 3 | 4; label: string }[] = [
  { n: 1, label: "Vertical" },
  { n: 2, label: "Use Case" },
  { n: 3, label: "Parameters" },
  { n: 4, label: "Preview & Deploy" },
];

export const StepIndicator: React.FC<Props> = ({ current }) => (
  <Flex gap={16} alignItems="center" paddingTop={16} paddingBottom={16}>
    {STEPS.map((s, i) => {
      const active = s.n === current;
      const done = s.n < current;
      const dotBg = active ? COLORS.green : done ? COLORS.greenBright : COLORS.cardBorder;
      const labelColor = active ? COLORS.title : done ? COLORS.label : COLORS.muted;
      return (
        <Flex key={s.n} alignItems="center" gap={8}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: dotBg,
              color: COLORS.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              boxShadow: active ? `0 0 12px ${COLORS.green}80` : "none",
              transition: "all 200ms ease",
            }}
          >
            {s.n}
          </div>
          <Text style={{ color: labelColor, fontWeight: active ? 600 : 400 }}>{s.label}</Text>
          {i < STEPS.length - 1 && (
            <div style={{ width: 32, height: 2, background: done ? COLORS.greenBright : COLORS.cardBorder }} />
          )}
        </Flex>
      );
    })}
  </Flex>
);
