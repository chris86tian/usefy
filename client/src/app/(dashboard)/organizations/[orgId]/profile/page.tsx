'use client';

import Header from "@/components/Header";
import React from "react";
import CommitGraph from "@/components/CommitGraph";

const Profile = () => {
  return (
    <>
      <Header title="Profile" subtitle="View your profile" />
      <div className="flex flex-row gap-4">
        <CommitGraph />
      </div>
    </>
  );
};

export default Profile;