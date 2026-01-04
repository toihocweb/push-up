import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Quiz } from '../components/Quiz';
import { Link } from 'react-router-dom';
import { GroqService, type GeneratedQuestion } from '../services/groq';
import { Loader2, RefreshCw } from 'lucide-react';

export const QuizPage: React.FC = () => {
    const { activeWords, quizQuestions, setQuizQuestions, updateWordProgress, groqApiKey, groqModel, trackGroqUsage, resetQuiz } = useStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [quizType, setQuizType] = useState<'definition' | 'cloze' | 'antonym'>('definition');



    const generate = async (force = false) => {
        if (activeWords.length < 4) return;
        if (!groqApiKey) return;
        if (!force && quizQuestions.length > 0) return;

        setLoading(true);
        setError('');
        resetQuiz(); // Clear previous questions and answers

        try {
            const groq = new GroqService(groqApiKey, groqModel);

            // Shuffle words once
            const shuffled = [...activeWords].sort(() => 0.5 - Math.random());

            // Process in chunks
            const chunkSize = 5;
            let allQuestions: GeneratedQuestion[] = [];

            // Process in chunks of 5
            for (let i = 0; i < shuffled.length; i += chunkSize) {
                const chunk = shuffled.slice(i, i + chunkSize);
                try {
                    const { data: generated, usage } = await groq.generateQuiz(chunk, quizType);

                    trackGroqUsage(usage);

                    // Filter out duplicates based on correct answer (case-insensitive)
                    const uniqueGenerated = generated.filter(q =>
                        !allQuestions.some(existing => existing.correctAnswer.toLowerCase() === q.correctAnswer.toLowerCase())
                    );

                    // Shuffle options for each question
                    const shuffledQuestions = uniqueGenerated.map(q => ({
                        ...q,
                        options: [...q.options].sort(() => 0.5 - Math.random())
                    }));

                    allQuestions = [...allQuestions, ...shuffledQuestions];
                    setQuizQuestions(allQuestions);

                    // Small delay
                    if (i + chunkSize < shuffled.length) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                } catch (err) {
                    console.error('Failed to generate quiz chunk:', err);
                    // Optionally, you could set an error state here for the user
                }
            }
        } catch (err) {
            console.error(err);
            setError('Failed to generate quiz. Check your API key.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeWords.length >= 4 && !loading && quizQuestions.length === 0) {
            generate();
        }
    }, [activeWords.length, groqApiKey]); // Only auto-generate if empty

    if (activeWords.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Active List is Empty</h2>
                <p className="text-slate-600 mb-6">Go to the Home page and add words to the left-side editor to start learning.</p>
                <Link to="/" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Go to Home
                </Link>
            </div>
        );
    }

    if (activeWords.length < 4) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Not enough words</h2>
                <p className="text-slate-600 mb-8">You need at least 4 words to start a quiz.</p>
                <Link to="/" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                    Add Words
                </Link>
            </div>
        );
    }

    if (!groqApiKey) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">API Key Required</h2>
                <p className="text-slate-600 mb-8">Please set your Groq API key to generate quizzes.</p>
                <Link to="/settings" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                    Go to Settings
                </Link>
            </div>
        );
    }

    if (loading && quizQuestions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                <p className="text-slate-600">Generating quiz questions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 mb-4">{error}</p>
                <button onClick={() => generate(true)} className="text-indigo-600 underline">Retry</button>
            </div>
        );
    }

    return (
        <div className="py-8 space-y-8">
            <div className="max-w-2xl mx-auto flex justify-between items-center">
                <button
                    onClick={() => generate(true)}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                    Regenerate Quiz
                </button>

                <select
                    value={quizType}
                    onChange={(e) => {
                        setQuizType(e.target.value as any);
                        // Optional: Auto-regenerate when type changes? Or let user click regenerate?
                        // Let's clear questions so it auto-regenerates via useEffect or we call generate(true)
                        // But useEffect checks for length === 0.
                        // Better to just call generate(true) but we need to update state first.
                        // Actually, let's just let user click regenerate if they want, or force it.
                        // User expectation: changing type changes quiz.
                        resetQuiz(); // This will trigger useEffect
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                >
                    <option value="definition">Definition Match</option>
                    <option value="cloze">Fill in the Blank</option>
                    <option value="antonym">Antonyms</option>
                </select>
            </div>

            <Quiz
                questions={quizQuestions}
                onAnswer={(word, isCorrect) => updateWordProgress(word, isCorrect)}
            />
        </div>
    );
};
