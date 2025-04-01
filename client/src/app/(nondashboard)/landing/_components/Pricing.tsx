import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const Pricing = () => {
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that&apos;s right for your organization
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {/* Starter Plan */}
      <div className="flex flex-col p-6 bg-background rounded-lg border">
        <div className="mb-5">
          <h3 className="text-xl font-bold">Starter</h3>
          <div className="mt-4 flex items-baseline">
            <span className="text-4xl font-bold">$99</span>
            <span className="ml-1 text-muted-foreground">/month</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">For small teams and individual instructors</p>
        </div>
        <ul className="mt-4 space-y-3 flex-1">
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">Up to 3 organizations</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">50 learners per organization</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">10 AI course generations/month</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">Basic analytics</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">Email support</span>
          </li>
        </ul>
        <Button className="mt-6" variant="outline">
          Get Started
        </Button>
      </div>

      {/* Pro Plan */}
      <div className="flex flex-col p-6 bg-background rounded-lg border border-primary relative">
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
          Most Popular
        </div>
        <div className="mb-5">
          <h3 className="text-xl font-bold">Professional</h3>
          <div className="mt-4 flex items-baseline">
            <span className="text-4xl font-bold">$299</span>
            <span className="ml-1 text-muted-foreground">/month</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">For growing educational institutions</p>
        </div>
        <ul className="mt-4 space-y-3 flex-1">
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">Up to 10 organizations</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">200 learners per organization</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">50 AI course generations/month</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">Advanced analytics</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">Priority support</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">Custom branding</span>
          </li>
        </ul>
        <Button className="mt-6">Get Started</Button>
      </div>

      {/* Enterprise Plan */}
      <div className="flex flex-col p-6 bg-background rounded-lg border">
        <div className="mb-5">
          <h3 className="text-xl font-bold">Enterprise</h3>
          <div className="mt-4 flex items-baseline">
            <span className="text-4xl font-bold">Custom</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">For large institutions and organizations</p>
        </div>
        <ul className="mt-4 space-y-3 flex-1">
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">Unlimited organizations</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">Unlimited learners</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">Unlimited AI course generations</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">Enterprise-grade analytics</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">Dedicated account manager</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">API access</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm">SSO integration</span>
          </li>
        </ul>
        <Button className="mt-6" variant="outline">
          Contact Sales
        </Button>
      </div>
    </div>
  </div>
</section>
)
}

export default Pricing


