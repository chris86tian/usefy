"use client";

import React from "react";
import AdminCourses from "./_components/AdminCourses";
import UserCourses from "./_components/UserCourses";
import { useOrganization } from "@/context/OrganizationContext";
import { useUser } from "@clerk/nextjs";

const Courses = () => {
  const { user } = useUser();
  const { currentOrg } = useOrganization();
  const isAuthorized = currentOrg?.admins.some((admin) => admin.userId === user?.id) || currentOrg?.instructors.some((instructor) => instructor.userId === user?.id);

  return (
    <>
      {isAuthorized ? <AdminCourses /> : <UserCourses />}
    </>
  );
};

export default Courses;