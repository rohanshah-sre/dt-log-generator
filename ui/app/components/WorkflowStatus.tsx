import React, { useState } from "react";
import { Flex, Surface } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph, Text } from "@dynatrace/strato-components/typography";
import { Button } from "@dynatrace/strato-components/buttons";
import { useWizard } from "../lib/wizardContext";
import { workflowUrl, dashboardUrl, automationWorkflowsUrl } from "../lib/dtClients";

const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="default"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
};

export const WorkflowStatus: React.FC = () => {
  const w = useWizard();
  const r = w.deployResult;

  if (!r || w.deployState !== "success") return null;

  const pending = !!r.workflowPending;
  const wfLink = r.workflowId ? workflowUrl(r.workflowId) : automationWorkflowsUrl();
  const dbLink = r.dashboardId ? dashboardUrl(r.dashboardId) : "";

  return (
    <Flex flexDirection="column" gap={20}>
      <Surface color="success">
        <Flex flexDirection="column" gap={8} padding={24}>
          <Heading level={2}>
            {pending ? "Dashboard deployed — one step left" : "Scenario deployed"}
          </Heading>
          <Paragraph>
            {pending
              ? "Your business dashboard is live with 2 hours of backfilled data. The Automation app should have opened in a new tab with your workflow pre-filled — click Save there to start the live log feed."
              : "The workflow is ingesting logs every minute and a business dashboard is ready with 2 hours of backfilled data."}
          </Paragraph>
        </Flex>
      </Surface>

      <Flex gap={16}>
        <Surface elevation="raised" style={{ flex: 1 }}>
          <Flex flexDirection="column" gap={8} padding={20}>
            <Text>Workflow</Text>
            <Text>{r.workflowTitle}</Text>
            {pending ? (
              <Paragraph>
                The workflow editor was opened with this scenario pre-filled. Review the tasks and click <strong>Save</strong> in the Automation app.
              </Paragraph>
            ) : (
              <Flex gap={8} alignItems="center">
                <Text>{r.workflowId}</Text>
                <CopyButton value={r.workflowId ?? ""} />
              </Flex>
            )}
            <Flex gap={8}>
              <Button
                as="a"
                href={wfLink}
                target="_blank"
                rel="noopener noreferrer"
                variant="emphasized"
              >
                {pending ? "Open Automation" : "Manage in Automation"}
              </Button>
            </Flex>
          </Flex>
        </Surface>

        {r.dashboardId && (
          <Surface elevation="raised" style={{ flex: 1 }}>
            <Flex flexDirection="column" gap={8} padding={20}>
              <Text>Dashboard</Text>
              <Text>{r.dashboardName}</Text>
              <Flex gap={8} alignItems="center">
                <Text>{r.dashboardId}</Text>
                <CopyButton value={r.dashboardId} />
              </Flex>
              <Flex gap={8}>
                <Button
                  as="a"
                  href={dbLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="emphasized"
                >
                  Open Dashboard
                </Button>
              </Flex>
            </Flex>
          </Surface>
        )}
      </Flex>

      <Flex justifyContent="flex-end">
        <Button variant="emphasized" onClick={() => w.reset()}>
          Generate another scenario
        </Button>
      </Flex>
    </Flex>
  );
};
