import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizQuestionProps {
  question: QuizQuestion;
  onAnswer: (selectedAnswer: number) => void;
  userAnswer: number | null;
  showResult: boolean;
}

const QuizQuestionComponent = ({ question, onAnswer, userAnswer, showResult }: QuizQuestionProps) => {
  return (
    <div className="w-full space-y-4 bg-gray-800 p-6 rounded-lg">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold leading-tight text-primary">
          {question.question}
        </h3>
      </div>

      <RadioGroup 
        onValueChange={(value) => onAnswer(parseInt(value))} 
        value={userAnswer?.toString()}
        className="space-y-3"
      >
        {question.options.map((option, index) => {
          const isCorrect = showResult && index === question.correctAnswer;
          const isIncorrect = showResult && userAnswer === index && index !== question.correctAnswer;
          
          return (
            <div key={index} className="relative">
              <Card className={`
                transition-all duration-200
                ${!showResult && userAnswer === index ? 'border-primary' : 'hover:border-primary/50'}
                ${isCorrect ? 'border-green-500 bg-green-50' : ''}
                ${isIncorrect ? 'border-red-500 bg-red-50' : ''}
              `}>
                <label
                  htmlFor={`option-${index}`}
                  className={`
                    flex items-center p-4 cursor-pointer
                    ${showResult && 'cursor-default'}
                  `}
                >
                  <RadioGroupItem 
                    value={index.toString()} 
                    id={`option-${index}`}
                    disabled={showResult}
                    className="mr-4"
                  />
                  <span className={`
                    flex-grow text-base
                    ${isCorrect ? 'text-green-700 font-medium' : ''}
                    ${isIncorrect ? 'text-red-700' : ''}
                  `}>
                    {option}
                  </span>
                  
                  {showResult && (
                    <div className="ml-2">
                      {isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {isIncorrect && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </label>
              </Card>
            </div>
          );
        })}
      </RadioGroup>

      {showResult && userAnswer !== null && (
        <div className={`
          mt-4 p-4 rounded-lg
          ${userAnswer === question.correctAnswer ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
        `}>
          {userAnswer === question.correctAnswer ? (
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Correct! Well done!</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5" />
                <span>Incorrect</span>
              </div>
              <p className="text-sm">
                The correct answer was: {question.options[question.correctAnswer]}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizQuestionComponent;