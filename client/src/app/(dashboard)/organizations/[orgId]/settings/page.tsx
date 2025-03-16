"use client";

import React from "react";
import AdminSettings from "./_components/AdminSettings";
import UserSettings from "./_components/UserSettings"; // TODO: Implement this component
import { useOrganization } from "@/context/OrganizationContext";
import { useUser } from "@clerk/nextjs";
import NotFound from "@/components/NotFound";
import { SignInRequired } from "@/components/SignInRequired";

const Settings = () => {
  const { user } = useUser();
  const { currentOrg } = useOrganization();

  if (!user) return <SignInRequired />;
  if (!currentOrg) return <NotFound message="Organization not found" />;

  const isAuthorized = currentOrg.admins.some((admin) => admin.userId === user.id)

  return (
    <>
      {isAuthorized ? <AdminSettings /> : <UserSettings />}
    </>
  );
};

export default Settings;