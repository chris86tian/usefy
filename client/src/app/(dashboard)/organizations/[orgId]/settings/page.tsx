"use client";

import React from "react";
import AdminSettings from "./_components/AdminSettings";
import UserSettings from "./_components/UserSettings";
import { useOrganization } from "@/context/OrganizationContext";
import { useUser } from "@clerk/nextjs";

const Settings = () => {
  const { user } = useUser();
  const { currentOrg } = useOrganization();
  const isAuthorized = currentOrg?.admins.some((admin) => admin.userId === user?.id) || user?.publicMetadata.userType === "superadmin";

  return (
    <>
      {isAuthorized ? <AdminSettings /> : <UserSettings />}
    </>
  );
};

export default Settings;