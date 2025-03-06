"use client"

import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs"
import { Home, Menu, Sun, Moon, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import NotificationDropdown from "@/components/NotificationDropdown"
import { useGetNotificationsQuery } from "@/state/api"
import { OrganizationsDropdown } from "./OrganizationsDropdown"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"

interface NavbarProps {
  isDashboard?: boolean
}

const Navbar = ({ isDashboard = false }: NavbarProps) => {
  const pathname = usePathname()
  if (pathname.startsWith("/organizations")) isDashboard = true
  const { data: notifications = null } = useGetNotificationsQuery(undefined, { skip: !isDashboard })
  const { theme, setTheme } = useTheme()

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

          <Link href="/" className="flex items-center gap-2 font-bold text-xl dark:text-white" scroll={false}>
            usefy.
          </Link>
        
          {/* {!isDashboard && (
            <div className="hidden md:flex items-center gap-4 ml-6">
              <Link
                href="/explore"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                scroll={false}
              >
                <School className="h-4 w-4" />
                <span>Browse</span>
              </Link>
            </div>
          )} */}
        </div>

        <div className="flex items-center gap-4">
          {/* Desktop navigation items */}
          <div className="hidden md:flex items-center gap-4">
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
                <OrganizationsDropdown />
                <NotificationDropdown notifications={notifications || []} />
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

          {/* Mobile navigation items */}
          <div className="md:hidden flex items-center gap-3">
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
              <NotificationDropdown notifications={notifications || []} />
              <UserButton />
            </SignedIn>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-1" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-4/5 bg-white dark:bg-gray-900 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold dark:text-white">usefy.</h2>
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon" aria-label="Close" />
                      </SheetClose>
                    </div>
                  </div>
                  
                  {/* <div className="flex-1 overflow-auto py-4">
                    <div className="space-y-4 px-4">
                      <Link
                        href="/explore"
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                        scroll={false}
                      >
                        <School className="h-5 w-5" />
                        <span>Browse</span>
                      </Link>
                    </div>
                  </div> */}
                  
                  <SignedOut>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                      <div className="grid grid-cols-2 gap-3">
                        <Link href="/signin" className="w-full" scroll={false}>
                          <Button variant="outline" className="w-full text-blue-500 border-blue-500 dark:text-blue-400 dark:border-blue-400">
                            Log In
                          </Button>
                        </Link>
                        <Link href="/signup" className="w-full" scroll={false}>
                          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                            Sign Up
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </SignedOut>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar