import React from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Text } from "@dynatrace/strato-components/typography";
import Colors from "@dynatrace/strato-design-tokens/colors";

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
      const bg = active
        ? Colors.Background.Container.Primary.Accent
        : done
        ? Colors.Background.Container.Success.Accent
        : Colors.Background.Field.Neutral.Emphasized;
      return (
        <Flex key={s.n} alignItems="center" gap={8}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: bg,
              color: Colors.Text.Neutral.OnAccent.Default,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              transition: "all 200ms ease",
            }}
          >
            {s.n}
          </div>
          <Text style={{ fontWeight: active ? 600 : 400 }}>{s.label}</Text>
          {i < STEPS.length - 1 && (
            <div
              style={{
                width: 32,
                height: 2,
                background: done
                  ? Colors.Background.Container.Success.Accent
                  : Colors.Background.Field.Neutral.Emphasized,
              }}
            />
          )}
        </Flex>
      );
    })}
  </Flex>
);
