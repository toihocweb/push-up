import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { GroqService } from '../services/groq';

export const StoryGenerator: React.FC = () => {
    const { activeWords, groqApiKey, groqModel, story, setStory, trackGroqUsage } = useStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateStory = async () => {
        if (!groqApiKey) {
            setError('Please set your Groq API key in Settings first.');
            return;
        }

        if (activeWords.length === 0) {
            setError('Please add some vocabulary words first.');
            return;
        }

        setLoading(true);
        setError('');
        setStory('');

        try {
            const groq = new GroqService(groqApiKey, groqModel);
            const { data: result, usage } = await groq.generateStory(activeWords);
            trackGroqUsage(usage);
            setStory(result);
        } catch (err) {
            setError('Failed to generate story. Please check your API key and try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                {!story && (
                    <>
                        <button
                            onClick={generateStory}
                            disabled={loading}
                            className="bg-cyber-primary hover:bg-cyan-400 text-cyber-black px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transform hover:scale-105 transition-all flex items-center gap-3 mx-auto disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyber-black"></div>
                            ) : (
                                <Sparkles size={24} />
                            )}
                            {loading ? 'Generating Magic...' : 'Generate Story'}
                        </button>
                        <p className="text-gray-400 text-sm">
                            Uses Groq AI to create a unique story with your {activeWords.length} words
                        </p>
                    </>
                )}
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-xl flex items-center gap-3 border border-red-500/30">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {story && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-cyber-gray p-8 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-cyber-slate prose prose-invert max-w-none relative"
                >
                    <div className="flex justify-between items-start mb-6 border-b border-cyber-slate pb-4">
                        <div className="flex items-center gap-2 text-cyber-primary font-bold font-cyber tracking-wide text-glow">
                            <BookOpen size={20} />
                            <span>Your Generated Story</span>
                        </div>
                        <button
                            onClick={generateStory}
                            disabled={loading}
                            className="text-gray-400 hover:text-cyber-primary transition-colors p-2 rounded-lg hover:bg-white/5"
                            title="Regenerate Story"
                        >
                            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyber-primary"></div> : <Sparkles size={20} />}
                        </button>
                    </div>

                    <div className="text-lg leading-relaxed text-gray-300 font-sans">
                        {story.split('**').map((part, i) =>
                            i % 2 === 1 ? <strong key={i} className="text-cyber-primary font-bold">{part}</strong> : part
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};
