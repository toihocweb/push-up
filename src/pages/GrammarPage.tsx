import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { GroqService, type GrammarIssue } from '../services/groq';
import { Sparkles, Check, X, Copy, AlertCircle, Wand2, RefreshCw, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

type Tab = 'grammar' | 'rewrite';
type StyleOption = 'Professional' | 'Friendly' | 'Academic' | 'Casual' | 'Concise' | 'Creative';

export const GrammarPage: React.FC = () => {
    const { groqApiKey, groqModel, trackGroqUsage } = useStore();
    const [text, setText] = useState('');
    const [issues, setIssues] = useState<GrammarIssue[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Rewrite State
    const [activeTab, setActiveTab] = useState<Tab>('grammar');
    const [targetStyle, setTargetStyle] = useState<StyleOption>('Professional');
    const [rewrittenText, setRewrittenText] = useState('');
    const [rewriting, setRewriting] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);

    const handleCheck = async () => {
        if (!text.trim()) return;
        if (!groqApiKey) {
            setError('Please set your Groq API key in Settings first.');
            return;
        }

        setLoading(true);
        setError('');
        setIssues([]);
        setActiveTab('grammar');

        try {
            const groq = new GroqService(groqApiKey, groqModel);
            const { data, usage } = await groq.checkGrammar(text);
            trackGroqUsage(usage);
            setIssues(data);
            if (data.length === 0) {
                // Optional: Show a "No issues found" toast or message
            }
        } catch (err) {
            console.error(err);
            setError('Failed to check grammar. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRewrite = async () => {
        if (!text.trim()) return;
        if (!groqApiKey) {
            setError('Please set your Groq API key in Settings first.');
            return;
        }

        setRewriting(true);
        setError('');
        setRewrittenText('');

        try {
            const groq = new GroqService(groqApiKey, groqModel);
            const { data, usage } = await groq.rewriteText(text, targetStyle);
            trackGroqUsage(usage);
            setRewrittenText(data);
        } catch (err) {
            console.error(err);
            setError('Failed to rewrite text. Please try again.');
        } finally {
            setRewriting(false);
        }
    };

    const applyFix = (issue: GrammarIssue) => {
        setText(prev => prev.replace(issue.original, issue.replacement));
        setIssues(prev => prev.filter(i => i !== issue));
    };

    const dismissIssue = (issue: GrammarIssue) => {
        setIssues(prev => prev.filter(i => i !== issue));
    };

    const copyToClipboard = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    const replaceOriginal = () => {
        setText(rewrittenText);
        setRewrittenText('');
        setActiveTab('grammar'); // Switch back to grammar to check the new text
    };

    // Sync scroll between textarea and highlight layer
    const handleScroll = () => {
        if (textareaRef.current && highlightRef.current) {
            highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    // Render text with highlights
    const renderHighlightedText = () => {
        if (!text) return null;

        const elements: React.ReactNode[] = [];

        const ranges: { start: number, end: number, type: string }[] = [];

        issues.forEach(issue => {
            const index = text.indexOf(issue.original);
            if (index !== -1) {
                ranges.push({
                    start: index,
                    end: index + issue.original.length,
                    type: issue.type
                });
            }
        });

        ranges.sort((a, b) => a.start - b.start);

        let currentIndex = 0;

        ranges.forEach((range, i) => {
            if (range.start < currentIndex) return;

            if (range.start > currentIndex) {
                elements.push(<span key={`text-${i}`}>{text.slice(currentIndex, range.start)}</span>);
            }

            elements.push(
                <span
                    key={`highlight-${i}`}
                    className={clsx(
                        "border-b-2 pb-0.5",
                        range.type === 'grammar' && "border-red-500 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
                        range.type === 'spelling' && "border-yellow-500 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.2)]",
                        range.type === 'style' && "border-blue-500 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]",
                        range.type === 'clarity' && "border-purple-500 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.2)]",
                        range.type === 'punctuation' && "border-gray-500 bg-gray-500/10 shadow-[0_0_10px_rgba(107,114,128,0.2)]",
                    )}
                >
                    {text.slice(range.start, range.end)}
                </span>
            );

            currentIndex = range.end;
        });

        if (currentIndex < text.length) {
            elements.push(<span key="text-end">{text.slice(currentIndex)}</span>);
        }

        if (ranges.length === 0) return <span>{text}</span>;

        return <>{elements}</>;
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-100px)]">
            {/* Left Column: Editor */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white font-cyber tracking-wide text-glow flex items-center gap-2">
                        <Wand2 className="text-cyber-primary" />
                        Grammar & Style Checker
                    </h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => copyToClipboard(text)}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                        >
                            <Copy size={16} />
                            Copy
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-cyber-gray rounded-xl border border-cyber-slate p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)] relative group focus-within:border-cyber-primary/50 transition-colors flex flex-col overflow-hidden">
                    <div className="relative flex-1 w-full h-full">
                        {/* Highlight Layer */}
                        <div
                            ref={highlightRef}
                            className="absolute inset-0 w-full h-full p-4 whitespace-pre-wrap break-words font-sans text-lg leading-relaxed text-transparent pointer-events-none overflow-auto custom-scrollbar"
                            aria-hidden="true"
                        >
                            {renderHighlightedText()}
                            {text.endsWith('\n') && <br />}
                        </div>

                        {/* Input Layer */}
                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onScroll={handleScroll}
                            placeholder="Paste your text here..."
                            className="absolute inset-0 w-full h-full p-4 bg-transparent border-none outline-none text-gray-200 text-lg resize-none font-sans leading-relaxed placeholder-gray-600 whitespace-pre-wrap break-words overflow-auto custom-scrollbar z-10"
                            spellCheck={false}
                        />
                    </div>

                    {/* Floating Action Button */}
                    <div className="absolute bottom-4 right-4 z-20">
                        <button
                            onClick={handleCheck}
                            disabled={loading || !text.trim()}
                            className="bg-cyber-primary hover:bg-cyan-400 text-cyber-black px-6 py-3 rounded-full font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyber-black"></div>
                            ) : (
                                <Sparkles size={20} />
                            )}
                            {loading ? 'Checking...' : 'Check Text'}
                        </button>
                    </div>
                </div>
                {error && (
                    <div className="bg-red-500/10 text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-500/30">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </div>

            {/* Right Column: Tools Panel */}
            <div className="lg:col-span-1 flex flex-col gap-4 h-full overflow-hidden">
                {/* Tabs */}
                <div className="flex p-1 bg-cyber-black rounded-lg border border-cyber-slate">
                    <button
                        onClick={() => setActiveTab('grammar')}
                        className={clsx(
                            "flex-1 py-2 text-sm font-bold rounded-md transition-all",
                            activeTab === 'grammar'
                                ? "bg-cyber-primary text-cyber-black shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        Issues ({issues.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('rewrite')}
                        className={clsx(
                            "flex-1 py-2 text-sm font-bold rounded-md transition-all",
                            activeTab === 'rewrite'
                                ? "bg-cyber-primary text-cyber-black shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        Rewrite
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    <AnimatePresence mode="wait">
                        {activeTab === 'grammar' ? (
                            <motion.div
                                key="grammar"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                {issues.length === 0 && !loading && text.trim() && (
                                    <div className="text-center py-10 text-gray-500">
                                        <Check size={48} className="mx-auto mb-4 text-green-500/50" />
                                        <p>No issues found. Great job!</p>
                                    </div>
                                )}

                                {issues.map((issue, index) => (
                                    <div
                                        key={index}
                                        className="bg-cyber-black border border-cyber-slate rounded-xl p-4 shadow-sm hover:border-cyber-primary/30 transition-colors group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={clsx(
                                                "text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                                                issue.type === 'grammar' && "bg-red-500/20 text-red-400",
                                                issue.type === 'spelling' && "bg-yellow-500/20 text-yellow-400",
                                                issue.type === 'style' && "bg-blue-500/20 text-blue-400",
                                                issue.type === 'clarity' && "bg-purple-500/20 text-purple-400",
                                                issue.type === 'punctuation' && "bg-gray-500/20 text-gray-400",
                                            )}>
                                                {issue.type}
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => dismissIssue(issue)}
                                                    className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                                                    title="Dismiss"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <div className="text-red-400 line-through text-sm mb-1 opacity-80">{issue.original}</div>
                                            <div className="text-green-400 font-bold text-lg flex items-center gap-2">
                                                {issue.replacement}
                                                <button
                                                    onClick={() => applyFix(issue)}
                                                    className="ml-auto bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide transition-colors border border-green-500/30"
                                                >
                                                    Accept
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            {issue.explanation}
                                        </p>
                                    </div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="rewrite"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Target Style</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['Professional', 'Friendly', 'Academic', 'Casual', 'Concise', 'Creative'] as StyleOption[]).map((style) => (
                                            <button
                                                key={style}
                                                onClick={() => setTargetStyle(style)}
                                                className={clsx(
                                                    "px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                                                    targetStyle === style
                                                        ? "bg-cyber-primary/20 border-cyber-primary text-cyber-primary shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                                                        : "bg-cyber-black border-cyber-slate text-gray-400 hover:border-gray-500 hover:text-gray-200"
                                                )}
                                            >
                                                {style}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleRewrite}
                                    disabled={rewriting || !text.trim()}
                                    className="w-full bg-cyber-primary hover:bg-cyan-400 text-cyber-black py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {rewriting ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyber-black"></div>
                                    ) : (
                                        <RefreshCw size={20} />
                                    )}
                                    {rewriting ? 'Rewriting...' : 'Rewrite Text'}
                                </button>

                                {rewrittenText && (
                                    <div className="bg-cyber-black border border-cyber-primary/30 rounded-xl p-4 space-y-4 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-white font-cyber">Result</h3>
                                            <button
                                                onClick={() => copyToClipboard(rewrittenText)}
                                                className="text-gray-400 hover:text-white transition-colors"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                        <p className="text-gray-200 leading-relaxed text-lg font-medium">
                                            {rewrittenText}
                                        </p>
                                        <button
                                            onClick={replaceOriginal}
                                            className="w-full bg-cyber-primary/10 hover:bg-cyber-primary/20 border border-cyber-primary/50 text-cyber-primary py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <ArrowRight size={18} />
                                            Replace Original
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
