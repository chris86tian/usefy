'use client'

import { Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useUser } from '@clerk/nextjs'

const EmptyCourse = () => {
  const router = useRouter()
  const { user } = useUser()

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Settings size={64} className="text-gray-400" />
      <h2 className="text-2xl font-semibold mt-6">
        This section is still being prepared.
      </h2>
      <p className="text-gray-300 mt-2 text-center">
        Check back soon!
      </p>
      {user?.publicMetadata.userType === 'teacher' ? (
        <Button
          onClick={() => router.push('/teacher/courses')}
          className="bg-gray-600 hover:bg-gray-700 mt-4"
        >
          Back to Courses
        </Button>
      ) : (
        <Button
          onClick={() => router.push('/user/courses')}
          className="bg-gray-600 hover:bg-gray-700 mt-4"
        >
          Back to Courses
        </Button>
      )}
    </div>
  )
}

export default EmptyCourse
