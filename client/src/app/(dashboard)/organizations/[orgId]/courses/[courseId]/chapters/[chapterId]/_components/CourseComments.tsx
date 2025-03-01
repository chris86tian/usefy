"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, ArrowBigUp, ArrowBigDown, MessageSquare } from "lucide-react"
import {
  useCreateCommentMutation,
  useUpvoteCommentMutation,
  useDownvoteCommentMutation,
  useCreateReplyMutation,
  useGetChapterCommentsQuery,
  useGetUserQuery,
} from "@/state/api"
import { v4 as uuidv4 } from "uuid"
import { useUser } from "@clerk/nextjs"

interface CourseCommentsProps {
  courseId: string
  sectionId: string
  chapterId: string
}

interface UserAvatarProps {
  userId: string
  username: string
}

type SortOption = "newest" | "most_upvotes" | "most_downvotes"

const UserAvatar = ({ userId, username }: UserAvatarProps) => {
  const { data: userData } = useGetUserQuery(userId)

  return (
    <Avatar>
      {userData?.imageUrl ? (
        <AvatarImage src={userData.imageUrl} alt={username} />
      ) : (
        <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
      )}
    </Avatar>
  )
}

export function CourseComments({ courseId, sectionId, chapterId }: CourseCommentsProps) {
  const { user } = useUser()
  const [newComment, setNewComment] = useState("")
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({})
  const [showReplyInput, setShowReplyInput] = useState<{ [key: string]: boolean }>({})
  const [sortOption, setSortOption] = useState<SortOption>("newest")

  const {
    data: comments = [],
    isLoading,
    refetch,
  } = useGetChapterCommentsQuery({
    courseId,
    sectionId,
    chapterId,
  })

  const sortedComments = useMemo(() => {
    const sortedList = [...comments]
    switch (sortOption) {
      case "most_upvotes":
        return sortedList.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
      case "most_downvotes":
        return sortedList.sort((a, b) => (b.downvotes || 0) - (a.downvotes || 0))
      default:
        return sortedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
  }, [comments, sortOption])

  const [createComment] = useCreateCommentMutation()
  const [createReply] = useCreateReplyMutation()
  const [upvoteComment] = useUpvoteCommentMutation()
  const [downvoteComment] = useDownvoteCommentMutation()

  const getUsername = () => {
    if (!user) return "Anonymous"
    return user.username || user.fullName || user.emailAddresses?.[0]?.emailAddress || "Anonymous"
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const chapterComment = {
      id: uuidv4(),
      userId: user?.id as string,
      username: getUsername(),
      content: newComment,
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date().toISOString(),
      replies: [],
    }

    try {
      await createComment({
        courseId,
        sectionId,
        chapterId,
        comment: chapterComment,
      }).unwrap()

      setNewComment("")
      refetch()
    } catch (error) {
      console.error("Failed to create comment:", error)
    }
  }

  const handleSubmitReply = async (commentId: string) => {
    const replyContent = replyText[commentId]?.trim()
    if (!replyContent) return

    const reply = {
      id: uuidv4(),
      userId: user?.id as string,
      username: getUsername(),
      content: replyContent,
      createdAt: new Date().toISOString(),
    }

    try {
      await createReply({
        courseId,
        sectionId,
        chapterId,
        commentId,
        reply,
      }).unwrap()

      setReplyText((prev) => ({ ...prev, [commentId]: "" }))
      setShowReplyInput((prev) => ({ ...prev, [commentId]: false }))
      refetch()
    } catch (error) {
      console.error("Failed to create reply:", error)
    }
  }

  const handleVote = async (commentId: string, voteType: "upvote" | "downvote") => {
    try {
      if (voteType === "upvote") {
        await upvoteComment({
          courseId,
          sectionId,
          chapterId,
          commentId,
        }).unwrap()
      } else {
        await downvoteComment({
          courseId,
          sectionId,
          chapterId,
          commentId,
        }).unwrap()
      }

      refetch()
    } catch (error) {
      console.error(`Failed to ${voteType} comment:`, error)
    }
  }

  const toggleReplyInput = (commentId: string, username: string) => {
    setShowReplyInput((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
    if (!showReplyInput[commentId]) {
      setReplyText((prev) => ({
        ...prev,
        [commentId]: `@${username} `,
      }))
    }
  }

  return (
    <Card className="w-full mt-4">
      <CardHeader className="border-b">
        <div className="flex items-center space-x-2 mt-2">
          <Button
            variant={sortOption === "newest" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortOption("newest")}
          >
            Newest
          </Button>
          <Button
            variant={sortOption === "most_upvotes" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortOption("most_upvotes")}
          >
            <ArrowBigUp className="h-4 w-4 mr-1" />
            Most Upvotes
          </Button>
          <Button
            variant={sortOption === "most_downvotes" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortOption("most_downvotes")}
          >
            <ArrowBigDown className="h-4 w-4 mr-1" />
            Most Downvotes
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmitComment} className="flex mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1"
          />
          <Button type="submit" className="ml-4">
            <Send className="h-4 w-4" />
          </Button>
        </form>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading comments...</div>
          ) : (
            sortedComments.map((comment) => (
              <div key={comment.id} className="mb-6 last:mb-0">
                <div className="flex items-start space-x-4">
                  <UserAvatar userId={comment.userId} username={comment.username} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{comment.username}</p>
                      <p className="text-sm text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                    <div className="flex items-center space-x-2 text-sm">
                      <Button variant="ghost" size="sm" onClick={() => toggleReplyInput(comment.id, comment.username)}>
                        Reply
                      </Button>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(comment.id, "upvote")}
                          className="px-2"
                        >
                          <ArrowBigUp className="h-4 w-4 mr-1" />
                          {comment.upvotes || 0}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(comment.id, "downvote")}
                          className="px-2"
                        >
                          <ArrowBigDown className="h-4 w-4 mr-1" />
                          {comment.downvotes || 0}
                        </Button>
                      </div>
                    </div>

                    {showReplyInput[comment.id] && (
                      <div className="mt-2 flex">
                        <Textarea
                          value={replyText[comment.id] || ""}
                          onChange={(e) =>
                            setReplyText((prev) => ({
                              ...prev,
                              [comment.id]: e.target.value,
                            }))
                          }
                          placeholder="Write a reply..."
                          className="flex-1"
                        />
                        <Button onClick={() => handleSubmitReply(comment.id)} className="ml-4">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {comment.replies?.map((reply: Reply) => (
                  <div key={reply.id} className="ml-12 mt-4">
                    <div className="flex items-start space-x-4">
                      <UserAvatar userId={reply.userId} username={reply.username} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{reply.username}</p>
                          <p className="text-sm text-muted-foreground">{new Date(reply.createdAt).toLocaleString()}</p>
                        </div>
                        <p className="text-sm">{reply.content}</p>
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
  )
}

export default CourseComments