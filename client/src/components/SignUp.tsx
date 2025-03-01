"use client";

import { SignUp, useUser } from "@clerk/nextjs";
import React from "react";
import { dark } from "@clerk/themes";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";

const SignUpComponent = () => {
  const searchParams = useSearchParams();
  const isCheckoutPage = searchParams.get("showSignUp") !== null;
  const courseId = searchParams.get("id");
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"

  const signInUrl = isCheckoutPage
    ? `/checkout?step=1&id=${courseId}&showSignUp=false`
    : "/signin";

  const getRedirectUrl = () => {
    if (isCheckoutPage) {
      return `/checkout?step=2&id=${courseId}&showSignUp=false`;
    }

    return "/";
  };

  return (
    <SignUp
      signInUrl={signInUrl}
      forceRedirectUrl={getRedirectUrl()}
      routing="hash"
      afterSignOutUrl="/"
      appearance={{
        baseTheme: isDarkTheme ? dark : undefined,
        elements: {
        rootBox: "flex justify-center items-center border border-border shadow-md rounded-lg",
        cardBox: "shadow-none",
        card: isDarkTheme ? "bg-card w-full shadow-none" : undefined,
        footer: isDarkTheme ? {
          background: "hsl(var(--card))",
          padding: "0rem 2.5rem",
          "& > div > div:nth-child(1)": {
            background: "hsl(var(--card))",
          },
        } : undefined,
        formFieldLabel: isDarkTheme ? "text-foreground font-normal" : undefined,
        formButtonPrimary: isDarkTheme 
          ? "bg-primary text-primary-foreground hover:bg-primary/90 !shadow-none" 
          : undefined,
        formFieldInput: isDarkTheme 
          ? "bg-input text-input-foreground !shadow-none" 
          : undefined,
        footerActionLink: isDarkTheme 
          ? "text-primary hover:text-primary/90" 
          : undefined,
        },
      }}
    />
  );
};

export default SignUpComponent;