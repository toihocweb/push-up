import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import type { GeneratedQuestion } from '../services/groq';
import { useStore } from '../store/useStore';

interface QuizProps {
    questions: GeneratedQuestion[];
    onAnswer?: (word: string, isCorrect: boolean) => void;
}

export const Quiz: React.FC<QuizProps> = ({ questions, onAnswer }) => {
    const { currentQuizIndex, setCurrentQuizIndex, quizAnswers, setQuizAnswer, resetQuizProgress } = useStore();
    const [showResult, setShowResult] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [feedbackState, setFeedbackState] = useState<'correct' | 'incorrect' | null>(null);

    // Reset index if questions change
    useEffect(() => {
        if (questions.length > 0 && currentQuizIndex >= questions.length) {
            setCurrentQuizIndex(0);
        }
    }, [questions.length]);

    // Load saved answer
    useEffect(() => {
        const savedAnswer = quizAnswers[currentQuizIndex];
        if (savedAnswer) {
            setSelectedOption(savedAnswer.answer);
            setFeedbackState(savedAnswer.correct ? 'correct' : 'incorrect');
        } else {
            setSelectedOption(null);
            setFeedbackState(null);
        }
    }, [currentQuizIndex, quizAnswers]);

    const handleOptionSelect = (option: string) => {
        if (feedbackState) return;
        setSelectedOption(option);
    };

    const handleSubmit = () => {
        if (!selectedOption || feedbackState) return;

        const currentQuestion = questions[currentQuizIndex];
        const isCorrect = selectedOption === currentQuestion.correctAnswer;

        setFeedbackState(isCorrect ? 'correct' : 'incorrect');
        setQuizAnswer(currentQuizIndex, selectedOption, isCorrect);

        if (onAnswer) {
            onAnswer(currentQuestion.correctAnswer, isCorrect);
        }
        setTimeout(() => {
            if (currentQuizIndex < questions.length - 1) {
                setCurrentQuizIndex(currentQuizIndex + 1);
            } else {
                setShowResult(true);
            }
        }, 1500);
    };

    const handleNext = () => {
        if (currentQuizIndex < questions.length - 1) {
            setCurrentQuizIndex(currentQuizIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuizIndex > 0) {
            setCurrentQuizIndex(currentQuizIndex - 1);
        }
    };

    const handleRestart = () => {
        resetQuizProgress();
        setShowResult(false);
        setSelectedOption(null);
        setFeedbackState(null);
    };

    // Calculate score
    const score = Object.values(quizAnswers).filter(a => a.correct).length;

    if (questions.length === 0) return null;

    if (showResult) {
        return (
            <div className="max-w-2xl mx-auto text-center py-20">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-cyber-gray p-12 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] border border-cyber-primary/30"
                >
                    <div className="text-6xl mb-6">🎉</div>
                    <h2 className="text-3xl font-bold text-white font-cyber mb-4 text-glow">Quiz Complete!</h2>
                    <p className="text-2xl text-gray-300 mb-8">
                        You scored <span className="font-bold text-cyber-primary text-glow">{score}</span> out of {questions.length}
                    </p>
                    <button
                        onClick={handleRestart}
                        className="px-6 py-3 bg-cyber-primary text-cyber-black rounded-lg font-bold hover:bg-cyan-400 transition-colors flex items-center gap-2 mx-auto shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                    >
                        <RefreshCw size={20} />
                        Try Again
                    </button>
                </motion.div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuizIndex];

    if (!currentQuestion) {
        return (
            <div className="text-center py-20">
                <p className="text-cyber-primary animate-pulse font-cyber">Loading questions...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4">
            {/* Header / Progress */}
            <div className="mb-8 space-y-4">
                <div className="flex justify-between items-end px-2">
                    <div>
                        <span className="text-sm font-medium text-cyber-primary uppercase tracking-wider font-cyber">Question</span>
                        <div className="text-3xl font-bold text-white leading-none mt-1 font-cyber">
                            {currentQuizIndex + 1} <span className="text-lg text-gray-500 font-normal">/ {questions.length}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-medium text-cyber-primary uppercase tracking-wider font-cyber">Score</span>
                        <div className="text-3xl font-bold text-cyber-purple leading-none mt-1 font-cyber text-glow">
                            {score}
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-cyber-black rounded-full overflow-hidden border border-cyber-slate">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyber-primary to-cyber-purple shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuizIndex + 1) / questions.length) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* Main Card */}
            <motion.div
                layout
                className="bg-cyber-gray rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-cyber-slate overflow-hidden relative group"
            >
                {/* Decorative background blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyber-purple/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="p-8 md:p-12 relative z-10">
                    <div className="min-h-[100px] flex items-center justify-center mb-10 text-center">
                        <div>
                            <h2 className="text-2xl md:text-3xl text-white leading-relaxed font-medium mb-2 font-cyber tracking-wide">
                                {currentQuestion.question}
                            </h2>
                            <p className="text-gray-400">Select the correct answer</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 max-w-xl mx-auto">
                        {currentQuestion.options && currentQuestion.options.length > 0 ? (
                            currentQuestion.options.map((option, idx) => {
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionSelect(option)}
                                        disabled={!!feedbackState}
                                        className={clsx(
                                            "w-full p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                                            selectedOption === option
                                                ? (feedbackState === 'correct'
                                                    ? "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                                    : feedbackState === 'incorrect'
                                                        ? "border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                                        : "border-cyber-primary bg-cyber-primary/10 text-cyber-primary shadow-[0_0_15px_rgba(0,240,255,0.3)]")
                                                : "border-cyber-slate bg-cyber-black/50 text-gray-300 hover:border-cyber-primary/50 hover:bg-cyber-primary/5 hover:text-white"
                                        )}
                                    >
                                        <div className="flex items-center justify-between relative z-10">
                                            <span className="text-lg font-medium">{option}</span>
                                            {selectedOption === option && (
                                                <div className={clsx(
                                                    "w-6 h-6 rounded-full flex items-center justify-center",
                                                    feedbackState === 'correct' ? "bg-green-500 text-black" :
                                                        feedbackState === 'incorrect' ? "bg-red-500 text-black" :
                                                            "bg-cyber-primary text-black"
                                                )}>
                                                    {feedbackState === 'correct' ? <Check size={14} /> :
                                                        feedbackState === 'incorrect' ? <X size={14} /> :
                                                            <div className="w-2 h-2 bg-black rounded-full" />}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="text-center text-red-500 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                                Error: No options available for this question.
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedOption || !!feedbackState}
                            className="px-8 py-3 bg-cyber-primary text-cyber-black rounded-xl font-bold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                        >
                            Check Answer
                        </button>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-cyber-black/30 p-6 border-t border-cyber-slate flex justify-between items-center backdrop-blur-sm">
                    <button
                        onClick={handlePrev}
                        disabled={currentQuizIndex === 0}
                        className="px-6 py-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentQuizIndex === questions.length - 1}
                        className="px-6 py-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
