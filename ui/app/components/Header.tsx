import React from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@dynatrace/strato-components-preview/layouts";

export const Header = () => {
  return (
    <AppHeader>
      <AppHeader.NavItems>
        <AppHeader.AppNavLink as={Link} to="/" />
        <AppHeader.NavigationItem as={Link} to="/">
          🚀 Wizard
        </AppHeader.NavigationItem>
        <AppHeader.NavigationItem as={Link} to="/deployments">
          📋 My Deployments
        </AppHeader.NavigationItem>
      </AppHeader.NavItems>
    </AppHeader>
  );
};
