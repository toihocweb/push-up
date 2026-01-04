import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { WritingPractice } from '../components/WritingPractice';
import { Link } from 'react-router-dom';
import { GroqService } from '../services/groq';
import { Loader2, RefreshCw } from 'lucide-react';

export const WritingPage: React.FC = () => {
    const { activeWords, groqApiKey, groqModel, writingQuestions, setWritingQuestions, updateWordProgress, trackGroqUsage, resetWriting } = useStore();
    const [quizType, setQuizType] = useState<'cloze' | 'vietnamese' | 'sentence-challenge'>('cloze');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generate = async (force = false) => {
        if (activeWords.length < 4) return;
        if (!groqApiKey) return;
        if (!force && writingQuestions.length > 0) return;

        setLoading(true);
        setError('');
        resetWriting(); // Clear previous questions and answers

        try {
            const groq = new GroqService(groqApiKey, groqModel);

            // Shuffle words once
            const shuffled = [...activeWords].sort(() => 0.5 - Math.random());

            // Process in chunks
            const chunkSize = 5;
            let allExercises: any[] = []; // Using any[] to avoid strict type issues for now, but should be WritingExercise[]

            for (let i = 0; i < shuffled.length; i += chunkSize) {
                const chunk = shuffled.slice(i, i + chunkSize);

                // Generate for this chunk
                const { data: generated, usage } = await groq.generateWritingExercises(chunk);

                trackGroqUsage(usage);

                // Filter out duplicates based on word
                const uniqueGenerated = generated.filter(q =>
                    !allExercises.some(existing => existing.word.toLowerCase() === q.word.toLowerCase())
                );

                allExercises = [...allExercises, ...uniqueGenerated];
                setWritingQuestions(allExercises);

                // Small delay
                if (i + chunkSize < shuffled.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } catch (err) {
            console.error(err);
            setError('Failed to generate practice. Check your API key.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check for legacy data (missing 'sentence' property)
        if (writingQuestions.length > 0) {
            const isLegacy = !writingQuestions[0].sentence;
            if (isLegacy) {
                console.log('Legacy writing data detected, resetting...');
                resetWriting();
                return;
            }
        }

        if (activeWords.length >= 4 && !loading && writingQuestions.length === 0) {
            generate();
        }
    }, [activeWords.length, groqApiKey, quizType, writingQuestions.length]);

    if (activeWords.length < 4) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Not enough words</h2>
                <p className="text-slate-600 mb-8">You need at least 4 words to start writing practice.</p>
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
                <p className="text-slate-600 mb-8">Please set your Groq API key to generate practice questions.</p>
                <Link to="/settings" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                    Go to Settings
                </Link>
            </div>
        );
    }

    if (loading && writingQuestions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                <p className="text-slate-600">Generating writing exercises...</p>
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
                    Regenerate Exercises
                </button>

                <select
                    value={quizType}
                    onChange={(e) => {
                        setQuizType(e.target.value as any);
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                >
                    <option value="cloze">Fill in the Blank (English)</option>
                    <option value="vietnamese">Vietnamese Challenge (Word)</option>
                    <option value="sentence-challenge">Sentence Challenge (Full)</option>
                </select>
            </div>
            <WritingPractice
                exercises={writingQuestions}
                mode={quizType}
                onAnswer={(word, isCorrect) => updateWordProgress(word, isCorrect)}
            />
        </div>
    );
};
