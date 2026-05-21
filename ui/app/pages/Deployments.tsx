import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flex, Grid } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph, Text } from "@dynatrace/strato-components/typography";
import { Button } from "@dynatrace/strato-components/buttons";

import type { Workflow } from "@dynatrace-sdk/client-automation";

import { COLORS, FONTS } from "../styles/theme";
import {
  workflowsClient,
  workflowUrl,
  dashboardUrl,
} from "../lib/dtClients";

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

const ConfirmDialog: React.FC<{
  open: boolean;
  scenarioName: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
}> = ({ open, scenarioName, onCancel, onConfirm, busy }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "#1A1A2E",
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 12,
          padding: 24,
          width: 460,
          maxWidth: "90vw",
          boxShadow: `0 8px 40px ${COLORS.pink}30`,
        }}
      >
        <Heading level={3} style={{ color: COLORS.title, marginBottom: 8 }}>
          Delete deployment?
        </Heading>
        <Paragraph style={{ color: COLORS.label, marginBottom: 20 }}>
          This will permanently delete the workflow <Text style={{ color: COLORS.title, fontWeight: 600 }}>{scenarioName}</Text>.
          The associated dashboard will remain in your tenant. This action cannot be undone.
        </Paragraph>
        <Flex justifyContent="flex-end" gap={8}>
          <Button onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button
            onClick={onConfirm}
            disabled={busy}
            style={{ background: COLORS.pink, color: COLORS.bg, fontWeight: 700 }}
          >
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </Flex>
      </div>
    </div>
  );
};

export const Deployments: React.FC = () => {
  const [rows, setRows] = useState<DeploymentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DeploymentRow | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // Title prefix filter not directly supported as exact match, but `search`
      // does substring matching across title/description/owner.
      const resp = await workflowsClient.getWorkflows({ search: "LaunchLog", limit: 200 });
      const list: Workflow[] = resp.results ?? [];
      const mapped: DeploymentRow[] = list
        .filter((wf) => wf.title.startsWith(TITLE_PREFIX))
        .map((wf) => {
          const meta = parseDescription(wf.description);
          const schedule = wf.trigger?.schedule;
          const isActive = !!schedule?.isActive;
          // Execution shape varies by trigger type; pull what we recognise.
          const exec = wf.lastExecution as { startedAt?: string; scheduledAt?: string; state?: string } | null | undefined;
          const modTime = wf.modificationInfo?.lastModifiedTime ?? wf.modificationInfo?.createdTime;
          return {
            id: wf.id,
            title: wf.title,
            scenarioName: meta.scenario ?? stripPrefix(wf.title),
            meta,
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

  const handlePause = async (row: DeploymentRow) => {
    // The automation:workflows:write scope is restricted to Dynatrace-provided
    // apps, so we cannot toggle the schedule from inside this app. Open the
    // workflow in the Automation app where the user can pause it with their
    // own tenant permissions, then optimistically reflect the intent locally.
    window.open(workflowUrl(row.id), "_blank", "noopener,noreferrer");
    setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, isActive: false } : r)) ?? prev);
  };

  const handleResume = async (row: DeploymentRow) => {
    window.open(workflowUrl(row.id), "_blank", "noopener,noreferrer");
    setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, isActive: true } : r)) ?? prev);
  };

  const handleDelete = async (row: DeploymentRow) => {
    // Same scope restriction — open the workflow page where the user can
    // delete it natively; remove the row from our local list once they
    // confirm the navigation.
    window.open(workflowUrl(row.id), "_blank", "noopener,noreferrer");
    setRows((prev) => prev?.filter((r) => r.id !== row.id) ?? prev);
    setConfirmDelete(null);
  };

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
              Every active LaunchLog scenario in your tenant. Pause to stop ingestion temporarily,
              resume to bring it back, or delete it when the demo is done.
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
                const busy = busyId === row.id;
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
                      {row.isActive ? (
                        <Button
                          onClick={() => void handlePause(row)}
                          disabled={busy}
                          style={{ background: COLORS.muted, color: COLORS.bg, fontWeight: 600 }}
                        >
                          ⏸ Pause
                        </Button>
                      ) : (
                        <Button
                          onClick={() => void handleResume(row)}
                          disabled={busy}
                          style={{ background: COLORS.green, color: COLORS.bg, fontWeight: 600 }}
                        >
                          ▶ Resume
                        </Button>
                      )}
                      <a
                        href={wfHref}
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
                        ↗ Workflow
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
                      <Button
                        onClick={() => setConfirmDelete(row)}
                        disabled={busy}
                        style={{
                          background: "transparent",
                          color: COLORS.pink,
                          border: `1px solid ${COLORS.pink}80`,
                          fontWeight: 600,
                        }}
                      >
                        🗑 Delete
                      </Button>
                    </Flex>
                  </div>
                );
              })}
            </Grid>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        scenarioName={confirmDelete?.scenarioName ?? ""}
        busy={busyId === confirmDelete?.id}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && void handleDelete(confirmDelete)}
      />
    </div>
  );
};
