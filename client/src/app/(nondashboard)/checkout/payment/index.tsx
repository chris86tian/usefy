"use client"

import type React from "react"
import StripeProvider from "./StripeProvider"
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { useCheckoutNavigation } from "@/hooks/useCheckoutNavigation"
import { useCurrentCourse } from "@/hooks/useCurrentCourse"
import { useClerk, useUser } from "@clerk/nextjs"
import CoursePreview from "@/components/CoursePreview"
import { CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCreateTransactionMutation } from "@/state/api"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const PaymentPageContent = () => {
  const stripe = useStripe()
  const elements = useElements()
  const [createTransaction] = useCreateTransactionMutation()
  const { navigateToStep, orgId } = useCheckoutNavigation()
  const { course, courseId } = useCurrentCourse()
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const handleFreeEnrollment = async () => {
    try {
      const transactionData: Partial<Transaction> = {
        transactionId: "free-enrollment",
        userId: user?.id,
        courseId: courseId,
        paymentProvider: undefined,
        amount: 0,
      }

      await createTransaction(transactionData)

      router.push(`/organizations/${orgId}/courses`)
      router.refresh()
    } catch (error) {
      console.error("Failed to enroll in free course:", error)
      toast.error("Failed to enroll. Please try again.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      toast.error("Stripe service is not available")
      return
    }

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/checkout?step=3&id=${courseId}`,
      },
      redirect: "if_required",
    })

    if (result.paymentIntent?.status === "succeeded") {
      const transactionData: Partial<Transaction> = {
        transactionId: result.paymentIntent.id,
        userId: user?.id,
        courseId: courseId,
        paymentProvider: "stripe",
        amount: course?.price || 0,
      }

      await createTransaction(transactionData)
      router.push(`/organizations/${orgId}/courses`)
    } else {
      toast.error("Payment failed. Please try again.")
    }
  }

  const handleSignOutAndNavigate = async () => {
    await signOut()
    navigateToStep(1)
  }

  if (!course) return null

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Course Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <CoursePreview course={course} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{course?.price === 0 ? "Enrollment" : "Checkout"}</CardTitle>
          </CardHeader>
          <CardContent>
            {course?.price === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Enroll in this course for free.</p>
                {user?.id && course.enrollments?.some((enrollment) => enrollment.userId === user.id) ? (
                  <Button disabled>Enrolled</Button>
                ) : (
                  <Button onClick={handleFreeEnrollment}>Enroll for Free</Button>
                )}
              </div>
            ) : (
              <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Fill out the payment details below to complete your purchase.
                </p>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Payment Method</h3>
                  <div className="border rounded-md p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <CreditCard size={20} />
                      <span className="text-sm font-medium">Credit/Debit Card</span>
                    </div>
                    <PaymentElement />
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleSignOutAndNavigate}>
          Switch Account
        </Button>
        {(course?.price ?? 0) > 0 && (
          <Button form="payment-form" type="submit" disabled={!stripe || !elements}>
            Pay Now
          </Button>
        )}
      </div>
    </div>
  )
}

const PaymentPage = () => (
  <StripeProvider>
    <PaymentPageContent />
  </StripeProvider>
)

export default PaymentPage

