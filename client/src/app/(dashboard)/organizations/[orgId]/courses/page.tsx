"use client";

import { usePathname } from "next/navigation";
import React from "react";
import AdminCourses from "./_components/AdminCourses";
import UserCourses from "./_components/UserCourses";
import { useOrganization } from "@/context/OrganizationContext";
import { useUser } from "@clerk/nextjs";

const Courses = () => {
  const orgId = usePathname().split("/")[2];
  const { user } = useUser();
  const { currentOrg } = useOrganization();
  const isAuthorized = currentOrg?.admins.some((admin) => admin.userId === user?.id);

  return (
    <>
      {isAuthorized ? <AdminCourses orgId={orgId} /> : <UserCourses />}
    </>
  );
};

export default Courses;