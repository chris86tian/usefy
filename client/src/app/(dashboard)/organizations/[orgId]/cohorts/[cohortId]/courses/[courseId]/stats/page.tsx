'use client';

import Header from '@/components/Header';
import CourseStats from './_components/CourseStats';
import UserList from './_components/UserList';
import UserStatsModal from './_components/UserStatsModal';
import { useState } from 'react';
import { User } from '@clerk/nextjs/server';
import FeedbackList from '../chapters/[chapterId]/adaptive-quiz/FeedbackList';
import { useParams } from 'next/navigation';

export default function CourseStatsPage() {
    const { courseId } = useParams() as { courseId: string };
    const [selectedUser, setSelectedUser] = useState<User>();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    return (
        <>
            <Header title="Course Stats" subtitle="View statistics for your course" />
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-1/4">
                    <UserList 
                        courseId={courseId} 
                        selectedUser={selectedUser}
                        onUserSelect={handleUserSelect}
                    />
                </div>
                <div className="w-full lg:w-2/3">
                    <CourseStats courseId={courseId} />
                </div>
            </div>
            <Header title="Feedback Submissions" subtitle="View feedback submissions for your course" />
            <FeedbackList courseId={courseId} />
            
            {selectedUser && (
                <UserStatsModal
                    user={selectedUser}
                    courseId={courseId}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
}
