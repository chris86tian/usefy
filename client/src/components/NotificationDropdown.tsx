"use client"

import type React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface NotificationDropdownProps {
  notifications: UserNotification[]
}

const NotificationDropdown = ({ notifications }: NotificationDropdownProps) => {
  const router = useRouter()
  
  const handleNotificationClick = (notification: UserNotification) => {
    if (notification.link) {
      router.push(notification.link)
    }
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {notifications && notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {notifications.length}
            </span>
          )}
          <Bell className="h-5 w-5 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" />
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="border-b border-border px-4 py-2">
          <h4 className="text-sm font-medium">Notifications</h4>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div
                  key={notification.notificationId || index}
                  className={`mb-2 rounded-md border border-border bg-card p-3 last:mb-0 hover:bg-accent transition-colors ${notification.link ? 'cursor-pointer' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
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
                </div>
              ))
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
