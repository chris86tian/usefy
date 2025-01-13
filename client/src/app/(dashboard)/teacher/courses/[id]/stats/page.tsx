'use client';

import Header from '@/components/Header'
import CourseStats from './_components/CourseStats'
import UserList from './_components/UserList'
import { usePathname } from 'next/navigation'

export default function CourseStatsPage() {
    const pathname = usePathname()
    const courseId = pathname.split('/')[3]

    return (
        <div className="container mx-auto p-4">
            <Header title="Course Stats" subtitle="View statistics for your course" />
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-2/3">
                    <CourseStats courseId={courseId} />
                </div>
                <div className="w-full lg:w-1/3">
                    <UserList courseId={courseId} />
                </div>
            </div>
        </div>
    )
}

