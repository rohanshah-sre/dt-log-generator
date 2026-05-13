import { Page } from "@dynatrace/strato-components-preview/layouts";
import React from "react";
import { Route, Routes } from "react-router-dom";
import { Data } from "./pages/Data";
import { Deployments } from "./pages/Deployments";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { WizardProvider } from "./lib/wizardContext";

export const App = () => {
  return (
    <WizardProvider>
      <Page>
        <Page.Header>
          <Header />
        </Page.Header>
        <Page.Main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/deployments" element={<Deployments />} />
            <Route path="/data" element={<Data />} />
          </Routes>
        </Page.Main>
      </Page>
    </WizardProvider>
  );
};
