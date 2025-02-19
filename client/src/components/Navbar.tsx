"use client"

import { UserButton } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { Bell, BookOpen } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import NotificationModal from "./NotificationModal"
import { useGetNotificationsQuery } from "@/state/api"
import { useUser } from "@clerk/nextjs"

const Navbar = ({ isCoursePage }: { isCoursePage: boolean }) => {
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const { user } = useUser()
  const { data: notifications } = useGetNotificationsQuery(user?.id || "")

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
          </div>
          <button 
            onClick={() => setIsNotificationModalOpen(true)} 
            className="nondashboard-navbar__notification-button">
              {notifications && notifications.length > 0 && (
                <span className="nondashboard-navbar__notification-indicator">
                  {notifications.length}
                </span>
              )}
              <Bell className="nondashboard-navbar__notification-icon" />
          </button>
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

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications || []}
      />
    </nav>
  )
}

export default Navbar

