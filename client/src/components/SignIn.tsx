'use client'

import { SignIn } from "@clerk/nextjs";
import React from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import Link from "next/link";

const SignInComponent = () => {
  const searchParams = useSearchParams();
  const isCheckoutPage = searchParams.get("showSignUp") !== null;
  const courseId = searchParams.get("id");
  const orgId = searchParams.get("orgId");
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const signUpUrl = isCheckoutPage
    ? `/checkout?step=1&id=${courseId}&orgId=${orgId}&showSignUp=true`
    : "/signup";

  const getRedirectUrl = () => {
    if (isCheckoutPage) {
      return `/checkout?step=2&id=${courseId}&orgId=${orgId}&showSignUp=true`;
    }
    return "/";
  };

  return (
    <div className="relative">
      <SignIn
        signUpUrl={signUpUrl}
        forceRedirectUrl={getRedirectUrl()}
        routing="hash"
        afterSignOutUrl="/"
        appearance={{
          baseTheme: isDarkTheme ? dark : undefined,
          elements: {
            rootBox: "flex justify-center items-center border border-border shadow-md rounded-lg",
            cardBox: "shadow-none",
            card: isDarkTheme ? "bg-card w-full shadow-none" : undefined,
            footer: isDarkTheme
              ? {
                  background: "hsl(var(--card))",
                  padding: "0rem 2.5rem",
                  "& > div > div:nth-child(1)": {
                    background: "hsl(var(--card))",
                  },
                }
              : undefined,
            formFieldLabel: isDarkTheme ? "text-foreground font-normal" : undefined,
            formButtonPrimary: isDarkTheme
              ? "bg-primary text-primary-foreground hover:bg-primary/90 !shadow-none"
              : undefined,
            formFieldInput: isDarkTheme ? "bg-input text-input-foreground !shadow-none" : undefined,
            footerActionText: "text-sm text-muted-foreground",
            footerActionLink: {
              color: "hsl(var(--primary))",
              "&:hover": {
                color: "hsl(var(--primary) / 0.9)",
              },
            },
          },
        }}
      />
      
      <div className="absolute left-0 right-0 mt-2 text-center">
        <Link 
          href="/reset-password" 
          className="text-sm text-muted-foreground hover:underline"
        >
          Forgot Password?
        </Link>
      </div>
    </div>
  );
};

export default SignInComponent;