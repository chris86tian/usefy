"use client";

import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";

const NonDashboardNavbar = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.userType as "student" | "teacher";

  return (
    <nav className="nondashboard-navbar">
      <div className="nondashboard-navbar__container">
        <div className="nondashboard-navbar__search">
          <Link href="/" className="nondashboard-navbar__brand" scroll={false}>
            GrowthHungry
          </Link>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Link
                href="/search"
                className="nondashboard-navbar__search-input"
                scroll={false}
              >
                <span className="hidden sm:inline">Explore Courses</span>
                <span className="sm:hidden">Search</span>
              </Link>
              <BookOpen
                className="nondashboard-navbar__search-icon"
                size={18}
              />
            </div>
          </div>
        </div>
        <div className="nondashboard-navbar__actions">

          <SignedIn>
            <div className="flex items-center gap-4">
              <Link
                href="/snippets"
                className="text-customgreys-dirtyGrey"
              >
                Snippets
              </Link>
              <Link
                href={
                  userRole === "teacher"
                    ? "/teacher/courses"
                    : "/user/courses"
                }
                className="text-customgreys-dirtyGrey"
              >
                Courses
              </Link>
              <UserButton
                appearance={{
                  baseTheme: dark,
                  elements: {
                    userButtonOuterIdentifier: "text-customgreys-dirtyGrey",
                    userButtonBox: "scale-90 sm:scale-100",
                  },
                }}
                showName={true}
                userProfileMode="navigation"
                userProfileUrl={
                  userRole === "teacher" ? "/teacher/profile" : "/user/profile"
                }
              />
            </div>
          </SignedIn>
          <SignedOut>
            <Link
              href="/signin"
              scroll={false}
            >
              <Button variant={"outline"} className="text-blue-500">Log In</Button>
            </Link>
            <Link
              href="/signup"
              scroll={false}
            >
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">Sign Up</Button>
            </Link>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
};

export default NonDashboardNavbar;