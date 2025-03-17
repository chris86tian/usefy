'use client';
import { createContext, useContext } from "react";

interface OrganizationContextType {
  currentOrg: Organization | null;
  isOrgLoading: boolean;
}

export const OrganizationContext = createContext<OrganizationContextType>({
  currentOrg: null,
  isOrgLoading: true, // Default to loading state
});

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
};
