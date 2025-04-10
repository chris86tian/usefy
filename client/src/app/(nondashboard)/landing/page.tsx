"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CheckCircle,
  Code,
  BookOpen,
  Users,
  Shield,
  BarChart3,
  ChevronRight,
  Youtube,
  Mail,
} from "lucide-react"
import Image from "next/image"
import Pricing from "./_components/Pricing"
import { Separator } from "@/components/ui/separator"
import Testimonials from "./_components/Testimonials"
import Features from "./_components/Features"
import { motion } from "framer-motion"

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  }

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const buttonHover = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.05,
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
      {/* Hero Section */}
      <section className="py-20 md:py-28 relative z-10">
        <div className="container flex flex-col items-center text-center">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            AI-Powered Learning Platform for Your Organization
          </motion.h1>
          
          <motion.p 
            className="mt-6 text-xl text-muted-foreground max-w-2xl"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.2 }}
          >
            Create, manage, and deliver interactive courses with AI-generated content. Transform any video into
            a complete learning experience
          </motion.p>
          
          <motion.div
            initial="rest"
            whileHover="hover"
            animate="rest"
            variants={buttonHover}
            className="mt-10"
          >
            <Button className="h-12 px-12 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600/90 hover:to-blue-600 shadow-lg transition-all duration-300">
              <motion.span 
                className="flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </motion.span>
            </Button>
          </motion.div>
        </div>
      </section>

      <motion.div 
        className="flex justify-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <div className="relative w-full max-w-4xl aspect-video rounded-lg overflow-hidden border bg-background shadow-xl">
          <Image src="/landing-image.png" width={1280} height={720} alt="Demo" className="transition-transform duration-700 hover:scale-105" />
        </div>
      </motion.div>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 relative z-10">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
            <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
              From video link to complete course in minutes
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {/* Step 1 */}
            <motion.div 
              className="flex flex-col items-center text-center p-6 rounded-lg bg-white/50 dark:bg-blue-950/10 hover:bg-blue-500/5 dark:hover:bg-blue-900/20 shadow-sm transition-colors duration-300"
              variants={fadeIn}
            >
              <motion.div 
                className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-5"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-xl font-bold text-blue-500 dark:text-blue-400">1</span>
              </motion.div>
              <h3 className="text-xl font-bold">Paste video link</h3>
              <p className="mt-2 text-muted-foreground">
                Simply paste any educational video URL into our platform.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              className="flex flex-col items-center text-center p-6 rounded-lg bg-white/50 dark:bg-blue-950/10 hover:bg-blue-500/5 dark:hover:bg-blue-900/20 shadow-sm transition-colors duration-300"
              variants={fadeIn}
            >
              <motion.div 
                className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-5"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-xl font-bold text-blue-500 dark:text-blue-400">2</span>
              </motion.div>
              <h3 className="text-xl font-bold">AI Generates Course</h3>
              <p className="mt-2 text-muted-foreground">
                Our AI analyzes the video and creates structured course content with quizzes and assignments.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              className="flex flex-col items-center text-center p-6 rounded-lg bg-white/50 dark:bg-blue-950/10 hover:bg-blue-500/5 dark:hover:bg-blue-900/20 shadow-sm transition-colors duration-300"
              variants={fadeIn}
            >
              <motion.div 
                className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-5"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-xl font-bold text-blue-500 dark:text-blue-400">3</span>
              </motion.div>
              <h3 className="text-xl font-bold">Publish & Share</h3>
              <p className="mt-2 text-muted-foreground">
                Review, customize, and publish your course to your organization or cohorts.
              </p>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* Features Section */}
      <Features />

      {/* Testimonials */}

      {/* <Pricing /> */}

      {/* CTA */}
    </div>
  )
}