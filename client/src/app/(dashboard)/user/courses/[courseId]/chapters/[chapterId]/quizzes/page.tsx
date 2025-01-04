import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle } from "lucide-react";
import { Question } from '@/lib/utils';
import { useUpdateQuizProgressMutation } from '@/state/api';
import { useUser } from '@clerk/nextjs';

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

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = async () => {
    if (selectedAnswer === null) return;

    // Update score if answer is correct
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }

    if (currentQuestionIndex + 1 < totalQuestions) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Calculate final score
      const finalScore = score + (selectedAnswer === currentQuestion.correctAnswer ? 1 : 0);
      const percentage = (finalScore / totalQuestions) * 100;
      console.log(percentage);
      const passed = percentage >= 75;

      // Quiz completed
      setIsQuizCompleted(true);
      
      try {
        // Update quiz progress in the backend
        await updateQuizProgress({
          userId: user?.user?.id as string,
          courseId,
          sectionId,
          chapterId,
          completed: passed
        }).unwrap();

        console.log(passed);

        // Call the completion callback if provided
        if (onQuizComplete) {
          onQuizComplete(finalScore, totalQuestions);
        }
      } catch (error) {
        console.error('Failed to update quiz progress:', error);
      }
    }
  };

  const handleCheckAnswer = () => {
    setShowResult(true);
  };

  const renderQuizContent = () => {
    if (isQuizCompleted) {
      const percentage = (score / totalQuestions) * 100;
      
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-900 rounded-lg">
          <h3 className="text-2xl font-bold mb-4">Quiz Completed!</h3>
          <div className="text-6xl font-bold mb-4">{percentage.toFixed(0)}%</div>
          <p className="text-lg mb-2">You scored {score} out of {totalQuestions}</p>
          {percentage >= 75 ? (
            <div className="flex items-center text-green-500">
              <CheckCircle2 className="w-6 h-6 mr-2" />
              <span>Passed</span>
            </div>
          ) : (
            <div className="flex items-center text-red-500">
              <XCircle className="w-6 h-6 mr-2" />
              <span>Failed</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-gray-900 rounded-lg">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <CardTitle className="text-lg">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </CardTitle>
          </div>
          <p className="text-lg font-medium">{currentQuestion.question}</p>
        </CardHeader>

        <CardContent>
          <RadioGroup
            value={selectedAnswer?.toString()}
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 p-3 rounded-lg border ${
                  showResult
                    ? index === currentQuestion.correctAnswer
                      ? 'border-green-500 bg-green-200 text-green-800'
                      : selectedAnswer === index
                      ? 'border-red-500 bg-red-200 text-red-800'
                      : 'border-gray-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                  {option}
                </Label>
                {showResult && index === currentQuestion.correctAnswer && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                {showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                  <XCircle className="w-5 h-5 text-red-500" />
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
              className="bg-blue-500 hover:bg-blue-600"
            >
              Check Answer
            </Button>
          ) : (
            <Button 
              onClick={handleNextQuestion}
              className="bg-blue-500 hover:bg-blue-600"
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