"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CollapsibleSidebarProps {
  children: React.ReactNode
  className?: string
  defaultCollapsed?: boolean
  width?: string
  collapsedWidth?: string
  position?: "left" | "right"
  showToggle?: boolean
  onCollapseChange?: (collapsed: boolean) => void
}

export function CollapsibleSidebar({
  children,
  className,
  defaultCollapsed = false,
  width = "16rem",
  collapsedWidth = "4rem",
  position = "left",
  showToggle = true,
  onCollapseChange,
}: CollapsibleSidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setCollapsed(true)
      }
    }

    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)

    return () => {
      window.removeEventListener("resize", checkIsMobile)
    }
  }, [])

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    if (onCollapseChange) {
      onCollapseChange(newCollapsed)
    }
  }

  return (
    <div
      className={cn(
        "relative h-screen border-border bg-white dark:bg-gray-950 transition-all duration-300 ease-in-out",
        position === "left" ? "border-r" : "border-l",
        className,
      )}
      style={{ width: collapsed ? collapsedWidth : width }}
    >
      {showToggle && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-4 z-10 h-8 w-8 rounded-full bg-background shadow-md",
            position === "left" ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2",
          )}
          onClick={toggleCollapsed}
        >
          {position === "left" ? (
            collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )
          ) : collapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      )}

      <ScrollArea className="h-full">
        <div className={cn("transition-all duration-300", collapsed ? "sidebar-collapsed" : "sidebar-expanded")}>
          {children}
        </div>
      </ScrollArea>
    </div>
  )
}

interface SidebarItemProps {
  icon: React.ElementType
  label: string
  active?: boolean
  onClick?: () => void
  collapsed?: boolean
}

export function SidebarItem({ icon: Icon, label, active, onClick, collapsed }: SidebarItemProps) {
  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "w-full h-10 rounded-md transition-colors my-1",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
              onClick={onClick}
            >
              <Icon className="h-5 w-5" />
              <span className="sr-only">{label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start rounded-md transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
      onClick={onClick}
    >
      <Icon className="mr-2 h-5 w-5" />
      {label}
    </Button>
  )
}

interface SidebarSectionProps {
  title: string
  children: React.ReactNode
  collapsed?: boolean
}

export function SidebarSection({ title, children, collapsed }: SidebarSectionProps) {
  if (collapsed) {
    return (
      <div className="px-2 py-2">
        <div className="h-px bg-border my-2" />
        {children}
      </div>
    )
  }

  return (
    <div className="px-3 py-2">
      <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

