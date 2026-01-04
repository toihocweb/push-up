import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { GroqService, type IELTSFeedback } from '../services/groq';
import { BookOpen, Send, AlertCircle, CheckCircle, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const IELTSPage: React.FC = () => {
    const { groqApiKey, groqModel, trackGroqUsage } = useStore();
    const [taskType, setTaskType] = useState<'task1' | 'task2'>('task2');
    const [essayPrompt, setEssayPrompt] = useState('');
    const [essayText, setEssayText] = useState('');
    const [result, setResult] = useState<IELTSFeedback | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Load saved data on mount
    useEffect(() => {
        const savedPrompt = localStorage.getItem('ielts_prompt');
        const savedEssay = localStorage.getItem('ielts_essay');
        const savedTaskType = localStorage.getItem('ielts_task_type');

        if (savedPrompt) setEssayPrompt(savedPrompt);
        if (savedEssay) setEssayText(savedEssay);
        if (savedTaskType === 'task1' || savedTaskType === 'task2') setTaskType(savedTaskType);
    }, []);

    // Save data on changes
    useEffect(() => {
        localStorage.setItem('ielts_prompt', essayPrompt);
    }, [essayPrompt]);

    useEffect(() => {
        localStorage.setItem('ielts_essay', essayText);
    }, [essayText]);

    useEffect(() => {
        localStorage.setItem('ielts_task_type', taskType);
    }, [taskType]);

    const handleScore = async () => {
        if (!essayText.trim()) return;
        if (!groqApiKey) {
            setError('Please set your Groq API key in Settings first.');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const groq = new GroqService(groqApiKey, groqModel);
            const { data, usage } = await groq.scoreIELTSWriting(essayText, taskType, essayPrompt);
            trackGroqUsage(usage);
            setResult(data);
        } catch (err) {
            console.error(err);
            setError('Failed to score essay. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-400';
        if (score >= 6.5) return 'text-cyber-primary';
        if (score >= 5) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white font-cyber tracking-wide text-glow flex items-center gap-3">
                    <BookOpen className="text-cyber-primary" size={32} />
                    IELTS Writing Scorer
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-150px)]">
                {/* Input Section */}
                <div className="space-y-4 flex flex-col h-full">
                    <div className="bg-cyber-gray rounded-xl border border-cyber-slate p-6 shadow-[0_0_20px_rgba(0,0,0,0.3)] flex-1 flex flex-col overflow-hidden">

                        {/* Task Type Toggle */}
                        <div className="flex gap-4 mb-6 bg-cyber-black p-1 rounded-lg border border-cyber-slate/50 w-fit">
                            <button
                                onClick={() => setTaskType('task1')}
                                className={clsx(
                                    "px-4 py-2 rounded-md font-bold transition-all",
                                    taskType === 'task1'
                                        ? "bg-cyber-primary text-cyber-black shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                                        : "text-gray-400 hover:text-white"
                                )}
                            >
                                Task 1
                            </button>
                            <button
                                onClick={() => setTaskType('task2')}
                                className={clsx(
                                    "px-4 py-2 rounded-md font-bold transition-all",
                                    taskType === 'task2'
                                        ? "bg-cyber-primary text-cyber-black shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                                        : "text-gray-400 hover:text-white"
                                )}
                            >
                                Task 2
                            </button>
                        </div>

                        {/* Prompt Input */}
                        <div className="mb-4">
                            <label className="block text-gray-400 mb-2 font-medium text-sm">Essay Prompt (Optional)</label>
                            <textarea
                                value={essayPrompt}
                                onChange={(e) => setEssayPrompt(e.target.value)}
                                placeholder="Paste the question or topic here..."
                                className="w-full h-24 p-3 rounded-lg bg-cyber-black border border-cyber-slate focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary outline-none transition-all font-sans text-white placeholder-gray-700 resize-none"
                            />
                        </div>

                        {/* Essay Input */}
                        <div className="flex-1 flex flex-col">
                            <label className="block text-gray-400 mb-2 font-medium text-sm">Your Essay</label>
                            <textarea
                                value={essayText}
                                onChange={(e) => setEssayText(e.target.value)}
                                placeholder="Start writing your essay here..."
                                className="w-full flex-1 p-4 rounded-lg bg-cyber-black border border-cyber-slate focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary outline-none transition-all font-mono text-lg resize-none text-white placeholder-gray-700"
                            />
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleScore}
                                disabled={loading || !essayText.trim()}
                                className="bg-cyber-primary hover:bg-cyan-400 text-cyber-black px-8 py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyber-black"></div>
                                ) : (
                                    <Send size={20} />
                                )}
                                {loading ? 'Scoring...' : 'Score Essay'}
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 bg-red-500/10 text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-500/30">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Result Section */}
                <div className="space-y-4 h-full overflow-hidden">
                    <div className="bg-cyber-gray rounded-xl border border-cyber-slate p-6 shadow-[0_0_20px_rgba(0,0,0,0.3)] h-full overflow-auto custom-scrollbar">
                        {!result ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 opacity-50">
                                <BarChart2 size={64} className="mb-4" />
                                <p className="text-xl font-cyber">Ready to Score</p>
                                <p className="text-sm mt-2 text-center">Enter your essay and click Score to get detailed feedback based on official IELTS criteria.</p>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Overall Score Header */}
                                <div className="flex items-center justify-between border-b border-cyber-slate/50 pb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white font-cyber">Overall Band Score</h2>
                                        <p className="text-gray-400 mt-1">Based on official descriptors</p>
                                    </div>
                                    <div className={clsx("text-6xl font-bold font-cyber text-glow", getScoreColor(result.overallScore))}>
                                        {result.overallScore}
                                    </div>
                                </div>

                                {/* General Feedback */}
                                <div className="bg-white/5 p-4 rounded-lg border border-cyber-slate/30">
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                        <CheckCircle size={18} className="text-cyber-primary" />
                                        General Feedback
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed">{result.generalFeedback}</p>
                                </div>

                                {/* Criteria Breakdown */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CriteriaCard
                                        title={taskType === 'task1' ? "Task Achievement" : "Task Response"}
                                        score={result.criteriaScores.taskAchievement}
                                        feedback={result.feedback.taskAchievement}
                                        color={getScoreColor(result.criteriaScores.taskAchievement)}
                                    />
                                    <CriteriaCard
                                        title="Coherence & Cohesion"
                                        score={result.criteriaScores.coherenceCohesion}
                                        feedback={result.feedback.coherenceCohesion}
                                        color={getScoreColor(result.criteriaScores.coherenceCohesion)}
                                    />
                                    <CriteriaCard
                                        title="Lexical Resource"
                                        score={result.criteriaScores.lexicalResource}
                                        feedback={result.feedback.lexicalResource}
                                        color={getScoreColor(result.criteriaScores.lexicalResource)}
                                    />
                                    <CriteriaCard
                                        title="Grammatical Range"
                                        score={result.criteriaScores.grammaticalRange}
                                        feedback={result.feedback.grammaticalRange}
                                        color={getScoreColor(result.criteriaScores.grammaticalRange)}
                                    />
                                </div>

                                {/* Improvements */}
                                <div className="bg-cyber-primary/5 p-6 rounded-lg border border-cyber-primary/20">
                                    <h3 className="text-lg font-bold text-cyber-primary mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-cyber-primary rounded-full animate-pulse" />
                                        Key Improvements
                                    </h3>
                                    <ul className="space-y-3">
                                        {result.improvements.map((imp, idx) => (
                                            <li key={idx} className="flex gap-3 text-gray-300">
                                                <span className="text-cyber-primary font-bold">{idx + 1}.</span>
                                                {imp}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CriteriaCard: React.FC<{ title: string, score: number, feedback: string, color: string }> = ({ title, score, feedback, color }) => (
    <div className="bg-cyber-black p-4 rounded-lg border border-cyber-slate/50 hover:border-cyber-primary/50 transition-colors">
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-gray-200">{title}</h4>
            <span className={clsx("text-xl font-bold font-cyber", color)}>{score}</span>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">{feedback}</p>
    </div>
);
