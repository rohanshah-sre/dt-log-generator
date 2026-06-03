import React from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph } from "@dynatrace/strato-components/typography";
import { Chip, ChipGroup } from "@dynatrace/strato-components/content";
import { findVertical } from "../lib/verticals";
import { useWizard } from "../lib/wizardContext";

export const UseCaseSelector: React.FC = () => {
  const { vertical, useCase, setUseCase, setScenarioName, scenarioName } = useWizard();
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
        <Heading level={2}>2. Pick a use case</Heading>
        <Paragraph>
          Each use case generates a different log schema and a tailored business dashboard.
        </Paragraph>
      </div>

      <ChipGroup style={{ flexWrap: "wrap" }}>
        {v.useCases.map((u) => (
          <Chip
            key={u.key}
            as="button"
            color={useCase === u.key ? "primary" : "neutral"}
            variant={useCase === u.key ? "accent" : "emphasized"}
            onClick={() => onPick(u.key)}
            style={{ fontSize: "1rem", padding: "8px 16px" }}
          >
            {u.name}
          </Chip>
        ))}
      </ChipGroup>
    </Flex>
  );
};
