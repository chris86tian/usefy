"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  notifications: UserNotification[]
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, notifications }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                    <div key={notification.id} className="bg-slate-800 p-2 mb-2 rounded-sm last:mb-0">
                        <h4 className="text-sm font-semibold">{notification.title}</h4>
                        <p className="text-sm text-gray-500">{notification.message}</p>
                        <span className="text-xs text-gray-400">{new Date(notification.timestamp).toLocaleString()}</span>
                    </div>
                    ))
                    ) : (
                    <p className="flex justify-center items-center h-full">No notifications</p>
                )}
            </ScrollArea>
        </DialogContent>
        </Dialog>
    )
}

export default NotificationModal

