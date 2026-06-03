import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppHeader, TitleBar } from "@dynatrace/strato-components/layouts";
import { Tabs, Tab } from "@dynatrace/strato-components/navigation";

const ROUTES = ["/", "/deployments"];

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedIndex = Math.max(
    0,
    ROUTES.findIndex((r) =>
      r === "/" ? location.pathname === "/" : location.pathname.startsWith(r)
    )
  );

  return (
    <>
      <AppHeader>
        <AppHeader.Navigation>
          <AppHeader.NavigationItem as="span">LaunchLog</AppHeader.NavigationItem>
        </AppHeader.Navigation>
      </AppHeader>
      <TitleBar showDivider={false}>
        <TitleBar.Title>LaunchLog</TitleBar.Title>
        <TitleBar.Subtitle>
          Business scenario log generation for live demos
        </TitleBar.Subtitle>
        <TitleBar.Navigation>
          <Tabs
            selectedIndex={selectedIndex}
            onChange={(i) => navigate(ROUTES[i])}
          >
            <Tab title="Wizard">{null}</Tab>
            <Tab title="My Deployments">{null}</Tab>
          </Tabs>
        </TitleBar.Navigation>
      </TitleBar>
    </>
  );
};
