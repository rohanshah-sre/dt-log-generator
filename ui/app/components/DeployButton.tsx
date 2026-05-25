import React from "react";
import { sendIntent } from "@dynatrace-sdk/navigation";
import { COLORS } from "../styles/theme";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Text } from "@dynatrace/strato-components/typography";
import { useWizard, VOLUME_TO_LPM, ERROR_RATE_TO_PCT } from "../lib/wizardContext";
import { findVertical, findUseCase } from "../lib/verticals";
import { buildWorkflowDescriptor } from "../lib/workflowBuilder";
import { buildDashboard } from "../lib/dashboardBuilder";
import { buildHostPool, pickServices } from "../lib/logGenerator";
import { documentsClient } from "../lib/dtClients";

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

      const documentName = `[LaunchLog] ${cfg.scenarioName}`;
      const dashDoc = buildDashboard({
        scenarioName: cfg.scenarioName,
        vertical: cfg.vertical,
        useCase: cfg.useCase,
        customerName: cfg.customerName,
        documentName,
      });
      const docResp = await documentsClient.createDocument({
        body: {
          name: dashDoc.name,
          type: dashDoc.type,
          content: new Blob([dashDoc.content], { type: "application/json" }),
        },
      });
      const docId = docResp.id;

      const wfDescriptor = buildWorkflowDescriptor(cfg, docId);

      // Dispatch a "create workflow" intent to the Automation app. This works
      // for third-party apps (no `automation:workflows:write` scope required)
      // because the workflow is ultimately created by the user inside the
      // Automation app, under their own tenant permissions. The intent payload
      // pre-fills the workflow editor with our title, tasks, and trigger.
      // See: https://developer.dynatrace.com/develop/guides/workflows/use-intents/
      sendIntent({
        title: wfDescriptor.title,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tasks: (wfDescriptor as any).tasks,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        trigger: (wfDescriptor as any).trigger,
      });

      w.setDeployResult({
        workflowPending: true,
        workflowTitle: wfDescriptor.title,
        dashboardId: docId,
        dashboardName: documentName,
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
