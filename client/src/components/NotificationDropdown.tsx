"use client"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useMarkNotificationAsReadMutation } from "@/state/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
interface NotificationDropdownProps {
  notifications: UserNotification[]
  refetch: () => void
}

const NotificationDropdown = ({ notifications, refetch }: NotificationDropdownProps) => {
  const router = useRouter()
  const [markAsRead] = useMarkNotificationAsReadMutation()

  const handleNotificationClick = async (notification: UserNotification) => {
    if (!notification.link) return

    try {
      const response = await fetch(notification.link, { method: "HEAD" })
      if (response.ok) {
        if (!notification.isRead) {
          await handleMarkAsRead(notification.notificationId)
        }
        router.push(notification.link)
      } else {
        console.warn("Invalid link:", notification.link)
      }
    } catch (error) {
      console.error("Error checking link validity:", error)
    }
  }

  const unreadNotifications = notifications.filter((notification) => !notification.isRead)

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId).unwrap()
      refetch()
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(unreadNotifications.map((notification) => markAsRead(notification.notificationId).unwrap()))
      refetch()
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  // Sort notifications by timestamp (newest first)
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

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
      <PopoverContent className="w-80 p-0 max-h-[400px] overflow-hidden">        
        <div className="flex items-center justify-between p-2 border-b border-border">
          <h4 className="text-sm font-medium">Notifications</h4>
          {unreadNotifications.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkAllAsRead}>
              Mark All as Read
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadNotifications.length > 0 && `(${unreadNotifications.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
          <ScrollArea className="h-[250px] overflow-y-auto overflow-x-hidden">
            <div className="p-2">
                {sortedNotifications.length > 0 ? (
                  sortedNotifications.map((notification, index) => {
                    const isLinkValid = notification.link && !notification.link.includes("undefined")
                    return (
                      <div
                        key={notification.notificationId || index}
                        className={`relative flex flex-col mb-2 rounded-md border max-w-full ${notification.isRead ? "border-border" : "border-primary"} bg-card p-2 last:mb-0 hover:bg-accent transition-colors ${isLinkValid ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                        onClick={() => isLinkValid && handleNotificationClick(notification)}
                      >
                        {!notification.isRead && (
                          <Circle className="absolute right-2 top-2 h-2 w-2 fill-primary text-primary" />
                        )}
                        <h4 className="text-sm font-semibold text-card-foreground mb-1 break-words">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2 break-words">{notification.message}</p>
                        <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
                          <span className="text-xs text-muted-foreground/70 truncate max-w-[120px]">
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(notification.notificationId)
                              }}
                            >
                              Mark as Read
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="py-6 text-center text-muted-foreground">No notifications</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread">
            <ScrollArea className="h-[250px]">
              <div className="p-2">
                {unreadNotifications.length > 0 ? (
                  unreadNotifications.map((notification, index) => {
                    const isLinkValid = notification.link && !notification.link.includes("undefined")
                    return (
                      <div
                        key={notification.notificationId || index}
                        className={`relative flex flex-col mb-2 rounded-md border border-primary bg-card p-2 last:mb-0 hover:bg-accent transition-colors ${isLinkValid ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                        onClick={() => isLinkValid && handleNotificationClick(notification)}
                      >
                        <Circle className="absolute right-2 top-2 h-2 w-2 fill-primary text-primary" />
                        <h4 className="text-sm font-semibold text-card-foreground pr-4 mb-1">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-muted-foreground/70">
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(notification.notificationId)
                            }}
                          >
                            Mark as Read
                          </Button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="py-6 text-center text-muted-foreground">No unread notifications</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

export default NotificationDropdown

