"use client"

import CoursePreview from "@/components/CoursePreview"
import { useCurrentCourse } from "@/hooks/useCurrentCourse"
import { useSearchParams } from "next/navigation"
import SignUpComponent from "@/components/SignUp"
import SignInComponent from "@/components/SignIn"
import { Spinner } from "@/components/ui/Spinner"

const CheckoutDetailsPage = () => {
  const { course: selectedCourse, isLoading, isError } = useCurrentCourse()
  const searchParams = useSearchParams()
  const showSignUp = searchParams.get("showSignUp") === "true"

  if (isLoading) return <Spinner />
  if (isError) return <div className="text-center text-red-500">Failed to fetch course data</div>
  if (!selectedCourse) return <div className="text-center">Course not found</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <CoursePreview course={selectedCourse} />
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg shadow-md p-6">
            {showSignUp ? <SignUpComponent /> : <SignInComponent />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutDetailsPage

