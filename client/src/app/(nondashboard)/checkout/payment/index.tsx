import React from "react";
import StripeProvider from "./StripeProvider";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useCheckoutNavigation } from "@/hooks/useCheckoutNavigation";
import { useCurrentCourse } from "@/hooks/useCurrentCourse";
import { useClerk, useUser } from "@clerk/nextjs";
import CoursePreview from "@/components/CoursePreview";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateTransactionMutation } from "@/state/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const PaymentPageContent = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [createTransaction] = useCreateTransactionMutation();
  const { navigateToStep } = useCheckoutNavigation();
  const { course, courseId } = useCurrentCourse();
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleFreeEnrollment = async () => {
    try {
      const transactionData: Partial<Transaction> = {
        transactionId: "free-enrollment",
        userId: user?.id,
        courseId: courseId,
        paymentProvider: undefined,
        amount: 0,
      };

      await createTransaction(transactionData);

      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user?.emailAddresses[0].emailAddress,
            name: user?.fullName,
            courseName: course?.title,
          }),
        });
        toast.success("Enrolled in free course! Email notification sent.");
      } catch (error) {
        console.error("Failed to send email:", error);
        toast.error("Enrolled successfully, but failed to send email.");
      }

      router.push(`/user/courses`);
    } catch (error) {
      console.error("Failed to enroll in free course:", error);
      toast.error("Failed to enroll. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe service is not available");
      return;
    }

    const baseUrl = process.env.NEXT_ENV === "production" ? process.env.NEXT_PUBLIC_CLIENT_URL : process.env.NEXT_PUBLIC_LOCAL_URL;

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${baseUrl}/checkout?step=3&id=${courseId}`,
      },
      redirect: "if_required",
    });

    if (result.paymentIntent?.status === "succeeded") {
      const transactionData: Partial<Transaction> = {
        transactionId: result.paymentIntent.id,
        userId: user?.id,
        courseId: courseId,
        paymentProvider: "stripe",
        amount: course?.price || 0,
      };

      await createTransaction(transactionData);

      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user?.emailAddresses[0].emailAddress,
            name: user?.fullName,
            courseName: course?.title,
            transactionId: result.paymentIntent.id,
          }),
        });
        toast.success("Purchase successful! Email notification sent.");
      } catch (error) {
        console.error("Failed to send email:", error);
        toast.error("Purchase successful, but failed to send email.");
      }

      router.push(`/user/courses`);
    } else {
      toast.error("Payment failed. Please try again.");
    }
  };

  const handleSignOutAndNavigate = async () => {
    await signOut();
    navigateToStep(1);
  };

  if (!course) return null;

  return (
    <div className="payment">
      <div className="payment__container">
        {/* Order Summary */}
        <div className="payment__preview">
          <CoursePreview course={course} />
        </div>

        {/* Payment Form or Free Enrollment */}
        {course?.price === 0 ? (
          <div className="payment__form-container">
            <div className="payment__content">
              <h1 className="payment__title">Enrollment</h1>
              <p className="payment__subtitle">
                Enroll in this course for free.
              </p>
              {user?.id && course.enrollments?.some(enrollment => enrollment.userId === user.id) ? (
                <Button
                  className="payment__submit"
                  disabled
                  type="button"
                >
                  Enrolled
                </Button>
              ) : (
                <Button
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={handleFreeEnrollment}
                  type="button"
                >
                  Enroll for Free
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="payment__form-container">
            <form
              id="payment-form"
              onSubmit={handleSubmit}
              className="payment__form"
            >
              <div className="payment__content">
                <h1 className="payment__title">Checkout</h1>
                <p className="payment__subtitle">
                  Fill out the payment details below to complete your purchase.
                </p>

                <div className="payment__method">
                  <h3 className="payment__method-title">Payment Method</h3>

                  <div className="payment__card-container">
                    <div className="payment__card-header">
                      <CreditCard size={24} />
                      <span>Credit/Debit Card</span>
                    </div>
                    <div className="payment__card-element">
                      <PaymentElement />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="payment__actions">
        <Button
          className="hover:bg-white-50/10"
          onClick={handleSignOutAndNavigate}
          variant="outline"
          type="button"
        >
          Switch Account
        </Button>

        {(course?.price ?? 0) > 0 ? (
          <Button
            form="payment-form"
            type="submit"
            className="payment__submit"
            disabled={!stripe || !elements}
          >
            Pay Now
          </Button>
        ) : null}
      </div>
    </div>
  );
};

const PaymentPage = () => (
  <StripeProvider>
    <PaymentPageContent />
  </StripeProvider>
);

export default PaymentPage;
