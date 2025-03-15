"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, Brain } from 'lucide-react'
import { useUpdateQuizProgressMutation } from "@/state/api"
import { useUser } from "@clerk/nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import FeedbackButton from "./FeedbackButton"
import { Progress } from "@/components/ui/progress"

const AdaptiveQuiz = ({ quiz, courseId, sectionId, chapterId, onQuizComplete }: AdaptiveQuizProps) => {
  const user = useUser()
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [isQuizCompleted, setIsQuizCompleted] = useState(false)
  const [updateQuizProgress] = useUpdateQuizProgressMutation()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (quiz?.questions) {
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
  }, [quiz])

  const selectReplacementQuestion = () => {
    const remainingQuestions = quiz.questions.filter((q) => !activeQuestions.includes(q))
    return remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)]
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
      setIsQuizCompleted(true)
      toast.success("Quiz completed! Your personalized assessment is ready.", {
        duration: 5000,
      })

      try {
        if (!user?.user?.id) {
          throw new Error("User ID not found")
        }

        const finalScore = score + (isCorrect ? 1 : 0)
        const percentage = (finalScore / totalQuestions) * 100
        const passed = percentage >= 75

        await updateQuizProgress({
          userId: user.user.id,
          courseId,
          sectionId,
          chapterId,
          completed: passed,
        }).unwrap()

        if (onQuizComplete) {
          onQuizComplete(finalScore, totalQuestions)
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

  const handleRetakeQuiz = () => {
    const initialQuestions = quiz.questions.slice(0, 5)
    setActiveQuestions(initialQuestions)
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})
    setShowResult(false)
    setScore(0)
    setIsQuizCompleted(false)
  }

  const renderQuizContent = () => {
    if (isQuizCompleted) {
      const percentage = (score / totalQuestions) * 100
      const isPassed = percentage >= 75

      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Quiz Completed!</h3>
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
                stroke={isPassed ? "#22C55E" : "#EF4444"}
                strokeWidth="2"
                strokeDasharray={`${percentage}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold">{percentage.toFixed(0)}%</span>
            </div>
          </div>
          <p className="text-lg mb-4">
            You scored {score} out of {totalQuestions}
          </p>
          {isPassed ? (
            <Alert className="w-auto border-green-500 bg-green-50 text-green-700">
              <AlertDescription>Congratulations! You passed the quiz.</AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <Alert variant="destructive" className="w-auto">
                <AlertDescription>Keep practicing! You need 75% to pass.</AlertDescription>
              </Alert>
              <Button onClick={handleRetakeQuiz}>Retake Quiz</Button>
            </div>
          )}
        </div>
      )
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
                      ? "border-green-500 bg-green-50 hover:bg-green-100"
                      : currentSelectedAnswer === index
                        ? "border-red-500 bg-red-50 hover:bg-red-100"
                        : ""
                    : currentSelectedAnswer === index
                      ? "border-primary"
                      : ""
                }`}
              >
                <span className="flex-grow text-left">{option}</span>
                {showResult && index === currentQuestion.correctAnswer && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 ml-2" />
                )}
                {showResult && currentSelectedAnswer === index && index !== currentQuestion.correctAnswer && (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 ml-2" />
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

  return <Card className="mt-4">{renderQuizContent()}</Card>
}

export default AdaptiveQuiz