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

/** Deep-link to the Automation app's workflows list. */
export const automationWorkflowsUrl = (): string => {
  const base = getEnvironmentUrl().replace(/\/$/, "");
  return `${base}/ui/apps/dynatrace.automations/workflows`;
};

/** Deep-link to a dashboard document page. */
export const dashboardUrl = (documentId: string): string => {
  const base = getEnvironmentUrl().replace(/\/$/, "");
  return `${base}/ui/apps/dynatrace.dashboards/dashboard/${documentId}`;
};
