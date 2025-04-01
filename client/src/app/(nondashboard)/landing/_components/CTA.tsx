"use client"

import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

const CTA = () => {
  
    return (
        <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto bg-primary text-primary-foreground rounded-lg p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to transform your educational content?</h2>
            <p className="mt-4 text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of educators who are using our platform to create engaging, interactive courses.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary">
                Schedule a Demo
              </Button>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Start Free Trial
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  export default CTA
