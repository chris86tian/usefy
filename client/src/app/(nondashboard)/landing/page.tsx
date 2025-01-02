'use client'

import React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetCoursesQuery } from "@/state/api"
import { useRouter } from "next/navigation"
import CourseCardSearch from "@/components/CourseCardSearch"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, ArrowRightCircle, Brain } from 'lucide-react'

const LoadingSkeleton = () => {
  return (
    <div className="space-y-10 p-4 sm:p-6 lg:p-8">
      <div className="space-y-2">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((_, index) => (
          <Skeleton key={index} className="h-48 rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((_, index) => (
          <Skeleton key={index} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

const Landing = () => {
  const router = useRouter()
  const { data: courses, isLoading } = useGetCoursesQuery({})

  const handleCourseClick = (courseId: string) => {
    router.push(`/search?id=${courseId}`, {
      scroll: false,
    })
  }

  if (isLoading) return <LoadingSkeleton />

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-16 sm:px-6 lg:px-8"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            Elevate Your Skills with Our Courses
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-500">
            Discover a world of knowledge and unlock your potential with our diverse range of courses.
          </p>
          <Link href="/search" scroll={false}>
            <Button size="lg" className="bg-gray-100 text-gray-800 rounded-full hover:bg-gray-500">
              Explore Courses <ArrowRightCircle className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[
            { icon: BookOpen, title: "Expert-Led Content", description: "Learn from industry professionals" },
            { icon: Users, title: "Collaborative Learning", description: "Engage with a global community" },
            { icon: Brain, title: "AI Learning Recommendations", description: "Personalized learning experience" },
          ].map((feature, index) => (
            <div key={index} className="rounded-xl bg-gray-900 p-6">
              <feature.icon className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ amount: 0.3, once: true }}
          className="mb-16"
        >
          <h2 className="mb-4 text-3xl font-bold text-white">Popular Courses</h2>
          <p className="mb-8 text-xl text-gray-600">
            From beginner to advanced, in all industries, we have the right courses to propel your career forward.
          </p>

          <div className="mb-8 flex flex-wrap gap-2">
            {["Web Development", "Enterprise IT", "React & Next.js", "JavaScript", "Backend Development"].map(
              (tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800"
                >
                  {tag}
                </span>
              )
            )}
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {courses &&
              courses.slice(0, 4).map((course, index) => (
                <motion.div
                  key={course.courseId}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ amount: 0.4 }}
                >
                  <CourseCardSearch course={course} onClick={() => handleCourseClick(course.courseId)} />
                </motion.div>
              ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Landing

