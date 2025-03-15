"use client"

import type React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useMarkNotificationAsReadMutation } from "@/state/api"

interface NotificationDropdownProps {
  notifications: UserNotification[]
  refetch: () => void
}

const NotificationDropdown = ({ notifications, refetch }: NotificationDropdownProps) => {
  const router = useRouter()
  const [markAsRead] = useMarkNotificationAsReadMutation()

  const handleNotificationClick = async (notification: UserNotification) => {
    if (!notification.link) return;
  
    try {
      const response = await fetch(notification.link, { method: "HEAD" });
      if (response.ok) {
        router.push(notification.link);
      } else {
        console.warn("Invalid link:", notification.link);
      }
    } catch (error) {
      console.error("Error checking link validity:", error);
    }
  };

  const unreadNotifications = notifications.filter(notification => !notification.isRead);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(unreadNotifications.map(notification => markAsRead(notification.notificationId).unwrap()));
      refetch();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadNotifications.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadNotifications.length}
            </span>
          )}
          <Bell className="h-5 w-5 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" />
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-2 border-b border-border">
          <h4 className="text-sm font-medium">Notifications</h4>
          {unreadNotifications.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllAsRead}
            >
              Mark All as Read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.map((notification, index) => {
                const isLinkValid = notification.link && !notification.link.includes("undefined");
                return (
                  <div
                    key={notification.notificationId || index}
                    className={`space-x-2 mb-2 rounded-md border border-border bg-card p-2 last:mb-0 hover:bg-accent transition-colors ${isLinkValid ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                    onClick={() => isLinkValid && handleNotificationClick(notification)}
                  >
                    <h4 className="text-sm font-semibold text-card-foreground">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <span className="text-xs text-muted-foreground/70">
                      {new Date(notification.timestamp).toLocaleString()}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.notificationId);
                      }}
                    >
                      Mark as Read
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-muted-foreground">
                No new notifications
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

export default NotificationDropdown
