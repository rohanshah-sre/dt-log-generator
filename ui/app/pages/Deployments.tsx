import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flex, Grid } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph, Text } from "@dynatrace/strato-components/typography";
import { Button } from "@dynatrace/strato-components/buttons";

import type { Workflow } from "@dynatrace-sdk/client-automation";

import { COLORS, FONTS } from "../styles/theme";
import { workflowsClient, documentsClient, workflowUrl, dashboardUrl } from "../lib/dtClients";

interface ParsedMeta {
  vertical?: string;
  usecase?: string;
  scenario?: string;
  created?: string;
  documentId?: string;
}

interface DeploymentRow {
  id: string;
  title: string;
  scenarioName: string;
  meta: ParsedMeta;
  isActive: boolean;
  lastExecution?: string;
  lastExecutionState?: string;
  modifiedAt?: string;
}

const TITLE_PREFIX = "[LaunchLog]";

const parseDescription = (desc?: string): ParsedMeta => {
  if (!desc) return {};
  const out: ParsedMeta = {};
  for (const part of desc.split("|")) {
    const seg = part.trim();
    const idx = seg.indexOf(":");
    if (idx <= 0) continue;
    const key = seg.slice(0, idx).trim();
    const value = seg.slice(idx + 1).trim();
    if (key === "vertical") out.vertical = value;
    else if (key === "usecase") out.usecase = value;
    else if (key === "scenario") out.scenario = value;
    else if (key === "created") out.created = value;
    else if (key === "documentId") out.documentId = value;
  }
  return out;
};

const stripPrefix = (title: string): string =>
  title.startsWith(TITLE_PREFIX) ? title.slice(TITLE_PREFIX.length).trim() : title;

const fmtDate = (s?: string): string => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
};

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 999,
      background: active ? `${COLORS.green}20` : `${COLORS.muted}20`,
      border: `1px solid ${active ? COLORS.green : COLORS.muted}80`,
      color: active ? COLORS.green : COLORS.muted,
      fontWeight: 600,
      fontSize: 12,
      letterSpacing: 0.5,
    }}
  >
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: active ? COLORS.green : COLORS.muted,
        boxShadow: active ? `0 0 8px ${COLORS.green}` : "none",
      }}
    />
    {active ? "ACTIVE" : "PAUSED"}
  </span>
);

