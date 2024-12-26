'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import QuizQuestionComponent from './_components/quizQuestion'
import { AlertCircle, BookOpen, BrainCircuit, Loader2, RefreshCw, Trophy } from 'lucide-react'
import { Progress } from '@radix-ui/react-progress'
import { Sparkles } from 'lucide-react'
import { QuizResponse } from '@/lib/utils'

interface AIQuizProps {
  videoTranscript: string
}

const AIQuiz = ({ videoTranscript }: AIQuizProps) => {
  const [quizData, setQuizData] = useState<QuizResponse | null>(null)
  const [currentTopic, setCurrentTopic] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Map<string, number[]>>(new Map())
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)

  const generateQuiz = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoTranscript })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate quiz: ${response.statusText}`)
      }

      const data: QuizResponse = await response.json()
      
      if (!data.allQuestions?.length) {
        throw new Error('No questions were generated')
      }

      setQuizData(data)
      // Initialize answers map for all topics
      const initialAnswers = new Map<string, number[]>()
      data.allQuestions.forEach(topicQuestions => {
        initialAnswers.set(
          topicQuestions.topic,
          new Array(topicQuestions.questions.length).fill(-1)
        )
      })
      setUserAnswers(initialAnswers)
      setCurrentTopic(0)
      setCurrentQuestion(0)
      setShowResults(false)
      setHasStarted(true)
    } catch (error) {
      console.error('Error generating quiz:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate quiz')
      setHasStarted(false)
    }
    setLoading(false)
  }

  if (!hasStarted && !loading && !error) {
    return (
      <Card className="w-full mx-auto bg-gray-900 p-4">
        <CardContent className="p-4">
          <div className="flex flex-col items-center space-y-6">
            <BrainCircuit className="w-16 h-16 text-primary" />
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-primary">Ready to Test Your Knowledge?</h2>
              <p className="text-muted-foreground max-w-md">
                We will analyze your content and generate personalized questions to help reinforce your learning.
              </p>
            </div>
            <Button 
              onClick={generateQuiz}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Sparkles className="h-4 w-4" />
              Generate Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-12 pb-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold text-primary">Generating Your Quiz</p>
              <p className="text-sm text-muted-foreground">Analyzing content and creating personalized questions...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground">Please try again or contact support if the issue persists.</p>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="mt-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!quizData?.allQuestions?.length) {
    return null
  }

  const currentTopicData = quizData.allQuestions[currentTopic]
  const currentTopicAnswers = userAnswers.get(currentTopicData.topic) || []

  const handleAnswer = (answer: number) => {
    const newTopicAnswers = [...currentTopicAnswers]
    newTopicAnswers[currentQuestion] = answer
    setUserAnswers(new Map(userAnswers.set(currentTopicData.topic, newTopicAnswers)))
  }

  const handleNext = () => {
    if (currentQuestion < currentTopicData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else if (currentTopic < quizData.allQuestions.length - 1) {
      setCurrentTopic(currentTopic + 1)
      setCurrentQuestion(0)
    } else {
      setShowResults(true)
    }
  }

  const calculateScore = () => {
    let totalCorrect = 0
    let totalQuestions = 0

    quizData.allQuestions.forEach(topicData => {
      const answers = userAnswers.get(topicData.topic) || []
      topicData.questions.forEach((question, index) => {
        if (question.correctAnswer === answers[index]) {
          totalCorrect++
        }
        totalQuestions++
      })
    })

    return { correct: totalCorrect, total: totalQuestions }
  }

  const resetQuiz = () => {
    const initialAnswers = new Map<string, number[]>()
    quizData.allQuestions.forEach(topicQuestions => {
      initialAnswers.set(
        topicQuestions.topic,
        new Array(topicQuestions.questions.length).fill(-1)
      )
    })
    setHasStarted(false)
    setUserAnswers(initialAnswers)
    setCurrentTopic(0)
    setCurrentQuestion(0)
    setShowResults(false)
  }

  const getOverallProgress = () => {
    if (!quizData) return 0
    let answeredQuestions = 0
    let totalQuestions = 0
    
    quizData.allQuestions.forEach(topicData => {
      const answers = userAnswers.get(topicData.topic) || []
      answers.forEach(answer => {
        if (answer !== -1) answeredQuestions++
      })
      totalQuestions += topicData.questions.length
    })
    
    return (answeredQuestions / totalQuestions) * 100
  }

  return (
    <div className="w-full mx-auto">
      <Card className="w-full mx-auto">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              {showResults ? (
                <Trophy className="mr-2 h-5 w-5 text-primary" />
              ) : (
                <BookOpen className="mr-2 h-5 w-5 text-primary" />
              )}
              {showResults ? 'Quiz Results' : `Topic: ${currentTopicData.topic}`}
            </CardTitle>
            {!showResults && (
              <span className="text-sm text-muted-foreground">
                Progress: {Math.round(getOverallProgress())}%
              </span>
            )}
          </div>
          {!showResults && (
            <Progress value={getOverallProgress()} className="h-2" />
          )}
        </CardHeader>
        
        <CardContent>
          {showResults ? (
            <div className="w-full mx-auto">
              <div className="text-center">
                <Trophy className="w-16 h-16 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-6">Quiz Complete!</h2>
                
                <div className="grid gap-4 md:grid-cols-5">
                  {quizData.allQuestions.map((topicData, index) => {
                    const topicAnswers = userAnswers.get(topicData.topic) || []
                    const topicCorrect = topicData.questions.reduce((acc, question, qIndex) => 
                      acc + (question.correctAnswer === topicAnswers[qIndex] ? 1 : 0), 0
                    )
                    const percentage = (topicCorrect / topicData.questions.length) * 100
                    
                    return (
                      <Card key={index} className="p-4 bg-gray-800 rounded-lg">
                        <h3 className="font-semibold text-primary mb-2">{topicData.topic}</h3>
                        <Progress value={percentage} className="h-2 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {topicCorrect} out of {topicData.questions.length} correct
                        </p>
                      </Card>
                    )
                  })}
                </div>
              </div>
              
              <div className="mt-8 border-t pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    Final Score: {calculateScore().correct} out of {calculateScore().total}
                  </p>
                  <p className="text-muted-foreground mb-4">
                    {Math.round((calculateScore().correct / calculateScore().total) * 100)}% Accuracy
                  </p>
                  <Button onClick={resetQuiz} className="bg-blue-500 hover:bg-blue-600 text-white">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retake Quiz
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <QuizQuestionComponent
              question={currentTopicData.questions[currentQuestion]}
              onAnswer={handleAnswer}
              userAnswer={currentTopicAnswers[currentQuestion]}
              showResult={false}
            />
          )}
        </CardContent>
        
        {!showResults && (
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Topic {currentTopic + 1}/{quizData.allQuestions.length} • 
              Question {currentQuestion + 1}/{currentTopicData.questions.length}
            </div>
            <Button 
              onClick={handleNext} 
              disabled={currentTopicAnswers[currentQuestion] === -1}
              className="w-full sm:w-auto"
            >
              {currentTopic === quizData.allQuestions.length - 1 && 
               currentQuestion === currentTopicData.questions.length - 1 
                ? 'Finish Quiz'
                : 'Next Question'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

export default AIQuiz