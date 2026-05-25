import React, { useState } from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph, Text } from "@dynatrace/strato-components/typography";
import { Button } from "@dynatrace/strato-components/buttons";
import { COLORS, FONTS } from "../styles/theme";
import { useWizard } from "../lib/wizardContext";
import { workflowUrl, dashboardUrl, automationWorkflowsUrl } from "../lib/dtClients";

const CopyChip: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      style={{
        background: "transparent",
        border: `1px solid ${COLORS.cardBorder}`,
        color: copied ? COLORS.greenBright : COLORS.label,
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 11,
        cursor: "pointer",
        fontFamily: FONTS.mono,
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
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
      <div
        style={{
          background: `${COLORS.green}15`,
          border: `1px solid ${COLORS.green}80`,
          borderRadius: 12,
          padding: 24,
          boxShadow: `0 0 24px ${COLORS.green}30`,
        }}
      >
        <Heading level={3} style={{ color: COLORS.greenBright, marginBottom: 6 }}>
          {pending ? "✓ Dashboard deployed — one step left" : "✓ Scenario deployed"}
        </Heading>
        <Paragraph style={{ color: COLORS.label }}>
          {pending
            ? "Your business dashboard is live with 2 hours of backfilled data. The Automation app should have opened in a new tab with your workflow pre-filled — click Save there to start the live log feed."
            : "The workflow is ingesting logs every minute and a business dashboard is ready with 2 hours of backfilled data."}
        </Paragraph>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <div
          style={{
            background: COLORS.cardBg,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <Text style={{ color: COLORS.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
            Workflow
          </Text>
          <div style={{ color: COLORS.title, fontWeight: 600, marginTop: 6 }}>{r.workflowTitle}</div>
          {pending ? (
            <Paragraph style={{ color: COLORS.label, fontSize: 12, marginTop: 8 }}>
              The workflow editor was opened with this scenario pre-filled. Review the tasks and click <b>Save</b> in the Automation app.
            </Paragraph>
          ) : (
            <Flex gap={8} alignItems="center" paddingTop={8}>
              <Text style={{ color: COLORS.label, fontSize: 12, fontFamily: FONTS.mono }}>
                {r.workflowId}
              </Text>
              <CopyChip value={r.workflowId ?? ""} />
            </Flex>
          )}
          <Flex gap={8} paddingTop={12}>
            <a
              href={wfLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: COLORS.blue,
                color: COLORS.title,
                padding: "8px 14px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {pending ? "Open Automation →" : "Manage in Automation →"}
            </a>
          </Flex>
        </div>

        {r.dashboardId && (
          <div
            style={{
              background: COLORS.cardBg,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <Text style={{ color: COLORS.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
              Dashboard
            </Text>
            <div style={{ color: COLORS.title, fontWeight: 600, marginTop: 6 }}>{r.dashboardName}</div>
            <Flex gap={8} alignItems="center" paddingTop={8}>
              <Text style={{ color: COLORS.label, fontSize: 12, fontFamily: FONTS.mono }}>
                {r.dashboardId}
              </Text>
              <CopyChip value={r.dashboardId} />
            </Flex>
            <Flex gap={8} paddingTop={12}>
              <a
                href={dbLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: COLORS.purple,
                  color: COLORS.title,
                  padding: "8px 14px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Open Dashboard →
              </a>
            </Flex>
          </div>
        )}
      </div>

      <Flex justifyContent="flex-end">
        <Button
          variant="emphasized"
          onClick={() => w.reset()}
          style={{ background: COLORS.green, color: COLORS.bg, fontWeight: 700 }}
        >
          Generate another scenario →
        </Button>
      </Flex>
    </Flex>
  );
};
