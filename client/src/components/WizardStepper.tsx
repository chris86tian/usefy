import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import React from "react"

interface WizardStepperProps {
  currentStep: number
}

const WizardStepper = ({ currentStep }: WizardStepperProps) => {
  return (
    <div className="flex justify-center items-center py-6">
      <div className="flex items-center">
        {[1, 2, 3].map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={cn("w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors", {
                  "bg-primary border-primary text-primary-foreground":
                    currentStep > step || (currentStep === 3 && step === 3),
                  "border-primary text-primary": currentStep === step && step !== 3,
                  "border-muted-foreground text-muted-foreground": currentStep < step,
                })}
              >
                {currentStep > step || (currentStep === 3 && step === 3) ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{step}</span>
                )}
              </div>
              <p
                className={cn("mt-2 text-sm font-medium", {
                  "text-foreground": currentStep >= step,
                  "text-muted-foreground": currentStep < step,
                })}
              >
                {step === 1 && "Details"}
                {step === 2 && "Enrollment"}
                {step === 3 && "Completion"}
              </p>
            </div>
            {index < 2 && (
              <div
                className={cn("w-16 h-0.5 mx-2", {
                  "bg-primary": currentStep > step,
                  "bg-muted-foreground": currentStep <= step,
                })}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default WizardStepper

