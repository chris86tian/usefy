"use client";

import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { BookOpen, Code2Icon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const Navbar = ({ isCoursePage }: { isCoursePage: boolean }) => {
  // const { user } = useUser();
  // const userRole = user?.publicMetadata?.userType as "user" | "teacher";

  return (
    <nav className="dashboard-navbar">
      <div className="dashboard-navbar__container">
        <div className="dashboard-navbar__search">
          <div className="md:hidden">
            <SidebarTrigger className="dashboard-navbar__sidebar-trigger" />
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Link
                href="/search"
                className={cn("dashboard-navbar__search-input", {
                  "!bg-customgreys-secondarybg": isCoursePage,
                })}
                scroll={false}
              >
                <span className="hidden sm:inline">Explore Courses</span>
                <span className="sm:hidden">Search</span>
              </Link>
              <BookOpen className="dashboard-navbar__search-icon" size={18} />
            </div>
            <div className="relative group">
              <Link
                href="/snippets"
                className={cn("dashboard-navbar__search-input", {
                  "!bg-customgreys-secondarybg": isCoursePage,
                })}
                scroll={false}
              >
                <span className="hidden sm:inline">Explore Snippets</span>
                <span className="sm:hidden">Search</span>
              </Link>
              <Code2Icon
                className="nondashboard-navbar__search-icon"
                size={18}
              />
            </div>
          </div>
          {/* <Link
            href={
              userRole === "teacher"
                ? "/teacher/notifications"
                : "/user/notifications"
            }
            className="nondashboard-navbar__notification-button"
          >
            <span className="nondashboard-navbar__notification-indicator"></span>
            <Bell className="nondashboard-navbar__notification-icon" />
          </Link> */}
        </div>

        <div className="dashboard-navbar__actions">
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
            userProfileUrl={"/profile"}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;