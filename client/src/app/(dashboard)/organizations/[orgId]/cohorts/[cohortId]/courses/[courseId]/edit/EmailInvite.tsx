"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus, Mail } from 'lucide-react'
import { toast } from "sonner"
import { getUserName } from "@/lib/utils"
import { User } from "@clerk/nextjs/server"

interface InstructorEmailInputProps {
  existingInstructors: User[]
  onAddInstructor: (email: string) => Promise<void>
  onRemoveInstructor: (instructorId: string) => Promise<void>
}

const InstructorEmailInput = ({ 
  existingInstructors, 
  onAddInstructor, 
  onRemoveInstructor 
}: InstructorEmailInputProps) => {
  const [email, setEmail] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleAddInstructor = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address")
      return
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address")
      return
    }

    if (existingInstructors.some(instructor => instructor.emailAddresses[0].emailAddress.toLowerCase() === email.toLowerCase())) {
      toast.error("This instructor is already added to the course")
      return
    }

    setIsAdding(true)
    try {
      await onAddInstructor(email)
      setEmail("")
      toast.success("Instructor invitation sent successfully")
    } catch (error) {
      console.error("Failed to add instructor:", error)
      toast.error("Failed to add instructor. Please try again.")
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveInstructor = async (instructorId: string) => {
    setIsRemoving(instructorId)
    try {
      await onRemoveInstructor(instructorId)
      toast.success("Instructor removed successfully")
    } catch (error) {
      console.error("Failed to remove instructor:", error)
      toast.error("Failed to remove instructor. Please try again.")
    } finally {
      setIsRemoving(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Course Instructors
        </label>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {existingInstructors.length > 0 ? (
            existingInstructors.map((instructor) => (
              <div 
                key={instructor.id} 
                className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-full text-sm"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>{getUserName(instructor)}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveInstructor(instructor.id)}
                  disabled={isRemoving === instructor.id}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none"
                >
                  {isRemoving === instructor.id ? (
                    <div className="h-3.5 w-3.5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No instructors added yet</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter instructor email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Button 
          type="button" 
          onClick={handleAddInstructor}
          disabled={isAdding || !email.trim()}
          variant="outline"
          className="border-gray-300 dark:border-gray-600 text-blue-700 dark:text-blue-400 group"
        >
          {isAdding ? (
            <div className="h-4 w-4 border-2 border-blue-700 dark:border-blue-400 border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add Instructor
        </Button>
      </div>
    </div>
  )
}

export default InstructorEmailInput
