"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"

const CompletionPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="bg-green-100 rounded-full p-4">
            <Check className="w-16 h-16 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">COMPLETED</h1>
        <p className="text-xl">🎉 You have made a course purchase successfully! 🎉</p>
      </div>
      <div className="mt-8">
        <p>
          Need help? Contact our{" "}
          <Button variant="link" asChild className="p-0 h-auto font-normal">
            <a href="mailto:support@example.com">customer support</a>
          </Button>
          .
        </p>
      </div>
      <div className="mt-8">
        <Button asChild>
          <Link href="/user/courses" scroll={false}>
            Go to Courses
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default CompletionPage

