import { workflowsClient } from "@dynatrace-sdk/client-automation";
import { logsClient } from "@dynatrace-sdk/client-classic-environment-v2";
import { documentsClient } from "@dynatrace-sdk/client-document";
import { getEnvironmentUrl } from "@dynatrace-sdk/app-environment";

export { workflowsClient, logsClient, documentsClient };

/** Deep-link to a workflow detail page. */
export const workflowUrl = (workflowId: string): string => {
  const base = getEnvironmentUrl().replace(/\/$/, "");
  return `${base}/ui/apps/dynatrace.automations/workflows/${workflowId}`;
};

/** Deep-link to a dashboard document page. */
export const dashboardUrl = (documentId: string): string => {
  const base = getEnvironmentUrl().replace(/\/$/, "");
  return `${base}/ui/apps/dynatrace.dashboards/dashboard/${documentId}`;
};

/** Pause a LaunchLog workflow by setting its schedule.isActive to false. */
export async function pauseWorkflow(workflowId: string): Promise<void> {
  await workflowsClient.updateWorkflow({
    id: workflowId,
    body: {
      trigger: {
        schedule: {
          isActive: false,
          trigger: { type: "cron", cron: "*/1 * * * *" },
          timezone: "UTC",
        },
      },
    },
  });
}

/** Resume a paused LaunchLog workflow. */
export async function resumeWorkflow(workflowId: string): Promise<void> {
  await workflowsClient.updateWorkflow({
    id: workflowId,
    body: {
      trigger: {
        schedule: {
          isActive: true,
          trigger: { type: "cron", cron: "*/1 * * * *" },
          timezone: "UTC",
        },
      },
    },
  });
}

/** Delete a workflow by id. */
export async function deleteWorkflow(workflowId: string): Promise<void> {
  await workflowsClient.deleteWorkflow({ id: workflowId });
}
