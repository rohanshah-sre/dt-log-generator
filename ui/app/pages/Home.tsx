import React from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph, Text } from "@dynatrace/strato-components/typography";
import { Button } from "@dynatrace/strato-components/buttons";

import { COLORS } from "../styles/theme";
import { useWizard } from "../lib/wizardContext";
import { StepIndicator } from "../components/StepIndicator";
import { VerticalSelector } from "../components/VerticalSelector";
import { UseCaseSelector } from "../components/UseCaseSelector";
import { ParameterForm } from "../components/ParameterForm";
import { PreviewPanel } from "../components/PreviewPanel";
import { DeployButton } from "../components/DeployButton";
import { WorkflowStatus } from "../components/WorkflowStatus";

const Section: React.FC<{ children: React.ReactNode; keyId: string | number }> = ({ children, keyId }) => (
  <div
    key={keyId}
    style={{
      animation: "logSlideIn 320ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    }}
  >
    {children}
  </div>
);

export const Home: React.FC = () => {
  const w = useWizard();

  const showWizardBody = w.deployState !== "success";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        backgroundImage: `radial-gradient(circle at 15% -10%, ${COLORS.purple}25, transparent 40%), radial-gradient(circle at 110% 20%, ${COLORS.blue}25, transparent 45%)`,
        color: COLORS.title,
      }}
    >
      <style>{`
        @keyframes logSlideIn {
          from { transform: translateX(24px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px 64px" }}>
        <Flex justifyContent="space-between" alignItems="flex-start" gap={16}>
          <div>
            <Heading level={1} style={{ color: COLORS.title, fontSize: 30, marginBottom: 4 }}>
              🚀 LaunchLog
            </Heading>
            <Paragraph style={{ color: COLORS.label, maxWidth: 720 }}>
              Pick an industry and use case, and we&apos;ll spin up a Dynatrace workflow that
              generates realistic, vertical-specific logs — plus a business dashboard that turns
              them into outcomes a CIO would care about.
            </Paragraph>
          </div>
          <Flex gap={8}>
            {(w.step !== 1 || w.vertical || w.deployState !== "idle") && (
              <Button
                onClick={() => w.reset()}
                style={{
                  background: "transparent",
                  border: `1px solid ${COLORS.cardBorder}`,
                  color: COLORS.label,
                }}
              >
                Reset
              </Button>
            )}
          </Flex>
        </Flex>

        <StepIndicator current={w.step} />

        {showWizardBody && (
          <div
            style={{
              background: COLORS.cardBg,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              padding: 28,
              marginTop: 16,
              boxShadow: `0 0 32px ${COLORS.blue}15`,
              overflow: "hidden",
            }}
          >
            {w.step === 1 && (
              <Section keyId="step-1">
                <VerticalSelector />
              </Section>
            )}
            {w.step === 2 && (
              <Section keyId="step-2">
                <UseCaseSelector />
              </Section>
            )}
            {w.step === 3 && (
              <Section keyId="step-3">
                <ParameterForm />
              </Section>
            )}
            {w.step === 4 && (
              <Section keyId="step-4">
                <Flex flexDirection="column" gap={24}>
                  <PreviewPanel />
                  <Flex justifyContent="space-between" alignItems="center" gap={16}>
                    <Button onClick={() => w.setStep(3)}>← Back</Button>
                    <DeployButton />
                  </Flex>
                  {w.deployState === "error" && w.deployResult?.error && (
                    <div
                      style={{
                        background: `${COLORS.pink}15`,
                        border: `1px solid ${COLORS.pink}80`,
                        borderRadius: 10,
                        padding: 14,
                      }}
                    >
                      <Text style={{ color: COLORS.pink, fontWeight: 600 }}>Deploy failed:</Text>{" "}
                      <Text style={{ color: COLORS.title }}>{w.deployResult.error}</Text>
                    </div>
                  )}
                </Flex>
              </Section>
            )}
          </div>
        )}

        {w.deployState === "success" && (
          <div
            style={{
              background: COLORS.cardBg,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              padding: 28,
              marginTop: 16,
            }}
          >
            <WorkflowStatus />
          </div>
        )}
      </div>
    </div>
  );
};
