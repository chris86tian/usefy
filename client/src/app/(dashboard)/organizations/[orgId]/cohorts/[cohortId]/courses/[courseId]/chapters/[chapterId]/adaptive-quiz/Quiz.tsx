"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, Brain, RefreshCw } from 'lucide-react'
import { useUpdateQuizProgressMutation } from "@/state/api"
import { useUser } from "@clerk/nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import FeedbackButton from "./FeedbackButton"
import { Progress } from "@/components/ui/progress"
import { useCourseProgressData } from "@/hooks/useCourseProgressData"

interface QuizProps {
  quiz: { questions: Question[] };
  courseId: string;
  sectionId: string;
  chapterId: string;
  onQuizComplete?: (score: number, totalQuestions: number, passed: boolean) => void;
}

const Quiz = ({ quiz, courseId, sectionId, chapterId, onQuizComplete }: QuizProps) => {
  const user = useUser()
  const router = useRouter()
  const { isQuizCompleted, getQuizScore, quizResults } = useCourseProgressData()
  
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [isQuizInProgress, setIsQuizInProgress] = useState(false)
  const [updateQuizProgress] = useUpdateQuizProgressMutation()
  const [error, setError] = useState<string | null>(null)
  
  const PASS_THRESHOLD = 0.8 // 80% passing threshold

  // Check if the quiz is already completed
  const quizAlreadyCompleted = isQuizCompleted(chapterId)

  useEffect(() => {
    if (quiz?.questions && isQuizInProgress) {
      const initialQuestions = quiz.questions.slice(0, 5)

      if (initialQuestions.length === 0) {
        setError("No questions available for this quiz.")
      } else {
        setActiveQuestions(initialQuestions)
        setCurrentQuestionIndex(0)
        setScore(0)
        setShowResult(false)
        setError(null)
      }
    }
  }, [quiz, isQuizInProgress])

  const selectReplacementQuestion = () => {
    const remainingQuestions = quiz.questions.filter((q) => !activeQuestions.includes(q))
    return remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)]
  }

  const handleStartQuiz = () => {
    setIsQuizInProgress(true)
  }

  if (!quiz) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <h3 className="text-xl font-semibold mb-2">No Quiz Available</h3>
            <p className="text-muted-foreground">This chapter does not have any quiz questions yet.</p>
            {user?.user?.publicMetadata?.userType === "teacher" && (
              <Button
                className="mt-4"
                onClick={() => {
                  router.push(`/teacher/courses/${courseId}`)
                }}
              >
                <Brain className="w-4 h-4 mr-2" />
                Add Quiz
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // If quiz is completed but not in progress, show the results
  if (quizAlreadyCompleted && !isQuizInProgress) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Quiz Results</h3>
          {quizResults ? (
            <>
              <div className="relative w-32 h-32 mb-6">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={quizResults.passed ? "#22C55E" : "#EF4444"}
                    strokeWidth="2"
                    strokeDasharray={`${(quizResults.score / quizResults.totalQuestions) * 100}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">
                    {((quizResults.score / quizResults.totalQuestions) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <p className="text-lg mb-4">
                You scored {quizResults.score} out of {quizResults.totalQuestions}
              </p>
              {quizResults.passed ? (
                <div className="w-auto border border-green-500 bg-green-50 text-green-700 px-4 py-3 rounded-lg">
                  <p>Congratulations! You passed the quiz.</p>
                </div>
              ) : (
                <div className="w-auto border border-red-500 bg-red-50 text-red-700 px-4 py-3 rounded-lg">
                  <p>Keep practicing! You need 80% to pass.</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center mb-4">
              <p className="text-muted-foreground">You&apos;ve completed this quiz.</p>
            </div>
          )}
          <Button 
            onClick={handleStartQuiz}
            className="flex items-center gap-1 mt-4"
          >
            <RefreshCw className="h-4 w-4" />
            Retake Quiz
          </Button>
        </div>
      </div>
    )
  }

  // If quiz is in progress, show the quiz interface
  if (isQuizInProgress) {
    const currentQuestion = activeQuestions[currentQuestionIndex]
    const totalQuestions = activeQuestions.length
    const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100
    const currentSelectedAnswer = selectedAnswers[currentQuestionIndex]

    const handleAnswerSelect = (answerIndex: number) => {
      if (!showResult) {
        setSelectedAnswers((prev) => ({
          ...prev,
          [currentQuestionIndex]: answerIndex,
        }))
        setError(null)
      }
    }

    const handleNextQuestion = async () => {
      if (currentSelectedAnswer === undefined) {
        setError("Please select an answer before proceeding.")
        return
      }

      const isCorrect = currentSelectedAnswer === currentQuestion.correctAnswer
      if (isCorrect) {
        setScore((prevScore) => prevScore + 1)
      } else {
        // Replace the incorrect question with a new one
        const replacementQuestion = selectReplacementQuestion()
        if (replacementQuestion) {
          setActiveQuestions((prev) => [
            ...prev.slice(0, currentQuestionIndex),
            replacementQuestion,
            ...prev.slice(currentQuestionIndex + 1),
          ])
        }
      }

      if (currentQuestionIndex + 1 < totalQuestions) {
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
        setShowResult(false)
        setError(null)
      } else {
        // Quiz is completed
        try {
          if (!user?.user?.id) {
            throw new Error("User ID not found")
          }

          const finalScore = score + (isCorrect ? 1 : 0)
          const isPassed = (finalScore / totalQuestions) >= PASS_THRESHOLD
          
          await updateQuizProgress({
            userId: user.user.id,
            courseId,
            sectionId,
            chapterId,
            completed: true,
            score: finalScore,
            totalQuestions,
          }).unwrap()

          setIsQuizInProgress(false)
          
          if (onQuizComplete) {
            onQuizComplete(finalScore, totalQuestions, isPassed)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to update quiz progress"
          setError(`Failed to update quiz progress: ${errorMessage}`)
        }
      }
    }

    const handleCheckAnswer = () => {
      if (currentSelectedAnswer === undefined) {
        setError("Please select an answer before checking.")
        return
      }
      setShowResult(true)
      setError(null)
    }

    if (!currentQuestion) {
      return (
        <div className="px-4 py-8 text-center">
          <p className="text-lg font-medium">No questions available. Please try again later.</p>
        </div>
      )
    }

    return (
      <>
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <CardTitle className="text-lg">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </CardTitle>
          </div>
          <Progress value={progressPercentage} className="w-full" />
          <p className="text-lg font-medium pt-4">{currentQuestion.question}</p>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                variant="outline"
                className={`w-full justify-start h-auto py-3 px-4 font-normal ${
                  showResult
                    ? index === currentQuestion.correctAnswer
                      ? "border-green-500 bg-green-50 hover:bg-green-100 dark:bg-green-500 dark:hover:bg-green-600"
                      : currentSelectedAnswer === index
                        ? "border-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500 dark:hover:bg-red-600"
                        : ""
                    : currentSelectedAnswer === index
                      ? "border-primary"
                      : ""
                }`}
              >
                <span className="flex-grow text-left">{option}</span>
                {showResult && index === currentQuestion.correctAnswer && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 ml-2 dark:text-green-400" />
                )}
                {showResult && currentSelectedAnswer === index && index !== currentQuestion.correctAnswer && (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 ml-2 dark:text-red-400" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <FeedbackButton
            feedbackType="question"
            itemId={currentQuestion.questionId}
            courseId={courseId}
            sectionId={sectionId}
            chapterId={chapterId}
          />
          {!showResult ? (
            <Button onClick={handleCheckAnswer} disabled={currentSelectedAnswer === undefined}>
              Check Answer
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>
              {currentQuestionIndex + 1 === totalQuestions ? "Finish Quiz" : "Next Question"}
            </Button>
          )}
        </CardFooter>
      </>
    )
  }

  // If quiz is not completed and not in progress, show the start button
  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Quiz Available</h3>
          <p className="text-muted-foreground mb-4">Test your knowledge with this quiz.</p>
          <Button onClick={handleStartQuiz}>
            Start Quiz
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default Quiz