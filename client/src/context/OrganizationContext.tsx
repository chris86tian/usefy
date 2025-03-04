'use client';
import { createContext, useContext } from "react";

interface OrganizationContextType {
  currentOrg: Organization | null;  
}

export const OrganizationContext = createContext<OrganizationContextType | null>(null);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
};
