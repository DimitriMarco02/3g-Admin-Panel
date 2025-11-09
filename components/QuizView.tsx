import React, { useState, useEffect, useMemo } from 'react';
import type { Quiz, User, QuizSubmission } from '../types';

interface QuizViewProps {
  quiz: Quiz;
  currentUser: User;
  userSubmission: QuizSubmission | undefined;
  onSubmit: (submission: Omit<QuizSubmission, 'id' | 'submittedAt'>) => void;
  onBack: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ quiz, currentUser, userSubmission, onSubmit, onBack }) => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'finished'>('start');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(quiz.questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const handleSubmit = () => {
    if (gameState !== 'playing') return;

    const endTime = new Date();
    const timeTaken = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    
    let score = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswerIndex) {
        score++;
      }
    });

    onSubmit({
      quizId: quiz.id,
      userId: currentUser.id,
      studentName: currentUser.name,
      score,
      timeTaken,
    });
    setGameState('finished');
  };
  
  useEffect(() => {
    // Fix: Replaced `NodeJS.Timeout` with `ReturnType<typeof setTimeout>` to use the correct type for the `setTimeout` return value in a browser environment.
    let timer: ReturnType<typeof setTimeout>;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      handleSubmit();
    }
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, gameState]);

  const handleStart = () => {
    setStartTime(new Date());
    setTimeLeft(quiz.timeLimit * 60);
    setGameState('playing');
  };

  const handleSelectOption = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (userSubmission) {
    return (
      <div className="p-4 sm:p-6 animate-fade-in text-center max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Quiz Completed!</h2>
            <p className="text-slate-600 mb-6">You have already taken the quiz: <strong>{quiz.title}</strong></p>
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                <p className="text-slate-600 text-lg">Your Score</p>
                <p className="text-5xl font-extrabold text-blue-600 my-2">
                    {userSubmission.score} <span className="text-3xl text-slate-500">/ {quiz.questions.length}</span>
                </p>
                <p className="text-sm text-slate-500">
                    Completed in {Math.floor(userSubmission.timeTaken / 60)}m {userSubmission.timeTaken % 60}s
                </p>
            </div>
            <button onClick={onBack} className="mt-8 w-full bg-amber-400 text-slate-900 font-semibold py-3 px-4 rounded-lg hover:bg-amber-500">
                Back to Home
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 animate-fade-in max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl shadow-blue-500/10">
        {gameState === 'start' && (
          <div className="p-8 text-center">
            <h2 className="text-3xl font-bold text-slate-800">{quiz.title}</h2>
            <p className="text-slate-500 mt-2">Ready to test your knowledge?</p>
            <div className="mt-8 grid grid-cols-2 gap-4 text-left bg-slate-50 p-6 rounded-lg">
                <div className="font-semibold text-slate-700">Questions:</div>
                <div className="text-slate-800">{quiz.questions.length}</div>
                <div className="font-semibold text-slate-700">Time Limit:</div>
                <div className="text-slate-800">{quiz.timeLimit} minutes</div>
            </div>
            <button onClick={handleStart} className="mt-8 w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 text-lg">
              Start Quiz
            </button>
          </div>
        )}

        {gameState === 'playing' && currentQuestion && (
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
                <p className="text-sm font-bold text-slate-500">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
                <div className="bg-red-100 text-red-700 font-bold text-lg px-4 py-1.5 rounded-full">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
            </div>
            <div className="h-1 w-full bg-slate-200 rounded-full mb-8">
                <div className="h-1 bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}></div>
            </div>

            <h3 className="text-xl font-semibold text-slate-800 mb-6">{currentQuestion.text}</h3>
            
            <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleSelectOption(index)}
                        className={`w-full text-left p-4 border-2 rounded-lg font-medium transition-all duration-200 ${
                            answers[currentQuestionIndex] === index
                                ? 'bg-blue-100 border-blue-500 text-blue-800'
                                : 'bg-white border-slate-300 hover:border-blue-400'
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <button
                onClick={handleNext}
                disabled={answers[currentQuestionIndex] === null}
                className="mt-8 w-full bg-amber-400 text-slate-900 font-bold py-3 rounded-lg hover:bg-amber-500 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
                {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish & See Score'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizView;
