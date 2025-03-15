"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface NotFoundProps {
  message: string
}

const NotFound: React.FC<NotFoundProps> = ({ message }) => {
  const router = useRouter()

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-4xl font-bold text-muted-foreground">404 - Not Found</h1>
      <p className="mt-4 text-lg text-muted-foreground">{message}</p>
      <Button onClick={handleGoBack} className="mt-6">
        Go Back
      </Button>
    </div>
  )
}

export default NotFound
