"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Send, ArrowBigUp, ArrowBigDown, MessageSquare, Clock, ThumbsUp, ThumbsDown } from "lucide-react"
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
import { cn } from "@/lib/utils"

interface CourseCommentsProps {
  orgId: string
  courseId: string
  sectionId: string
  chapterId: string
}

interface UserAvatarProps {
  userId: string
  username: string
  size?: "sm" | "md"
}

type SortOption = "newest" | "most_upvotes" | "most_downvotes"

const UserAvatar = ({ userId, username, size = "md" }: UserAvatarProps) => {
  const { data: userData } = useGetUserQuery(userId)

  return (
    <Avatar className={cn(size === "sm" ? "h-6 w-6" : "h-8 w-8")}>
      {userData?.imageUrl ? (
        <AvatarImage src={userData.imageUrl} alt={username} />
      ) : (
        <AvatarFallback className={cn("bg-primary/10 text-primary", size === "sm" ? "text-xs" : "text-sm")}>
          {username[0].toUpperCase()}
        </AvatarFallback>
      )}
    </Avatar>
  )
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

export function CourseComments({ orgId, courseId, sectionId, chapterId }: CourseCommentsProps) {
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
    if (!newComment.trim() || !user) return

    const chapterComment = {
      id: uuidv4(),
      userId: user.id,
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
    if (!user) return

    const replyContent = replyText[commentId]?.trim()
    if (!replyContent) return

    const reply = {
      id: uuidv4(),
      userId: user.id,
      username: getUsername(),
      content: replyContent,
      createdAt: new Date().toISOString(),
    }

    try {
      console.log("reply", reply)
      await createReply({
        orgId,
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
    if (!user) return

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
    <Card className="w-full mt-4 border-border/40">
      <CardContent className="p-0">
        <div className="p-4 border-b border-border/40">
          <Tabs
            defaultValue="newest"
            value={sortOption}
            onValueChange={(value) => setSortOption(value as SortOption)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="newest" className="text-xs">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Newest
              </TabsTrigger>
              <TabsTrigger value="most_upvotes" className="text-xs">
                <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                Most Upvoted
              </TabsTrigger>
              <TabsTrigger value="most_downvotes" className="text-xs">
                <ThumbsDown className="h-3.5 w-3.5 mr-1.5" />
                Most Downvoted
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmitComment} className="flex items-start gap-2 mb-6">
            {user && <UserAvatar userId={user.id} username={getUsername()} />}
            <div className="flex-1 flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 min-h-[60px] resize-none"
              />
              <Button type="submit" size="sm" className="px-3" disabled={!newComment.trim() || !user}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>

          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : sortedComments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedComments.map((comment) => (
                  <div key={comment.id} className="group">
                    <div className="flex gap-3">
                      <UserAvatar userId={comment.userId} username={comment.username} />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{comment.username}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                        </div>
                        <p className="text-sm">{comment.content}</p>

                        <div className="flex items-center gap-4 pt-1">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleVote(comment.id, "upvote")}
                              className="h-7 w-7 rounded-full hover:bg-green-500/10 hover:text-green-500"
                            >
                              <ArrowBigUp className="h-4 w-4" />
                            </Button>
                            <span className="text-xs font-medium">{comment.upvotes || 0}</span>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleVote(comment.id, "downvote")}
                              className="h-7 w-7 rounded-full hover:bg-red-500/10 hover:text-red-500"
                            >
                              <ArrowBigDown className="h-4 w-4" />
                            </Button>
                            <span className="text-xs font-medium">{comment.downvotes || 0}</span>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleReplyInput(comment.id, comment.username)}
                            className="h-7 px-2 text-xs"
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                            Reply
                          </Button>
                        </div>

                        {showReplyInput[comment.id] && (
                          <div className="mt-3 flex items-start gap-2">
                            {user && <UserAvatar userId={user.id} username={getUsername()} size="sm" />}
                            <div className="flex-1 flex gap-2">
                              <Textarea
                                value={replyText[comment.id] || ""}
                                onChange={(e) =>
                                  setReplyText((prev) => ({
                                    ...prev,
                                    [comment.id]: e.target.value,
                                  }))
                                }
                                placeholder="Write a reply..."
                                className="flex-1 min-h-[40px] text-sm resize-none"
                              />
                              <Button
                                onClick={() => handleSubmitReply(comment.id)}
                                size="sm"
                                className="px-3"
                                disabled={!replyText[comment.id]?.trim() || !user}
                              >
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 ml-11 pl-4 border-l border-border/40 space-y-3">
                        {comment.replies.map((reply: Reply) => (
                          <div key={reply.id} className="flex gap-2">
                            <UserAvatar userId={reply.userId} username={reply.username} size="sm" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium">{reply.username}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</p>
                              </div>
                              <p className="text-xs mt-0.5">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {comment !== sortedComments[sortedComments.length - 1] && <Separator className="mt-6 opacity-30" />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

export default CourseComments

