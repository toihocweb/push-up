import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { GroqService, type IELTSGenResult } from '../services/groq';
import { BookOpen, AlertCircle, Copy, Check, Sparkles, RefreshCw, Target, Link, Languages, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';

export const IELTSGenPage: React.FC = () => {
    const { groqApiKey, groqModel, trackGroqUsage } = useStore();
    const [taskType, setTaskType] = useState<'task1' | 'task2'>('task2');
    const [bandScore, setBandScore] = useState('8.0');
    const [topic, setTopic] = useState('');
    const [result, setResult] = useState<IELTSGenResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        if (!groqApiKey) {
            setError('Please set your Groq API key in Settings first.');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const groq = new GroqService(groqApiKey, groqModel);
            const { data, usage } = await groq.generateIELTSWriting(topic, taskType, bandScore);
            trackGroqUsage(usage);
            setResult(data);
        } catch (err) {
            console.error(err);
            setError('Failed to generate sample. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(`${result.essay}\n\n--- Analysis ---\n\n${result.analysis.overall}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white font-cyber tracking-wide text-glow flex items-center gap-3">
                        <Sparkles className="text-cyber-primary" size={32} />
                        IELTS Samples
                    </h1>
                    <p className="text-gray-400 mt-2">Generate model essays for specific band scores.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-cyber-gray p-6 rounded-xl border border-cyber-slate shadow-[0_0_20px_rgba(0,0,0,0.3)] space-y-6">
                        {/* Task Type Selector */}
                        <div>
                            <label className="block text-gray-400 mb-3 font-medium">Task Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setTaskType('task1')}
                                    className={clsx(
                                        'px-4 py-2 rounded-lg font-bold transition-all border',
                                        taskType === 'task1'
                                            ? 'bg-cyber-primary/20 border-cyber-primary text-cyber-primary shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                                            : 'bg-cyber-black border-cyber-slate text-gray-500 hover:text-gray-300'
                                    )}
                                >
                                    Task 1
                                </button>
                                <button
                                    onClick={() => setTaskType('task2')}
                                    className={clsx(
                                        'px-4 py-2 rounded-lg font-bold transition-all border',
                                        taskType === 'task2'
                                            ? 'bg-cyber-primary/20 border-cyber-primary text-cyber-primary shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                                            : 'bg-cyber-black border-cyber-slate text-gray-500 hover:text-gray-300'
                                    )}
                                >
                                    Task 2
                                </button>
                            </div>
                        </div>

                        {/* Band Score Selector */}
                        <div>
                            <label className="block text-gray-400 mb-3 font-medium flex justify-between">
                                Target Band Score
                                <span className="text-cyber-primary font-bold font-cyber">{bandScore}</span>
                            </label>
                            <input
                                type="range"
                                min="6.5"
                                max="9.0"
                                step="0.5"
                                value={bandScore}
                                onChange={(e) => setBandScore(e.target.value)}
                                className="w-full h-2 bg-cyber-black rounded-lg appearance-none cursor-pointer accent-cyber-primary"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
                                <span>6.5</span>
                                <span>7.0</span>
                                <span>7.5</span>
                                <span>8.0</span>
                                <span>8.5</span>
                                <span>9.0</span>
                            </div>
                        </div>

                        {/* Topic Input */}
                        <div>
                            <label className="block text-gray-400 mb-3 font-medium">Topic / Question</label>
                            <textarea
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder={taskType === 'task1' ? "Describe the chart showing..." : "Do you agree or disagree that..."}
                                className="w-full h-40 p-4 rounded-lg bg-cyber-black border border-cyber-slate focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary outline-none transition-all font-sans text-gray-200 placeholder-gray-600 resize-none"
                            />
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !topic.trim()}
                            className="w-full bg-cyber-primary hover:bg-cyan-400 text-cyber-black py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyber-black"></div>
                            ) : (
                                <Sparkles size={20} className={clsx("group-hover:animate-pulse")} />
                            )}
                            {loading ? 'Generating...' : 'Generate Sample'}
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg border border-red-500/30 flex items-start gap-3">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}
                </div>

                {/* Output Column */}
                <div className="lg:col-span-2 space-y-6">
                    {result ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Essay Section */}
                            <div className="bg-cyber-gray rounded-xl border border-cyber-slate overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                <div className="bg-cyber-black/50 p-4 border-b border-cyber-slate flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white font-cyber flex items-center gap-2">
                                        <BookOpen className="text-cyber-primary" size={20} />
                                        Model Essay (Band {bandScore})
                                    </h2>
                                    <button
                                        onClick={handleCopy}
                                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg flex items-center gap-2"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                                    </button>
                                </div>
                                <div className="p-6 text-gray-200 leading-relaxed font-serif text-lg whitespace-pre-wrap">
                                    <ReactMarkdown components={{
                                        strong: ({ node, ...props }) => <span className="text-cyber-primary font-bold bg-cyber-primary/10 px-1 rounded-sm" {...props} />
                                    }}>
                                        {result.essay}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {/* Analysis Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-white font-cyber mb-2">
                                    <RefreshCw className="text-cyber-purple" size={24} />
                                    <h2 className="text-xl font-bold">Detailed Analysis</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-cyber-gray p-4 rounded-xl border border-cyber-slate">
                                        <div className="flex items-center gap-2 mb-2 text-cyber-primary">
                                            <Target size={18} />
                                            <h3 className="font-bold">Task Response</h3>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed">{result.analysis.taskResponse}</p>
                                    </div>
                                    <div className="bg-cyber-gray p-4 rounded-xl border border-cyber-slate">
                                        <div className="flex items-center gap-2 mb-2 text-blue-400">
                                            <Link size={18} />
                                            <h3 className="font-bold">Coherence & Cohesion</h3>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed">{result.analysis.coherence}</p>
                                    </div>
                                    <div className="bg-cyber-gray p-4 rounded-xl border border-cyber-slate">
                                        <div className="flex items-center gap-2 mb-2 text-purple-400">
                                            <Languages size={18} />
                                            <h3 className="font-bold">Lexical Resource</h3>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed">{result.analysis.lexical}</p>
                                    </div>
                                    <div className="bg-cyber-gray p-4 rounded-xl border border-cyber-slate">
                                        <div className="flex items-center gap-2 mb-2 text-pink-400">
                                            <PenTool size={18} />
                                            <h3 className="font-bold">Grammatical Range</h3>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed">{result.analysis.grammar}</p>
                                    </div>
                                </div>

                                <div className="bg-cyber-primary/10 p-4 rounded-xl border border-cyber-primary/30">
                                    <h3 className="text-cyber-primary font-bold mb-2">Overall Verdict</h3>
                                    <p className="text-gray-200">{result.analysis.overall}</p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 min-h-[400px] border-2 border-dashed border-cyber-slate/30 rounded-xl bg-cyber-black/20">
                            <Sparkles size={48} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">Ready to Generate</p>
                            <p className="text-sm mt-2 max-w-md text-center">
                                Select your task type, target band score, and enter a topic to instantly generate a high-quality model essay with analysis.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
