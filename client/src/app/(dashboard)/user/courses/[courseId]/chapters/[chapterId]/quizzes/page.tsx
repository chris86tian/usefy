import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useUpdateQuizProgressMutation } from '@/state/api';
import { useUser } from '@clerk/nextjs';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QuizzesProps {
    quiz: { questions: Question[] };
    courseId: string;
    sectionId: string;
    chapterId: string;
    onQuizComplete?: (score: number, totalQuestions: number) => void;
}

const Quizzes = ({ 
  quiz, 
  courseId,
  sectionId,
  chapterId,
  onQuizComplete 
}: QuizzesProps) => {
  const user = useUser();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [updateQuizProgress] = useUpdateQuizProgressMutation();
  const [error, setError] = useState<string | null>(null);

  if (!quiz || quiz.questions.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <h3 className="text-xl font-semibold mb-2">No Quiz Available</h3>
            <p className="text-muted-foreground">This chapter does not have any quiz questions yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showResult) {
      setSelectedAnswer(answerIndex);
      setError(null);
    }
  };

  const handleNextQuestion = async () => {
    if (selectedAnswer === null) {
      setError("Please select an answer before proceeding.");
      return;
    }
  
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  
    if (currentQuestionIndex + 1 < totalQuestions) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setError(null);
    } else {
      const finalScore = score + (selectedAnswer === currentQuestion.correctAnswer ? 1 : 0);
      const percentage = (finalScore / totalQuestions) * 100;
      const passed = percentage >= 75;
  
      setIsQuizCompleted(true);
  
      try {
        await updateQuizProgress({
          userId: user?.user?.id as string,
          courseId,
          sectionId,
          chapterId,
          completed: passed,
        }).unwrap();
  
        if (onQuizComplete) {
          onQuizComplete(finalScore, totalQuestions);
        }
      } catch (error) {
        setError("Failed to update quiz progress. Please try again." + error);
      }
    }
  };  

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) {
      setError("Please select an answer before checking.");
      return;
    }
    setShowResult(true);
    setError(null);
  };

  const renderQuizContent = () => {
    if (isQuizCompleted) {
      const percentage = (score / totalQuestions) * 100;
      const isPassed = percentage >= 75;
      
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-900 rounded-lg">
          <h3 className="text-2xl font-bold mb-4">Quiz Completed!</h3>
          <div className="relative w-32 h-32 mb-6">
            <div 
              className="absolute inset-0 rounded-full border-4 border-gray-700"
              style={{
                background: `conic-gradient(${isPassed ? '#22c55e' : '#ef4444'} ${percentage}%, transparent 0)`
              }}
            />
            <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold">{percentage.toFixed(0)}%</span>
            </div>
          </div>
          <p className="text-lg mb-4">You scored {score} out of {totalQuestions}</p>
          {isPassed ? (
            <Alert className=" bg-green-900/20 border-green-500 text-green-500 w-auto">
              <AlertDescription>Congratulations! You passed the quiz.</AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center space-x-2">
              <Alert className=" bg-red-900/20 border-red-500 text-red-500 w-auto">
                <AlertDescription>Keep practicing! You need 75% to pass.</AlertDescription>
              </Alert>
              <Button 
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setSelectedAnswer(null);
                  setShowResult(false);
                  setScore(0);
                  setIsQuizCompleted(false);
                }}
                className="bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                Retake Quiz
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-gray-900 rounded-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </CardTitle>
          </div>
          <div className="w-full bg-gray-800 h-2 rounded-full">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-lg font-medium">{currentQuestion.question}</p>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className="mb-4 bg-red-900/20 border-red-500 text-red-500">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <RadioGroup
            value={selectedAnswer !== null ? selectedAnswer.toString() : undefined}
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 p-4 rounded-lg border transition-all duration-200 ${
                  showResult
                    ? index === currentQuestion.correctAnswer
                      ? 'border-green-500 bg-green-900/20'
                      : selectedAnswer === index
                      ? 'border-red-500 bg-red-900/20'
                      : 'border-gray-700'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label 
                  htmlFor={`option-${index}`} 
                  className={`flex-grow cursor-pointer ${
                    showResult && index === currentQuestion.correctAnswer
                      ? 'text-green-500'
                      : showResult && selectedAnswer === index
                      ? 'text-red-500'
                      : ''
                  }`}
                >
                  {option}
                </Label>
                {showResult && index === currentQuestion.correctAnswer && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                )}
                {showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                )}
              </div>
            ))}
          </RadioGroup>
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          {!showResult ? (
            <Button 
              onClick={handleCheckAnswer}
              disabled={selectedAnswer === null}
              className="bg-blue-500 hover:bg-blue-600 transition-colors"
            >
              Check Answer
            </Button>
          ) : (
            <Button 
              onClick={handleNextQuestion}
              className="bg-blue-500 hover:bg-blue-600 transition-colors"
            >
              {currentQuestionIndex + 1 === totalQuestions ? 'Finish Quiz' : 'Next Question'}
            </Button>
          )}
        </CardFooter>
      </div>
    );
  };

  return (
    <Card className="mt-4">
      {renderQuizContent()}
    </Card>
  );
};

export default Quizzes;