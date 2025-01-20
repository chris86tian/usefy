'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { useCreateCommentMutation, useCreateReplyMutation, useGetChapterCommentsQuery } from '@/state/api';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@clerk/nextjs';

interface CourseCommentsProps {
  courseId: string;
  sectionId: string;
  chapterId: string;
}

export function CourseComments({ courseId, sectionId, chapterId }: CourseCommentsProps) {
  const { user } = useUser();
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [showReplyInput, setShowReplyInput] = useState<{ [key: string]: boolean }>({});

  const { data: comments = [], isLoading, refetch } = useGetChapterCommentsQuery({
    courseId,
    sectionId,
    chapterId,
  });

  console.log('comments:', comments);
  
  const [createComment] = useCreateCommentMutation();
  const [createReply] = useCreateReplyMutation();

  const getUsername = () => {
    if (!user) return 'Anonymous';
    return (
      user.username ||
      user.fullName ||
      user.emailAddresses?.[0]?.emailAddress ||
      'Anonymous'
    );
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const chapterComment = {
      id: uuidv4(),
      userId: user?.id as string,
      username: getUsername(),
      content: newComment,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    try {
        await createComment({
            courseId,
            sectionId,
            chapterId,
            comment: chapterComment,
        }).unwrap();

        setNewComment('');
        refetch();
    } catch (error) {
        console.error('Failed to create comment:', error);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    const replyContent = replyText[commentId]?.trim();
    if (!replyContent) return;

    const reply = {
        id: uuidv4(),
        userId: user?.id as string,
        username: getUsername(),
        content: replyContent,
        createdAt: new Date().toISOString(),
    };

    try {
      await createReply({
        courseId,
        sectionId,
        chapterId,
        commentId,
        reply,
      }).unwrap();

      setReplyText((prev) => ({ ...prev, [commentId]: '' }));
      setShowReplyInput((prev) => ({ ...prev, [commentId]: false }));
      refetch();

      console.log('Reply created:', replyContent);
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  const toggleReplyInput = (commentId: string) => {
    setShowReplyInput((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  return (
    <Card className="w-full bg-zinc-900">
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitComment} className="flex mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1"
          />
          <Button type="submit" className="ml-4 bg-zinc-700 hover:bg-zinc-600">
            <Send className="h-4 w-4" />
          </Button>
        </form>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="text-center py-4">Loading comments...</div>
          ) : (
            comments.map((comment: ChapterComment) => (
              <div key={comment.id} className="mb-6">
                <div className="flex items-start space-x-2">
                  <Avatar className="border-2 border-gray-500">
                    <AvatarFallback>{comment.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{comment.username}</p>
                    <p className="mt-1">{comment.content}</p>
                    <div className="flex items-center mt-2">
                      <p className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReplyInput(comment.id)}
                        className="ml-2"
                      >
                        Reply
                      </Button>
                    </div>

                    {showReplyInput[comment.id] && (
                      <div className="mt-2 flex">
                        <Textarea
                          value={replyText[comment.id] || ''}
                          onChange={(e) =>
                            setReplyText((prev) => ({
                              ...prev,
                              [comment.id]: e.target.value,
                            }))
                          }
                          placeholder="Write a reply..."
                          className="flex-1"
                        />
                        <Button onClick={() => handleSubmitReply(comment.id)} className="ml-2 bg-zinc-700 hover:bg-zinc-600">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {comment.replies?.map((reply: Reply) => (
                  <div key={reply.id} className="ml-8 mt-4">
                    <div className="flex items-start space-x-2">
                      <Avatar className='border-2 border-gray-500'>
                        <AvatarFallback>{reply.username[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{reply.username}</p>
                        <p className="mt-1">{reply.content}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {new Date(reply.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default CourseComments;
