"use client"

import { UserButton } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { Bell, Home } from "lucide-react"
import { useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import NotificationModal from "./NotificationModal"
import { useGetNotificationsQuery } from "@/state/api"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

const Navbar = () => {
  const { user } = useUser()
  const router = useRouter()
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const { data: notifications } = useGetNotificationsQuery(user?.id || "")

  return (
    <nav className="dashboard-navbar">
      <div className="dashboard-navbar__container">
        <div className="dashboard-navbar__search">
          <div className="md:hidden">
            <SidebarTrigger className="dashboard-navbar__sidebar-trigger" />
          </div>

          <button 
            onClick={() => router.push("/")}
            className="nondashboard-navbar__notification-button">
              <Home className="nondashboard-navbar__notification-icon" />
          </button>
          
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

