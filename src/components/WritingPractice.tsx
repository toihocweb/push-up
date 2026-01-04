import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, RefreshCw, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { WritingExercise } from '../services/groq';
import { useStore } from '../store/useStore';

interface WritingPracticeProps {
    exercises: WritingExercise[];
    mode: 'cloze' | 'vietnamese' | 'sentence-challenge';
    onAnswer?: (word: string, isCorrect: boolean) => void;
}

export const WritingPractice: React.FC<WritingPracticeProps> = ({ exercises, mode, onAnswer }) => {
    const { currentWritingIndex, setCurrentWritingIndex, writingAnswers, setWritingAnswer, resetWritingProgress } = useStore();
    const [showResult, setShowResult] = useState(false);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset index if exercises change
    useEffect(() => {
        if (exercises.length > 0 && currentWritingIndex >= exercises.length) {
            setCurrentWritingIndex(0);
        }
    }, [exercises.length]);

    // Load saved answer when changing exercises
    useEffect(() => {
        const savedAnswer = writingAnswers[currentWritingIndex];
        if (savedAnswer) {
            setUserAnswer(savedAnswer.answer);
            setFeedback(savedAnswer.correct ? 'correct' : 'incorrect');
        } else {
            setUserAnswer('');
            setFeedback(null);
        }
    }, [currentWritingIndex, writingAnswers]);

    useEffect(() => {
        if (inputRef.current && !feedback) {
            inputRef.current.focus();
        }
    }, [currentWritingIndex, feedback]);

    // Derive current question data based on mode
    const currentExercise = exercises[currentWritingIndex];

    const getQuestionData = () => {
        if (!currentExercise) return null;

        switch (mode) {
            case 'cloze':
                // Safety check for missing sentence (legacy data)
                if (!currentExercise.sentence) return null;

                // Replace word with blanks (case insensitive)
                const regex = new RegExp(`\\b${currentExercise.word}\\b`, 'gi');
                const questionText = currentExercise.sentence.replace(regex, '_______');
                return {
                    question: questionText,
                    correctAnswer: currentExercise.word,
                    isCloze: true
                };
            case 'vietnamese':
                return {
                    question: `${currentExercise.vietnamese} _______`,
                    correctAnswer: currentExercise.word,
                    isCloze: true
                };
            case 'sentence-challenge':
                return {
                    question: currentExercise.vietnamese,
                    correctAnswer: currentExercise.sentence,
                    isCloze: false
                };
            default:
                return null;
        }
    };

    const questionData = getQuestionData();

    const normalizeText = (text: string) => {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove non-alphanumeric chars (keep spaces)
            .replace(/\s+/g, ' ')    // Collapse multiple spaces
            .trim();
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!userAnswer.trim() || feedback || !questionData) return;

        // Normalize both for comparison
        const normalizedUser = normalizeText(userAnswer);
        const normalizedCorrect = normalizeText(questionData.correctAnswer);

        const correct = normalizedUser === normalizedCorrect;

        setFeedback(correct ? 'correct' : 'incorrect');

        // Save answer to store
        setWritingAnswer(currentWritingIndex, userAnswer, correct);

        // Track progress
        onAnswer?.(currentExercise.word, correct);
    };

    // Calculate score from answers
    const calculatedScore = Object.values(writingAnswers).filter(a => a.correct).length;

    const handleNext = () => {
        if (currentWritingIndex < exercises.length - 1) {
            setCurrentWritingIndex(currentWritingIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentWritingIndex > 0) {
            setCurrentWritingIndex(currentWritingIndex - 1);
        }
    };

    const handleRestart = () => {
        resetWritingProgress();
        setShowResult(false);
        setUserAnswer('');
        setFeedback(null);
    };

    const handleRetryQuestion = () => {
        setFeedback(null);
        setUserAnswer('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleFinish = () => {
        setShowResult(true);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrev();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [feedback, handleNext]);

    if (exercises.length === 0) return null;

    if (showResult) {
        return (
            <div className="max-w-2xl mx-auto text-center py-20">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-cyber-gray p-12 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] border border-cyber-primary/30"
                >
                    <div className="text-6xl mb-6">🎉</div>
                    <h2 className="text-3xl font-bold text-white font-cyber mb-4 text-glow">Practice Complete!</h2>
                    <p className="text-2xl text-gray-300 mb-8">
                        You scored <span className="font-bold text-cyber-primary text-glow">{calculatedScore}</span> out of {exercises.length}
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

    // Safety check
    if (!questionData) {
        return (
            <div className="text-center py-20">
                <p className="text-cyber-primary animate-pulse font-cyber">Loading exercises...</p>
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
                            {currentWritingIndex + 1} <span className="text-lg text-gray-500 font-normal">/ {exercises.length}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-medium text-cyber-primary uppercase tracking-wider font-cyber">Score</span>
                        <div className="text-3xl font-bold text-cyber-purple leading-none mt-1 font-cyber text-glow">
                            {calculatedScore}
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-cyber-black rounded-full overflow-hidden border border-cyber-slate">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyber-primary to-cyber-purple shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentWritingIndex + 1) / exercises.length) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* Main Card */}
            <motion.div
                layout
                className="bg-cyber-gray rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-cyber-slate overflow-hidden relative"
            >
                {/* Decorative background blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyber-purple/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="p-8 md:p-12 relative z-10">
                    <div className="min-h-[120px] flex items-center justify-center mb-10">
                        <h2 className="text-2xl md:text-3xl text-white leading-relaxed text-center font-medium font-cyber tracking-wide">
                            {questionData.isCloze ? (
                                questionData.question.split(/_+/).map((part, i, arr) => (
                                    <React.Fragment key={i}>
                                        {part}
                                        {i < arr.length - 1 && (
                                            <span className={clsx(
                                                "inline-block min-w-[120px] mx-2 border-b-4 transition-colors px-2 text-center font-bold",
                                                !feedback && "border-cyber-slate text-transparent",
                                                feedback === 'correct' && "border-green-500 text-green-400",
                                                feedback === 'incorrect' && "border-red-500 text-red-400"
                                            )}>
                                                {feedback ? userAnswer : "______"}
                                            </span>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <span>{questionData.question}</span>
                            )}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="relative max-w-lg mx-auto space-y-8">
                        <div className="relative">
                            <motion.div
                                animate={feedback === 'incorrect' ? { x: [-10, 10, -10, 10, 0] } : {}}
                                transition={{ duration: 0.4 }}
                            >
                                {questionData.isCloze ? (
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSubmit();
                                            }
                                        }}
                                        disabled={!!feedback}
                                        placeholder="Type the missing word..."
                                        className={clsx(
                                            "w-full px-8 py-6 rounded-2xl border-2 text-center text-xl md:text-2xl font-medium outline-none transition-all shadow-sm placeholder:text-gray-600 font-cyber",
                                            !feedback && "bg-cyber-black border-cyber-slate text-white focus:border-cyber-primary focus:ring-4 focus:ring-cyber-primary/20",
                                            feedback === 'correct' && "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]",
                                            feedback === 'incorrect' && "border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                        )}
                                    />
                                ) : (
                                    <textarea
                                        ref={inputRef as any}
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSubmit();
                                            }
                                        }}
                                        disabled={!!feedback}
                                        placeholder="Type the full English translation..."
                                        rows={3}
                                        className={clsx(
                                            "w-full px-6 py-4 rounded-2xl border-2 text-lg font-medium outline-none transition-all shadow-sm placeholder:text-gray-600 resize-none font-cyber",
                                            !feedback && "bg-cyber-black border-cyber-slate text-white focus:border-cyber-primary focus:ring-4 focus:ring-cyber-primary/20",
                                            feedback === 'correct' && "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]",
                                            feedback === 'incorrect' && "border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                        )}
                                    />
                                )}
                            </motion.div>


                        </div>

                        {/* Feedback Message */}
                        <div className="h-20 flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                {feedback && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-center w-full"
                                    >
                                        <div className={clsx(
                                            "flex items-center justify-center gap-3 font-bold text-xl mb-2 font-cyber",
                                            feedback === 'correct' ? "text-green-400 text-glow" : "text-red-400 text-glow"
                                        )}>
                                            {feedback === 'correct' ? (
                                                <>
                                                    <div className="p-1 bg-green-500/20 rounded-full border border-green-500/50">
                                                        <Check size={20} />
                                                    </div>
                                                    Correct!
                                                </>
                                            ) : (
                                                <>
                                                    <div className="p-1 bg-red-500/20 rounded-full border border-red-500/50">
                                                        <X size={20} />
                                                    </div>
                                                    Incorrect
                                                </>
                                            )}
                                        </div>

                                        {feedback === 'incorrect' && (
                                            <div className="text-gray-400 flex flex-col items-center gap-4">
                                                {mode === 'sentence-challenge' ? (
                                                    <div className="flex flex-wrap justify-center gap-1 text-lg">
                                                        {(() => {
                                                            // Simple diff logic
                                                            const correctWords = questionData.correctAnswer.split(' ');
                                                            const userWords = userAnswer.trim().split(/\s+/);
                                                            let userIndex = 0;

                                                            return correctWords.map((word, i) => {
                                                                // Use same normalization for comparison
                                                                const cleanWord = normalizeText(word);
                                                                let status = 'wrong';

                                                                // Look ahead in user input for a match
                                                                // We limit lookahead to avoid skipping too many words
                                                                for (let j = userIndex; j < Math.min(userIndex + 3, userWords.length); j++) {
                                                                    const cleanUserWord = normalizeText(userWords[j]);
                                                                    if (cleanUserWord === cleanWord) {
                                                                        status = 'correct';
                                                                        userIndex = j + 1;
                                                                        break;
                                                                    }
                                                                }

                                                                return (
                                                                    <span key={i} className={clsx(
                                                                        "font-bold",
                                                                        status === 'correct' ? "text-green-400" : "text-red-400"
                                                                    )}>
                                                                        {word}
                                                                    </span>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <p>
                                                        Answer: <span className="font-bold text-white text-lg font-cyber tracking-wide">{questionData.correctAnswer}</span>
                                                    </p>
                                                )}

                                                <button
                                                    onClick={handleRetryQuestion}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-white/10"
                                                >
                                                    <RefreshCw size={16} />
                                                    Retry Question
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="bg-cyber-black/30 p-6 border-t border-cyber-slate flex justify-between items-center backdrop-blur-sm">
                    <button
                        onClick={handlePrev}
                        disabled={currentWritingIndex === 0}
                        className="px-6 py-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <ArrowRight size={20} className="rotate-180" />
                        Previous
                    </button>

                    {currentWritingIndex < exercises.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="px-8 py-3 bg-cyber-black text-white border border-cyber-primary/50 rounded-xl font-medium hover:bg-cyber-primary/20 transition-all hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] flex items-center gap-3"
                        >
                            Next Question
                            <ArrowRight size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            className="px-8 py-3 bg-gradient-to-r from-cyber-primary to-cyber-purple text-cyber-black rounded-xl font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center gap-3"
                        >
                            Finish Practice
                            <Check size={20} />
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
