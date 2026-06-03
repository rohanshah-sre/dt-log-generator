import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flex, Surface, TitleBar } from "@dynatrace/strato-components/layouts";
import { Paragraph } from "@dynatrace/strato-components/typography";
import { Button } from "@dynatrace/strato-components/buttons";
import { DataTable, type DataTableColumnDef } from "@dynatrace/strato-components/tables";
import { EmptyState, HealthIndicator } from "@dynatrace/strato-components/content";
import { showToast } from "@dynatrace/strato-components/notifications";

import type { Workflow } from "@dynatrace-sdk/client-automation";

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

export const Deployments: React.FC = () => {
  const [rows, setRows] = useState<DeploymentRow[] | null>(null);

  const load = useCallback(async () => {
    try {
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
        const stripped = d.name.startsWith(TITLE_PREFIX) ? d.name.slice(TITLE_PREFIX.length).trim() : d.name;
        if (stripped) dashByScenario.set(stripped, d.id);
      }
      const mapped: DeploymentRow[] = list
        .filter((wf) => wf.title.startsWith(TITLE_PREFIX))
        .map((wf) => {
          const meta = parseDescription(wf.description);
          const schedule = wf.trigger?.schedule;
          const isActive = !!schedule?.isActive;
          const exec = wf.lastExecution as { startedAt?: string; scheduledAt?: string; state?: string } | null | undefined;
          const modTime = wf.modificationInfo?.lastModifiedTime ?? wf.modificationInfo?.createdTime;
          const scenarioName = meta.scenario ?? stripPrefix(wf.title);
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
      const msg = err instanceof Error ? err.message : String(err);
      showToast({ type: "critical", title: "Could not load deployments", message: msg });
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo<DataTableColumnDef<DeploymentRow>[]>(() => [
    {
      id: "scenarioName",
      header: "Scenario",
      accessor: "scenarioName",
      width: "2fr",
    },
    {
      id: "vertical",
      header: "Vertical",
      accessor: (row) => row.meta.vertical ?? "—",
    },
    {
      id: "usecase",
      header: "Use Case",
      accessor: (row) => row.meta.usecase ?? "—",
    },
    {
      id: "created",
      header: "Deployed At",
      accessor: (row) => fmtDate(row.meta.created),
    },
    {
      id: "status",
      header: "Status",
      accessor: (row) => (row.isActive ? "ACTIVE" : "PAUSED"),
      cell: ({ rowData }: { rowData: DeploymentRow; value: string }) => (
        <HealthIndicator status={rowData.isActive ? "good" : "neutral"}>
          {rowData.isActive ? "ACTIVE" : "PAUSED"}
        </HealthIndicator>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      accessor: "id",
      cell: ({ rowData }: { rowData: DeploymentRow; value: string }) => (
        <Flex gap={8}>
          <Button
            as="a"
            href={workflowUrl(rowData.id)}
            target="_blank"
            rel="noopener noreferrer"
            variant="emphasized"
          >
            Automation
          </Button>
          {rowData.meta.documentId && (
            <Button
              as="a"
              href={dashboardUrl(rowData.meta.documentId)}
              target="_blank"
              rel="noopener noreferrer"
              variant="default"
            >
              Dashboard
            </Button>
          )}
        </Flex>
      ),
    },
  ], []);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px 64px" }}>
      <TitleBar>
        <TitleBar.Title>My Deployments</TitleBar.Title>
        <TitleBar.Subtitle>
          Every active LaunchLog scenario in your tenant. Use <strong>Automation</strong> to pause, resume, or delete a deployment.
        </TitleBar.Subtitle>
        <TitleBar.Suffix>
          <Flex gap={8}>
            <Button onClick={() => void load()} disabled={rows === null}>
              Refresh
            </Button>
            <Button as={Link} to="/" variant="emphasized">
              New Scenario
            </Button>
          </Flex>
        </TitleBar.Suffix>
      </TitleBar>

      <div style={{ marginTop: 24 }}>
        {rows === null ? (
          <Surface elevation="raised">
            <Flex padding={64} justifyContent="center">
              <Paragraph>Loading deployments…</Paragraph>
            </Flex>
          </Surface>
        ) : rows.length === 0 ? (
          <EmptyState>
            <EmptyState.Visual>
              <EmptyState.VisualPreset context="generic" type="create-new" />
            </EmptyState.Visual>
            <EmptyState.Title>No LaunchLog scenarios deployed yet</EmptyState.Title>
            <EmptyState.Details>
              Go back to the wizard to create your first scenario.
            </EmptyState.Details>
            <EmptyState.Actions>
              <Button as={Link} to="/" variant="emphasized">
                Open wizard
              </Button>
            </EmptyState.Actions>
          </EmptyState>
        ) : (
          <DataTable data={rows} columns={columns} fullWidth>
            <DataTable.EmptyState>No deployments found.</DataTable.EmptyState>
          </DataTable>
        )}
      </div>
    </div>
  );
};
