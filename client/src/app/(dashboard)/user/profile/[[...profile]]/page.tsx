import Header from "@/components/Header";
import { UserProfile } from "@clerk/nextjs";
import CommitGraph from "../_components/CommitGraph";
import { dark } from "@clerk/themes";
import React from "react";

const UserProfilePage = () => {
  return (
    <>
      <Header title="Profile" subtitle="View your profile" />
      <div className="flex flex-row gap-4">
        <UserProfile
          path="/user/profile"
          routing="path"
          appearance={{
            baseTheme: dark,
            elements: {
              scrollBox: "bg-customgreys-darkGrey",
              navbar: {
                "& > div:nth-child(1)": {
                  background: "none",
                },
              },
            },
          }}
        />
        <CommitGraph />
      </div>
    </>
  );
};

export default UserProfilePage;