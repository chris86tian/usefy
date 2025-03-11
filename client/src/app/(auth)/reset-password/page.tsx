'use client'
import React, { useEffect, useState } from 'react'
import { useAuth, useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Mail, ShieldCheck, InfoIcon, ArrowLeftIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Separator } from "@/components/ui/separator"

const ForgotPasswordPage = () => {    
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [successfulCreation, setSuccessfulCreation] = useState(false)
  const [secondFactor, setSecondFactor] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { isLoaded, signIn, setActive } = useSignIn()

  useEffect(() => {
    if (isSignedIn) {
      router.push('/')
    }
  }, [isSignedIn, router])

  if (!isLoaded) {
    return null
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      await signIn?.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })
      setSuccessfulCreation(true)
      setEmailSent(true)
    } catch (err: any) {
      setError(err.errors[0].longMessage)
    } finally {
      setIsLoading(false)
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signIn?.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      })

      if (result?.status === 'needs_second_factor') {
        setSecondFactor(true)
      } else if (result?.status === 'complete') {
        if (setActive) {
          await setActive({ session: result.createdSessionId })
        }
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.errors[0].longMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const backToEmailForm = () => {
    setSuccessfulCreation(false)
    setEmailSent(false)
    setError('')
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {!successfulCreation ? (
              <>
                Reset Your Password
              </>
            ) : (
              <>
                <ShieldCheck className="h-6 w-6" /> Set New Password
              </>
            )}
          </CardTitle>
          <CardDescription>
            {!successfulCreation 
              ? "Enter your email to receive a password reset code" 
              : `Enter the verification code sent to ${email} and create a new password`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent && successfulCreation && (
            <Alert className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-800">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Check your inbox</AlertTitle>
              <AlertDescription>
                We&apos;ve sent a verification code to <strong>{email}</strong>. 
                Please check your email and enter the code below to reset your password.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={!successfulCreation ? create : reset}>
            {!successfulCreation ? (
              <>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input 
                        id="email"
                        type="email" 
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Code"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input 
                      id="code"
                      type="text" 
                      placeholder="Enter verification code from email"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The code was sent to your email address. It may take a few minutes to arrive.
                    </p>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="password">New Password</Label>
                    <Input 
                      id="password"
                      type="password" 
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Create a strong password with at least 8 characters.
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </>
            )}
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {secondFactor && (
            <Alert className="mt-4">
              <AlertTitle>Two-Factor Authentication</AlertTitle>
              <AlertDescription>
                Additional verification is required. Please contact support.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        {successfulCreation && (
          <CardFooter className="flex justify-between pt-0">
            <Button 
              variant="ghost" 
              className="flex items-center gap-1 px-0" 
              onClick={backToEmailForm}
            >
              <ArrowLeftIcon className="h-4 w-4" /> Back to email form
            </Button>
            <Button 
              variant="link" 
              className="text-sm" 
              onClick={() => setEmailSent(true)}
            >
              Didn&apos;t receive the code? Resend
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

export default ForgotPasswordPage