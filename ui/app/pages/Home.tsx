import React, { useRef, useEffect } from "react";
import { Flex, Surface } from "@dynatrace/strato-components/layouts";
import { Button } from "@dynatrace/strato-components/buttons";

import { useWizard } from "../lib/wizardContext";
import { VerticalSelector } from "../components/VerticalSelector";
import { UseCaseSelector } from "../components/UseCaseSelector";
import { ParameterForm } from "../components/ParameterForm";
import { PreviewPanel } from "../components/PreviewPanel";
import { DeployButton } from "../components/DeployButton";
import { WorkflowStatus } from "../components/WorkflowStatus";

const Section: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ animation: "logSlideIn 320ms cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
    {children}
  </div>
);

export const Home: React.FC = () => {
  const w = useWizard();

  const parametersReady = w.useCase !== null && w.scenarioName.trim() !== "";

  const useCaseRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (w.vertical) useCaseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [w.vertical]);

  useEffect(() => {
    if (w.useCase) paramsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [w.useCase]);

  const scrollToPreview = () => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div style={{ width: "80%", margin: "0 auto", padding: "32px 0 64px" }}>
      <style>{`
        @keyframes logSlideIn {
          from { transform: translateX(24px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      <Flex justifyContent="flex-end" gap={8} paddingBottom={16}>
        {(w.vertical || w.deployState !== "idle") && (
          <Button variant="default" onClick={() => w.reset()}>
            Reset
          </Button>
        )}
      </Flex>

      {/* Section A — Vertical selector: always visible */}
      <Surface elevation="raised">
        <Flex flexDirection="column" padding={24}>
          <VerticalSelector />
        </Flex>
      </Surface>

      {/* Section B — Use case: appears when a vertical is selected */}
      {w.vertical && (
        <div ref={useCaseRef} style={{ marginTop: 24 }}>
          <Section>
            <Surface elevation="raised">
              <Flex flexDirection="column" padding={24}>
                <UseCaseSelector />
              </Flex>
            </Surface>
          </Section>
        </div>
      )}

      {/* Section C — Parameters: appears when a use case is selected */}
      {w.useCase && (
        <div ref={paramsRef} style={{ marginTop: 24 }}>
          <Section>
            <Surface elevation="raised">
              <Flex flexDirection="column" padding={24}>
                <ParameterForm />
              </Flex>
            </Surface>
          </Section>
        </div>
      )}

      {/* Section D — Preview & deploy: appears when required parameters are filled */}
      {parametersReady && w.deployState !== "success" && (
        <div ref={previewRef} style={{ marginTop: 24 }}>
          <Section>
            <Surface elevation="raised">
              <Flex flexDirection="column" gap={24} padding={24}>
                <PreviewPanel />
                <Flex justifyContent="flex-end">
                  <DeployButton onBeforeDeploy={scrollToPreview} />
                </Flex>
              </Flex>
            </Surface>
          </Section>
        </div>
      )}

      {w.deployState === "success" && (
        <div style={{ marginTop: 24 }}>
          <Surface elevation="raised">
            <Flex padding={24}>
              <WorkflowStatus />
            </Flex>
          </Surface>
        </div>
      )}
    </div>
  );
};
