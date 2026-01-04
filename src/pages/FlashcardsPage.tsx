import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { FlashCard } from '../components/FlashCard';
import { ChevronLeft, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GroqService } from '../services/groq';

export const FlashcardsPage: React.FC = () => {
    const { activeWords, vocabDetails, groqApiKey, groqModel, addVocabDetails, trackGroqUsage } = useStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Filter words that need definitions
    const wordsToProcess = activeWords.filter(w => !vocabDetails[w.toLowerCase()]);

    if (activeWords.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <h2 className="text-2xl font-bold text-white mb-4 font-cyber">Your Active List is Empty</h2>
                <p className="text-gray-400 mb-6">Go to the Home page and add words to the left-side editor to start learning.</p>
                <Link to="/" className="px-6 py-2 bg-cyber-primary text-cyber-black rounded-lg hover:bg-cyan-400 transition-colors font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                    Go to Home
                </Link>
            </div>
        );
    }
    const hasWords = activeWords.length > 0;

    useEffect(() => {
        const generateMissing = async () => {
            if (wordsToProcess.length === 0) return;
            if (!groqApiKey) return;

            setLoading(true);
            setError('');

            try {
                // Process in chunks of 5
                const chunkSize = 5;
                for (let i = 0; i < wordsToProcess.length; i += chunkSize) {
                    const chunk = wordsToProcess.slice(i, i + chunkSize);
                    try {
                        const groq = new GroqService(groqApiKey, groqModel);
                        const { data: generated, usage } = await groq.generateVocabDetails(chunk);

                        trackGroqUsage(usage);

                        const withIds = generated.map(item => ({
                            ...item,
                            id: crypto.randomUUID(),
                            mastery: 0,
                            attempts: 0,
                            correct: 0,
                            lastPracticed: 0
                        }));
                        addVocabDetails(withIds);
                    } catch (err) {
                        console.error('Failed to auto-generate definitions:', err);
                    }
                }
            } catch (err) {
                console.error(err);
                setError('Failed to generate definitions. Check your API key.');
            } finally {
                setLoading(false);
            }
        };

        // Only trigger if we aren't already loading and have work to do
        if (wordsToProcess.length > 0 && !loading) {
            generateMissing();
        }
    }, [wordsToProcess.length, groqApiKey]); // Note: this might re-trigger if length changes during generation, but the !loading check protects us

    if (!hasWords) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white mb-4 font-cyber">No words yet</h2>
                <p className="text-gray-400 mb-8">Add some vocabulary words to start using flashcards.</p>
                <Link to="/" className="bg-cyber-primary text-cyber-black px-6 py-3 rounded-lg font-bold hover:bg-cyan-400 transition-colors shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                    Go to Vocabulary
                </Link>
            </div>
        );
    }

    if (!groqApiKey && wordsToProcess.length > 0) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white mb-4 font-cyber">API Key Required</h2>
                <p className="text-gray-400 mb-8">Please set your Groq API key to generate definitions for your words.</p>
                <Link to="/settings" className="bg-cyber-primary text-cyber-black px-6 py-3 rounded-lg font-bold hover:bg-cyan-400 transition-colors shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                    Go to Settings
                </Link>
            </div>
        );
    }

    const currentWord = activeWords[currentIndex];
    const details = vocabDetails[currentWord?.toLowerCase()];

    // If we have a word but no details yet (and loading or error)
    if (!details) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                {loading ? (
                    <>
                        <Loader2 className="animate-spin text-cyber-primary mb-4" size={48} />
                        <p className="text-white font-cyber tracking-wide">Generating definitions with Groq AI...</p>
                        <p className="text-cyber-primary text-sm mt-2 animate-pulse">
                            {wordsToProcess.length > 0 ? `${wordsToProcess.length} words remaining...` : 'Finalizing...'}
                        </p>
                    </>
                ) : error ? (
                    <div className="text-center">
                        <p className="text-cyber-secondary mb-4">{error}</p>
                        <button onClick={() => window.location.reload()} className="text-cyber-primary underline hover:text-cyan-300">Retry</button>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-gray-400 mb-4">
                            {wordsToProcess.length} words need definitions.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/30 rounded-lg hover:bg-cyber-primary/20 transition-colors font-medium flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw size={18} />
                            Retry Generation
                        </button>
                    </div>
                )}
            </div>
        );
    }

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % activeWords.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + activeWords.length) % activeWords.length);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-8">
            <div className="flex justify-between items-center w-full max-w-md px-4 text-gray-400 font-cyber">
                <span>Card <span className="text-cyber-primary">{currentIndex + 1}</span> of <span className="text-white">{activeWords.length}</span></span>
                <button onClick={() => setCurrentIndex(0)} className="hover:text-cyber-primary transition-colors" title="Restart">
                    <RefreshCw size={20} />
                </button>
            </div>

            <FlashCard
                item={details}
                onNext={handleNext}
                onPrev={handlePrev}
            />

            <div className="flex gap-4 mt-8">
                <button
                    onClick={handlePrev}
                    className="p-4 rounded-full bg-cyber-black border border-cyber-slate shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:bg-cyber-primary/10 hover:border-cyber-primary/50 text-gray-300 hover:text-white transition-all"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={handleNext}
                    className="p-4 rounded-full bg-cyber-primary text-cyber-black shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
};
