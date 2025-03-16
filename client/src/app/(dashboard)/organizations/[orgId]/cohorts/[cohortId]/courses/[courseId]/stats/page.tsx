'use client';

import Header from '@/components/Header';
import CourseStats from './_components/CourseStats';
import UserList from './_components/UserList';
import UserDetails from './_components/UserDetails';
import { useState } from 'react';
import { User } from '@clerk/nextjs/server';
import FeedbackList from '../chapters/[chapterId]/adaptive-quiz/FeedbackList';
import { useParams } from 'next/navigation';

export default function CourseStatsPage() {
    const { courseId } = useParams() as { courseId: string };
    const [selectedUser, setSelectedUser] = useState<User>();

    return (
        <>
            <Header title="Course Stats" subtitle="View statistics for your course" />
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-1/4">
                    <UserList 
                        courseId={courseId} 
                        selectedUser={selectedUser}
                        onUserSelect={setSelectedUser}
                    />
                </div>
                <div className="w-full lg:w-2/3 space-y-8">
                    <CourseStats courseId={courseId} />
                    {selectedUser && (
                        <UserDetails 
                            user={selectedUser}
                            courseId={courseId}
                        />
                    )}
                </div>
            </div>
            <Header title="Feedback Submissions" subtitle="View feedback submissions for your course" />
            <FeedbackList courseId={courseId} />
        </>
    );
}
