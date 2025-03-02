"use client"

import WizardStepper from "@/components/WizardStepper"
import { useCheckoutNavigation } from "@/hooks/useCheckoutNavigation"
import { useUser } from "@clerk/nextjs"
import CheckoutDetailsPage from "./details"
import PaymentPage from "./payment"
import CompletionPage from "./completion"
import { Spinner } from "@/components/ui/Spinner"

const CheckoutWizard = () => {
  const { isLoaded } = useUser()
  const { checkoutStep } = useCheckoutNavigation()

  if (!isLoaded) return <Spinner />

  const renderStep = () => {
    switch (checkoutStep) {
      case 1:
        return <CheckoutDetailsPage />
      case 2:
        return <PaymentPage/>
      case 3:
        return <CompletionPage />
      default:
        return <CheckoutDetailsPage />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <WizardStepper currentStep={checkoutStep} />
        <div className="mt-8">{renderStep()}</div>
      </div>
    </div>
  )
}

export default CheckoutWizard

