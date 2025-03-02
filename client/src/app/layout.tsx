import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Suspense } from "react";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/theme-provider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Usefy",
  description:
    "Usefy is an AI platform for organizations to create and manage courses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.className}`}>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <Providers>
              <Suspense fallback={null}>
                <Navbar />
                <ConvexClientProvider>{children}</ConvexClientProvider>
                <Toaster />
              </Suspense>
              <Toaster richColors closeButton />
            </Providers>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
