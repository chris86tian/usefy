"use client"

import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs"
import { BookOpen, School, Home, Menu, Sun, Moon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import NotificationDropdown from "@/components/NotificationDropdown"
import { useGetNotificationsQuery } from "@/state/api"
import { OrganizationsDropdown } from "./OrganizationsDropdown"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"

interface NavbarProps {
  isDashboard?: boolean
}

const Navbar = ({ isDashboard = false }: NavbarProps) => {
  const router = useRouter()
  const { data: notifications = null } = useGetNotificationsQuery(undefined, { skip: !isDashboard })
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  if (pathname.startsWith("/organizations")) isDashboard = true

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <nav className="border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {isDashboard && (
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open sidebar">
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {!isDashboard && 
            <Link href="/" className="flex items-center gap-2 font-bold text-xl dark:text-white" scroll={false}>
              usefy.
            </Link>
          }

          {!isDashboard && (
            <div className="hidden md:flex items-center gap-4 ml-6">
              <Link
                href="/explore"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                scroll={false}
              >
                <School className="h-4 w-4" />
                <span>Browse Categories</span>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isDashboard && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              <Home className="h-5 w-5" />
              <span className="sr-only">Home</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <SignedIn>
            <div className="flex items-center gap-4">
              {!isDashboard && (
                <OrganizationsDropdown />
              )}

              {notifications && <NotificationDropdown notifications={notifications} />}

              <UserButton />
            </div>
          </SignedIn>

          <SignedOut>
            <div className="flex items-center gap-2">
              <Link href="/signin" scroll={false}>
                <Button variant="outline" className="text-blue-500 border-blue-500 dark:text-blue-400 dark:border-blue-400">
                  Log In
                </Button>
              </Link>
              <Link href="/signup" scroll={false}>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">Sign Up</Button>
              </Link>
            </div>
          </SignedOut>
        </div>
      </div>

      {/* Mobile menu for non-dashboard view */}
      {!isDashboard && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 py-2 px-4">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/search"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors py-2"
              scroll={false}
            >
              <BookOpen className="h-4 w-4" />
              <span>Explore Courses</span>
            </Link>

            <Link
              href="/explore"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors py-2"
              scroll={false}
            >
              <School className="h-4 w-4" />
              <span>Browse Categories</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar