import React from "react";
import { sendIntent } from "@dynatrace-sdk/navigation";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Button } from "@dynatrace/strato-components/buttons";
import { showToast } from "@dynatrace/strato-components/notifications";
import { useWizard, VOLUME_TO_LPM, ERROR_RATE_TO_PCT } from "../lib/wizardContext";
import { findVertical, findUseCase } from "../lib/verticals";
import { buildWorkflowDescriptor } from "../lib/workflowBuilder";
import { buildDashboard } from "../lib/dashboardBuilder";
import { buildHostPool, pickServices } from "../lib/logGenerator";
import { documentsClient } from "../lib/dtClients";

export const DeployButton: React.FC<{ onBeforeDeploy?: () => void }> = ({ onBeforeDeploy }) => {
  const w = useWizard();

  const handleDeploy = async () => {
    onBeforeDeploy?.();
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

      showToast({
        type: "success",
        title: "Dashboard deployed",
        message: "Open the Automation tab that just opened and click Save to start the live log feed.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      w.setDeployResult({ error: msg });
      w.setDeployState("error");
      showToast({
        type: "critical",
        title: "Deploy failed",
        message: msg,
      });
    }
  };

  const disabled =
    !w.vertical || !w.useCase || !w.scenarioName.trim() || w.deployState === "deploying" || w.deployState === "success";

  let label: string;
  if (w.deployState === "deploying") {
    label = "Deploying…";
  } else if (w.deployState === "success") {
    label = "Deployed";
  } else if (w.deployState === "error") {
    label = "Retry deploy";
  } else {
    label = "Deploy scenario";
  }

  return (
    <Flex flexDirection="column" gap={8} alignItems="flex-end">
      <Button
        variant="emphasized"
        color={w.deployState === "error" ? "critical" : undefined}
        onClick={() => void handleDeploy()}
        disabled={disabled}
        loading={w.deployState === "deploying"}
      >
        {label}
      </Button>
    </Flex>
  );
};
