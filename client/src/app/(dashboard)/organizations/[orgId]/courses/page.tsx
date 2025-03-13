"use client";

import React from "react";
import AdminCourses from "./_components/AdminCourses";
import { useOrganization } from "@/context/OrganizationContext";
import { useUser } from "@clerk/nextjs";

const Courses = () => {
  const { user } = useUser();
  const { currentOrg } = useOrganization();
  const isAuthorized = currentOrg?.admins.some((admin) => admin.userId === user?.id) || currentOrg?.instructors.some((instructor) => instructor.userId === user?.id);

  // TODO
  return (
    <>
      {isAuthorized ? <AdminCourses /> : null }
    </>
  );
};

export default Courses;