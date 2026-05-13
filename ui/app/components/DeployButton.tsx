import React from "react";
import { COLORS } from "../styles/theme";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Text } from "@dynatrace/strato-components/typography";
import { useWizard, VOLUME_TO_LPM, ERROR_RATE_TO_PCT } from "../lib/wizardContext";
import { findVertical, findUseCase } from "../lib/verticals";
import { buildWorkflowDescriptor } from "../lib/workflowBuilder";
import { buildHostPool, pickServices } from "../lib/logGenerator";
import { workflowsClient } from "../lib/dtClients";

const Spinner = () => (
  <span
    style={{
      display: "inline-block",
      width: 14,
      height: 14,
      border: `2px solid ${COLORS.bg}`,
      borderTopColor: "transparent",
      borderRadius: "50%",
      animation: "logspin 0.7s linear infinite",
      marginRight: 8,
      verticalAlign: "middle",
    }}
  />
);

export const DeployButton: React.FC = () => {
  const w = useWizard();

  const handleDeploy = async () => {
    const vertical = findVertical(w.vertical);
    const useCase = findUseCase(vertical, w.useCase);
    if (!vertical || !useCase) return;

    w.setDeployState("deploying");
    w.setDeployResult(null);

    try {
      const services = pickServices(useCase.services, w.serviceCount);
      const hosts = buildHostPool(Math.max(3, Math.min(8, w.serviceCount)));
      const cfg = {
        vertical: vertical.key,
        useCase: useCase.key,
        scenarioName: w.scenarioName.trim(),
        customerName: w.customerName.trim() || undefined,
        logsPerMinute: VOLUME_TO_LPM[w.volume],
        errorRate: ERROR_RATE_TO_PCT[w.errorRate],
        services,
        hosts,
        serviceCount: w.serviceCount,
      };

      const wfDescriptor = buildWorkflowDescriptor(cfg);
      const wfResp = await workflowsClient.createWorkflow({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: wfDescriptor as any,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wfId = (wfResp as any)?.id ?? "unknown";

      w.setDeployResult({
        workflowId: wfId,
        workflowTitle: wfDescriptor.title,
      });
      w.setDeployState("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      w.setDeployResult({ error: msg });
      w.setDeployState("error");
    }
  };

  const disabled =
    !w.vertical || !w.useCase || !w.scenarioName.trim() || w.deployState === "deploying" || w.deployState === "success";

  let bg: string = COLORS.green;
  let label: React.ReactNode = "Deploy scenario";
  if (w.deployState === "deploying") {
    bg = COLORS.green;
    label = (<><Spinner />Deploying…</>);
  } else if (w.deployState === "success") {
    bg = COLORS.green;
    label = "✓ Deployed";
  } else if (w.deployState === "error") {
    bg = COLORS.pink;
    label = "Retry deploy";
  }

  return (
    <Flex flexDirection="column" gap={8} alignItems="flex-end">
      <style>{`@keyframes logspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <button
        onClick={handleDeploy}
        disabled={disabled}
        style={{
          background: bg,
          color: COLORS.bg,
          fontWeight: 800,
          padding: "12px 24px",
          borderRadius: 10,
          border: "none",
          fontSize: 15,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled && w.deployState !== "deploying" ? 0.5 : 1,
          boxShadow: w.deployState === "success" ? `0 0 18px ${COLORS.green}80` : "none",
          transition: "all 200ms ease",
          minWidth: 200,
        }}
      >
        {label}
      </button>
      {w.deployState === "error" && w.deployResult?.error && (
        <Text style={{ color: COLORS.pink, fontSize: 12, maxWidth: 360, textAlign: "right" }}>
          {w.deployResult.error}
        </Text>
      )}
    </Flex>
  );
};
