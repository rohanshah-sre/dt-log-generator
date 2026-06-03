import React from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph } from "@dynatrace/strato-components/typography";
import { Chip } from "@dynatrace/strato-components/content";
import { VERTICALS } from "../lib/verticals";
import { useWizard } from "../lib/wizardContext";

export const VerticalSelector: React.FC = () => {
  const { vertical, setVertical } = useWizard();

  return (
    <Flex flexDirection="column" gap={24}>
      <div>
        <Heading level={2}>1. Pick an industry vertical</Heading>
        <Paragraph>
          Each vertical defines a realistic log schema, service mesh, and dashboard story. Pick the one your audience cares about.
        </Paragraph>
      </div>
      <Flex flexWrap="wrap" gap={8}>
        {VERTICALS.map((v) => (
          <Chip
            key={v.key}
            as="button"
            color={vertical === v.key ? "primary" : "neutral"}
            variant={vertical === v.key ? "accent" : "emphasized"}
            onClick={() => setVertical(v.key)}
            style={{ fontSize: "1rem", padding: "8px 16px" }}
          >
            {v.icon} {v.name}
          </Chip>
        ))}
      </Flex>
    </Flex>
  );
};
