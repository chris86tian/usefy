"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { useParams, useRouter } from "next/navigation"
import { Home, Clock } from "lucide-react"

const Course = () => {
  const { orgId, cohortId } = useParams()
  const router = useRouter()

  const handleBackToCourses = () => {
    router.push(`/organizations/${orgId}/cohorts/${cohortId}`)
  }

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-4">
      <Clock className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-3xl font-semibold">
        This Course is Still Being Prepared
      </h2>
      <p>
        We are working hard to get this course ready for you. Please check back soon!
      </p>
      <Button onClick={handleBackToCourses}>
        <Home className="h-4 w-4 mr-2" />
        Back to Courses
      </Button>
    </div>
  )
}

export default Course