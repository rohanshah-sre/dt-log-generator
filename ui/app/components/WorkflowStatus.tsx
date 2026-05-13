import React, { useState } from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph, Text } from "@dynatrace/strato-components/typography";
import { Button } from "@dynatrace/strato-components/buttons";
import { COLORS, FONTS } from "../styles/theme";
import { useWizard } from "../lib/wizardContext";
import { workflowsClient, workflowUrl } from "../lib/dtClients";

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
  const [stopping, setStopping] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [stopErr, setStopErr] = useState<string | null>(null);

  if (!r || w.deployState !== "success") return null;

  const stopWorkflow = async () => {
    if (!r.workflowId) return;
    setStopping(true);
    setStopErr(null);
    try {
      await workflowsClient.updateWorkflow({
        id: r.workflowId,
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
      setStopped(true);
    } catch (err) {
      setStopErr(err instanceof Error ? err.message : String(err));
    } finally {
      setStopping(false);
    }
  };

  const wfLink = r.workflowId ? workflowUrl(r.workflowId) : "";

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
          ✓ Scenario deployed
        </Heading>
        <Paragraph style={{ color: COLORS.label }}>
          The workflow is now ingesting logs every minute. Open it in Automation to monitor execution or pause ingestion.
        </Paragraph>
      </div>

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
        <Flex gap={8} alignItems="center" paddingTop={8}>
          <Text style={{ color: COLORS.label, fontSize: 12, fontFamily: FONTS.mono }}>
            {r.workflowId}
          </Text>
          <CopyChip value={r.workflowId ?? ""} />
        </Flex>
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
            Open in Automation →
          </a>
          <Button
            onClick={stopWorkflow}
            disabled={stopping || stopped}
            style={{ background: stopped ? COLORS.muted : COLORS.pink, color: COLORS.bg, fontWeight: 700 }}
          >
            {stopped ? "Stopped" : stopping ? "Stopping…" : "Stop workflow"}
          </Button>
        </Flex>
        {stopErr && <Text style={{ color: COLORS.pink, fontSize: 12, marginTop: 8 }}>{stopErr}</Text>}
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
