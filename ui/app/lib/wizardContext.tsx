import React, { createContext, useContext, useMemo, useState } from "react";
import type { VerticalKey, UseCaseKey } from "./verticals";

export type LogVolume = "light" | "medium" | "heavy";
export type ErrorRateLevel = "low" | "medium" | "high";
export type DurationOption = 30 | 60 | 240 | 480 | 1440; // minutes
export type ServiceCount = 3 | 5 | 8;

export const VOLUME_TO_LPM: Record<LogVolume, number> = {
  light: 100,
  medium: 500,
  heavy: 2000,
};

export const ERROR_RATE_TO_PCT: Record<ErrorRateLevel, number> = {
  low: 0.02,
  medium: 0.10,
  high: 0.25,
};

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  vertical: VerticalKey | null;
  useCase: UseCaseKey | null;
  volume: LogVolume;
  errorRate: ErrorRateLevel;
  duration: DurationOption;
  serviceCount: ServiceCount;
  customerName: string;
  scenarioName: string;
}

export interface DeployResult {
  workflowId?: string;
  workflowTitle?: string;
  dashboardId?: string;
  dashboardName?: string;
  error?: string;
}

interface WizardCtx extends WizardState {
  setStep(step: WizardState["step"]): void;
  setVertical(v: VerticalKey | null): void;
  setUseCase(u: UseCaseKey | null): void;
  setVolume(v: LogVolume): void;
  setErrorRate(e: ErrorRateLevel): void;
  setDuration(d: DurationOption): void;
  setServiceCount(s: ServiceCount): void;
  setCustomerName(n: string): void;
  setScenarioName(n: string): void;
  reset(): void;
  deployState: "idle" | "deploying" | "success" | "error";
  deployResult: DeployResult | null;
  setDeployState(state: "idle" | "deploying" | "success" | "error"): void;
  setDeployResult(r: DeployResult | null): void;
}

const initial: WizardState = {
  step: 1,
  vertical: null,
  useCase: null,
  volume: "medium",
  errorRate: "medium",
  duration: 60,
  serviceCount: 5,
  customerName: "",
  scenarioName: "",
};

const Ctx = createContext<WizardCtx | null>(null);

export const WizardProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<WizardState>(initial);
  const [deployState, setDeployState] = useState<"idle" | "deploying" | "success" | "error">("idle");
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);

  const value = useMemo<WizardCtx>(
    () => ({
      ...state,
      setStep: (step) => setState((s) => ({ ...s, step })),
      setVertical: (vertical) => setState((s) => ({ ...s, vertical, useCase: null })),
      setUseCase: (useCase) => setState((s) => ({ ...s, useCase })),
      setVolume: (volume) => setState((s) => ({ ...s, volume })),
      setErrorRate: (errorRate) => setState((s) => ({ ...s, errorRate })),
      setDuration: (duration) => setState((s) => ({ ...s, duration })),
      setServiceCount: (serviceCount) => setState((s) => ({ ...s, serviceCount })),
      setCustomerName: (customerName) => setState((s) => ({ ...s, customerName })),
      setScenarioName: (scenarioName) => setState((s) => ({ ...s, scenarioName })),
      reset: () => {
        setState(initial);
        setDeployState("idle");
        setDeployResult(null);
      },
      deployState,
      deployResult,
      setDeployState,
      setDeployResult,
    }),
    [state, deployState, deployResult],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useWizard = (): WizardCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWizard must be used inside <WizardProvider>");
  return ctx;
};