const SkeletonCard: React.FC = () => (
  <div
    style={{
      background: COLORS.cardBg,
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 12,
      padding: 20,
      height: 240,
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(90deg, transparent, ${COLORS.blue}10, transparent)`,
        animation: "lpShimmer 1.4s linear infinite",
      }}
    />
  </div>
);

export const Deployments: React.FC = () => {
  const [rows, setRows] = useState<DeploymentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // Title prefix filter not directly supported as exact match, but `search`
      // does substring matching across title/description/owner.
      // Fetch workflows and LaunchLog dashboards in parallel; we join them by
      // scenario name because the intent-based deploy strips the workflow
      // description (where we used to embed documentId) before saving.
      const [wfResp, docResp] = await Promise.all([
        workflowsClient.getWorkflows({ search: "LaunchLog", limit: 200 }),
        documentsClient.listDocuments({
          filter: "type == 'dashboard' and name starts-with '[LaunchLog]'",
          pageSize: 200,
        }).catch(() => ({ documents: [] as Array<{ id: string; name: string }> })),
      ]);
      const list: Workflow[] = wfResp.results ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docs = ((docResp as any).documents ?? []) as Array<{ id: string; name: string }>;
      const dashByScenario = new Map<string, string>();
      for (const d of docs) {
        // Stored as `[LaunchLog] {scenarioName}`. Strip the prefix and map.
        const stripped = d.name.startsWith(TITLE_PREFIX) ? d.name.slice(TITLE_PREFIX.length).trim() : d.name;
        if (stripped) dashByScenario.set(stripped, d.id);
      }
      const mapped: DeploymentRow[] = list
        .filter((wf) => wf.title.startsWith(TITLE_PREFIX))
        .map((wf) => {
          const meta = parseDescription(wf.description);
          const schedule = wf.trigger?.schedule;
          const isActive = !!schedule?.isActive;
          // Execution shape varies by trigger type; pull what we recognise.
          const exec = wf.lastExecution as { startedAt?: string; scheduledAt?: string; state?: string } | null | undefined;
          const modTime = wf.modificationInfo?.lastModifiedTime ?? wf.modificationInfo?.createdTime;
          const scenarioName = meta.scenario ?? stripPrefix(wf.title);
          // Prefer the documentId embedded in the description (legacy
          // workflows created via SDK), fall back to the dashboard whose
          // name matches `[LaunchLog] {scenarioName}` (intent-created
          // workflows where description was stripped by the platform).
          const documentId = meta.documentId ?? dashByScenario.get(scenarioName);
          return {
            id: wf.id,
            title: wf.title,
            scenarioName,
            meta: { ...meta, documentId },
            isActive,
            lastExecution: exec?.startedAt ?? exec?.scheduledAt,
            lastExecutionState: exec?.state,
            modifiedAt: modTime ? new Date(modTime).toISOString() : undefined,
          };
        })
        .sort((a, b) => (b.meta.created ?? "").localeCompare(a.meta.created ?? ""));
      setRows(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        backgroundImage: `radial-gradient(circle at 110% -10%, ${COLORS.green}20, transparent 40%), radial-gradient(circle at -10% 30%, ${COLORS.blue}20, transparent 45%)`,
        color: COLORS.title,
      }}
    >
      <style>{`
        @keyframes lpShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px 64px" }}>
        <Flex justifyContent="space-between" alignItems="flex-start" gap={16}>
          <div>
            <Heading level={1} style={{ color: COLORS.title, fontSize: 30, marginBottom: 4 }}>
              📋 My Deployments
            </Heading>
            <Paragraph style={{ color: COLORS.label, maxWidth: 720 }}>
              Every active LaunchLog scenario in your tenant. Use <b>Manage in Automation</b> to
              pause, resume, or delete a deployment — those actions run with your own tenant
              permissions inside the Automation app.
            </Paragraph>
          </div>
          <Flex gap={8}>
            <Button onClick={() => void load()} disabled={rows === null}>
              ↻ Refresh
            </Button>
            <Link to="/" style={{ textDecoration: "none" }}>
              <Button
                style={{
                  background: COLORS.green,
                  color: COLORS.bg,
                  fontWeight: 700,
                }}
              >
                + New Scenario
              </Button>
            </Link>
          </Flex>
        </Flex>

        {error && (
          <div
            style={{
              marginTop: 20,
              background: `${COLORS.pink}15`,
              border: `1px solid ${COLORS.pink}80`,
              borderRadius: 10,
              padding: 14,
            }}
          >
            <Text style={{ color: COLORS.pink, fontWeight: 600 }}>Could not load deployments. </Text>
            <Text style={{ color: COLORS.title }}>{error}</Text>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          {rows === null ? (
            <Grid gridTemplateColumns="repeat(auto-fill, minmax(360px, 1fr))" gap={20}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </Grid>
          ) : rows.length === 0 ? (
            <div
              style={{
                background: COLORS.cardBg,
                border: `1px dashed ${COLORS.cardBorder}`,
                borderRadius: 16,
                padding: 60,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
              <Heading level={3} style={{ color: COLORS.title, marginBottom: 8 }}>
                No LaunchLog scenarios deployed yet
              </Heading>
              <Paragraph style={{ color: COLORS.label, marginBottom: 20 }}>
                Go back to the wizard to create your first one.
              </Paragraph>
              <Link to="/" style={{ textDecoration: "none" }}>
                <Button
                  style={{
                    background: COLORS.green,
                    color: COLORS.bg,
                    fontWeight: 700,
                  }}
                >
                  Open wizard →
                </Button>
              </Link>
            </div>
          ) : (
            <Grid gridTemplateColumns="repeat(auto-fill, minmax(360px, 1fr))" gap={20}>
              {rows.map((row) => {
                const wfHref = workflowUrl(row.id);
                return (
                  <div
                    key={row.id}
                    style={{
                      background: COLORS.cardBg,
                      border: `1px solid ${COLORS.cardBorder}`,
                      borderRadius: 14,
                      padding: 20,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      boxShadow: row.isActive ? `0 0 18px ${COLORS.green}15` : "none",
                    }}
                  >
                    <Flex justifyContent="space-between" alignItems="flex-start" gap={8}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Heading
                          level={4}
                          style={{
                            color: COLORS.title,
                            marginBottom: 4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.scenarioName}
                        </Heading>
                        <Text style={{ color: COLORS.label, fontSize: 12 }}>
                          {row.meta.vertical ?? "—"} / {row.meta.usecase ?? "—"}
                        </Text>
                      </div>
                      <StatusBadge active={row.isActive} />
                    </Flex>

                    <div
                      style={{
                        background: "rgba(13,13,26,0.5)",
                        borderRadius: 8,
                        padding: 10,
                        fontFamily: FONTS.mono,
                        fontSize: 11,
                        color: COLORS.muted,
                      }}
                    >
                      <div>
                        <Text style={{ color: COLORS.muted, fontSize: 11 }}>created </Text>
                        <Text style={{ color: COLORS.label, fontSize: 11 }}>{fmtDate(row.meta.created)}</Text>
                      </div>
                      <div>
                        <Text style={{ color: COLORS.muted, fontSize: 11 }}>last run </Text>
                        <Text style={{ color: COLORS.label, fontSize: 11 }}>
                          {fmtDate(row.lastExecution)}
                          {row.lastExecutionState ? ` (${row.lastExecutionState})` : ""}
                        </Text>
                      </div>
                    </div>

                    <Flex gap={8} flexWrap="wrap">
                      <a
                        href={wfHref}
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
                        Manage in Automation →
                      </a>
                      {row.meta.documentId && (
                        <a
                          href={dashboardUrl(row.meta.documentId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: "transparent",
                            color: COLORS.label,
                            border: `1px solid ${COLORS.cardBorder}`,
                            padding: "8px 14px",
                            borderRadius: 8,
                            textDecoration: "none",
                            fontWeight: 500,
                            fontSize: 13,
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          📊 Dashboard
                        </a>
                      )}
                    </Flex>
                  </div>
                );
              })}
            </Grid>
          )}
        </div>
      </div>
    </div>
  );
};
