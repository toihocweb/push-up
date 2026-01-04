
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Save, AlertCircle, Trash2, Search, RefreshCw, Shuffle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Home: React.FC = () => {
    const {
        rawWords,
        setRawWords,
        activeWords,
        setActiveWords,
        vocabDetails,
        addVocabDetails,
        removeWord,
        groqApiKey,
        groqModel,
        trackGroqUsage
    } = useStore();
    const [text, setText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [saved, setSaved] = useState(false);

    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState('');

    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateTopic, setGenerateTopic] = useState('');

    useEffect(() => {
        // Initialize text from activeWords (Focus List)
        if (activeWords.length > 0 && !text) {
            setText(activeWords.join('\n'));
        }
    }, []); // Only run on mount

    // Sync text to activeWords live
    useEffect(() => {
        const words = text
            .split(/[\n,]+/)
            .map(w => w.trim().replace(/\s+/g, ' '))
            .filter(w => w.length > 0);

        // Deep compare to avoid unnecessary updates
        const isSame = words.length === activeWords.length &&
            words.every((w, i) => w === activeWords[i]);

        if (!isSame) {
            setActiveWords(words);
        }
    }, [text, activeWords, setActiveWords]);

    const handleSave = async () => {
        const words = text
            .split(/[\n,]+/) // Split by newline or comma
            .map(w => w.trim().replace(/\s+/g, ' ')) // Normalize spaces
            .filter(w => w.length > 0);

        // Remove duplicates for repository
        const uniqueWords = Array.from(new Set([...rawWords, ...words]));

        // Update both repository and active list
        setRawWords(uniqueWords);
        setActiveWords(words); // Active list is exactly what's in the textarea

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);

        // Auto-generate definitions for new words
        const wordsToProcess = uniqueWords.filter(w => !vocabDetails[w.toLowerCase()]);

        if (wordsToProcess.length > 0 && groqApiKey) {
            try {
                const { GroqService } = await import('../services/groq');

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
                        console.error('Failed to auto-generate definitions for chunk:', err);
                    }

                    // Small delay to avoid rate limits
                    if (i + chunkSize < wordsToProcess.length) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            } catch (err) {
                console.error('Failed to auto-generate definitions:', err);
                setGenError('Saved, but failed to generate definitions. Check API Key.');
            }
        }
    };

    const handleRandomFromSaved = () => {
        // Get current words to exclude them
        const currentWords = text
            .split(/[\n,]+/)
            .map(w => w.trim().replace(/\s+/g, ' '))
            .filter(w => w.length > 0);

        // Filter rawWords to find ones NOT currently shown
        const availableWords = rawWords.filter(w =>
            !currentWords.some(current => current.toLowerCase() === w.toLowerCase())
        );

        if (availableWords.length === 0) {
            setGenError('All saved words are already in the list!');
            setTimeout(() => setGenError(''), 3000);
            return;
        }

        // Shuffle and pick up to 5
        const shuffled = [...availableWords].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5);

        // Append to text
        setText(prev => {
            const current = prev.trim();
            return current ? `${current} \n${selected.join('\n')} ` : selected.join('\n');
        });
    };

    const handleGenerate = async (topic: string) => {
        if (!groqApiKey) {
            setGenError('Please set API Key in Settings first');
            return;
        }

        setGenerating(true);
        setGenError('');

        try {
            const { GroqService } = await import('../services/groq');
            const groq = new GroqService(groqApiKey, groqModel);

            // Get current words from text area to ensure we exclude everything currently visible
            const currentWords = text
                .split(/[\n,]+/)
                .map(w => w.trim().replace(/\s+/g, ' '))
                .filter(w => w.length > 0);

            // Pass all known words to exclude (saved + current)
            const allExcludedWords = Array.from(new Set([
                ...rawWords,
                ...currentWords
            ]));

            const { data: newWords, usage } = await groq.generateVocabularyList(topic, 10, allExcludedWords);

            trackGroqUsage(usage);

            // Double check filtering on client side
            const uniqueNewWords = newWords.filter(w =>
                !allExcludedWords.some(existing => existing.toLowerCase() === w.toLowerCase())
            );

            if (uniqueNewWords.length === 0) {
                setGenError('Could not generate new unique words. Try a different topic.');
                return;
            }

            setText(prev => {
                const current = prev.trim();
                return current ? `${current} \n${uniqueNewWords.join('\n')} ` : uniqueNewWords.join('\n');
            });
        } catch (err) {
            console.error(err);
            setGenError('Failed to generate words');
        } finally {
            setGenerating(false);
        }
    };

    const confirmGenerate = () => {
        if (!generateTopic.trim()) return;
        setShowGenerateModal(false);
        handleGenerate(generateTopic);
    };

    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');

    const generatedCount = rawWords.filter(w => vocabDetails[w.toLowerCase()]).length;

    const sortedAndFilteredItems = React.useMemo(() => {
        // 1. Get ALL items from rawWords (Source of Truth for order and existence)
        // Map rawWords to VocabItem objects, falling back if details missing
        let items = rawWords.map(word => {
            const details = vocabDetails[word.toLowerCase()];
            if (details) return details;

            // Fallback for words without definitions
            return {
                id: `temp-${word.toLowerCase()}`, // Normalize ID for temp items too
                word: word,
                definition: 'Definition not generated yet.',
                example: '...',
                mastery: 0,
                attempts: 0,
                correct: 0,
                lastPracticed: 0
            };
        });

        // Deduplicate by ID
        const seenIds = new Set();
        items = items.filter(item => {
            if (seenIds.has(item.id)) return false;
            seenIds.add(item.id);
            return true;
        });

        // 2. Filter by search query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.word.toLowerCase().includes(lowerQuery) ||
                item.definition.toLowerCase().includes(lowerQuery)
            );
        }

        // 3. Sort
        return items.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    // Use rawWords index as proxy for time (assuming new words appended)
                    // Higher index = Newest
                    {
                        const indexA = rawWords.indexOf(a.word);
                        const indexB = rawWords.indexOf(b.word);
                        // If both exist, higher index first
                        if (indexA !== -1 && indexB !== -1) return indexB - indexA;
                        // If one exists, it comes first (considered newer than orphaned)
                        if (indexA !== -1) return -1;
                        if (indexB !== -1) return 1;
                        return 0;
                    }
                case 'oldest':
                    // Lower index = Oldest
                    {
                        const indexA = rawWords.indexOf(a.word);
                        const indexB = rawWords.indexOf(b.word);
                        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                        if (indexA !== -1) return -1; // Existing comes before orphan? Or after? 
                        // Let's say orphans are "oldest" (unknown time), so they go to bottom?
                        // Actually, let's keep it simple:
                        if (indexA !== -1) return -1;
                        if (indexB !== -1) return 1;
                        return 0;
                    }
                case 'az':
                    return a.word.localeCompare(b.word);
                case 'za':
                    return b.word.localeCompare(a.word);
                default:
                    return 0;
            }
        });
    }, [rawWords, vocabDetails, searchQuery, sortBy]);

    return (
        <div className="max-w-7xl mx-auto space-y-8 py-8">
            {/* Generate Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-cyber-gray rounded-xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(0,240,255,0.2)] border border-cyber-primary/30"
                    >
                        <h3 className="text-xl font-bold text-white font-cyber mb-4 text-glow">Generate Vocabulary</h3>
                        <p className="text-gray-400 mb-4">Enter a topic to generate advanced vocabulary words.</p>

                        <input
                            type="text"
                            value={generateTopic}
                            onChange={(e) => setGenerateTopic(e.target.value)}
                            placeholder="e.g., Business, Space, Cooking, IELTS..."
                            className="w-full px-4 py-3 rounded-lg bg-cyber-black border border-cyber-slate text-white focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary outline-none mb-6 placeholder-gray-600"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && confirmGenerate()}
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowGenerateModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmGenerate}
                                disabled={!generateTopic.trim()}
                                className="px-6 py-2 bg-cyber-primary text-cyber-black rounded-lg font-bold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                            >
                                Generate
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left Column: Input and Controls */}
                <div className="space-y-6">
                    <div className="bg-cyber-gray p-6 rounded-xl shadow-lg border border-cyber-slate/50 space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-primary to-cyber-purple" />
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="apple&#10;banana&#10;curious&#10;..."
                            className="w-full h-[calc(100vh-300px)] min-h-[400px] p-4 rounded-lg bg-cyber-black border border-cyber-slate focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary outline-none transition-all font-mono text-lg resize-y text-cyber-primary placeholder-gray-700"
                        />

                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                {rawWords.length > 0 ? (
                                    <span>
                                        <span className="text-cyber-primary font-bold">{rawWords.length}</span> words saved. <span className="text-cyber-purple font-bold">{generatedCount}</span> have definitions.
                                    </span>
                                ) : (
                                    <span>No words saved yet.</span>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleRandomFromSaved}
                                    disabled={rawWords.length === 0}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-cyber-primary bg-cyber-primary/10 border border-cyber-primary/30 hover:bg-cyber-primary/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    title="Add 5 random words from your saved library"
                                >
                                    <Shuffle size={16} />
                                    Random 5
                                </button>
                                <button
                                    onClick={() => {
                                        setGenerateTopic('');
                                        setShowGenerateModal(true);
                                    }}
                                    disabled={generating}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-cyber-primary bg-cyber-primary/10 border border-cyber-primary/30 hover:bg-cyber-primary/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {generating ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-cyber-primary border-t-transparent rounded-full animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw size={16} />
                                            Generate Random
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="bg-cyber-primary hover:bg-cyan-400 text-cyber-black px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                                >
                                    <Save size={18} />
                                    {saved ? 'Saved!' : 'Save List'}
                                </button>
                            </div>
                        </div>
                        {genError && (
                            <div className="text-cyber-secondary text-sm flex items-center gap-2 mt-2 font-medium">
                                <AlertCircle size={16} />
                                {genError}
                            </div>
                        )}
                    </div>

                    {rawWords.length > 0 && generatedCount < rawWords.length && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-cyber-primary/5 text-cyber-primary p-4 rounded-xl flex items-start gap-3 border border-cyber-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                        >
                            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-bold font-cyber tracking-wide">Definitions needed</p>
                                <p className="text-sm mt-1 text-gray-300">
                                    Go to the <strong className="text-white">Flashcards</strong> or <strong className="text-white">Quiz</strong> tab to automatically generate definitions for your new words using Groq AI.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right Column: Vocabulary List */}
                <div className="space-y-4 lg:sticky lg:top-24 max-h-[calc(100vh-100px)] overflow-y-auto pr-2 custom-scrollbar">
                    {rawWords.length > 0 ? (
                        <>
                            <div className="flex justify-between items-center flex-wrap gap-4 bg-cyber-gray p-4 rounded-xl border border-cyber-slate sticky top-0 z-10 shadow-lg">
                                <h2 className="text-xl font-bold text-white font-cyber tracking-wide">Your Vocabulary <span className="text-cyber-primary">({rawWords.length})</span></h2>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="px-3 py-1.5 rounded-lg bg-cyber-black border border-cyber-slate text-sm text-gray-300 focus:border-cyber-primary outline-none"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="az">A-Z</option>
                                    <option value="za">Z-A</option>
                                </select>
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search words or definitions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-cyber-black border border-cyber-slate focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary outline-none transition-all text-white placeholder-gray-600"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {sortedAndFilteredItems.map((item) => {
                                    const isSelected = text.toLowerCase().split(/[\n,]+/).map(w => w.trim()).includes(item.word.toLowerCase());

                                    return (
                                        <div key={item.id} className="relative bg-cyber-black p-4 rounded-lg border border-cyber-slate flex justify-between items-center group hover:border-cyber-primary/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        const word = item.word;
                                                        setText(prev => {
                                                            const currentWords = prev.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 0);
                                                            if (e.target.checked) {
                                                                // Add word
                                                                if (!currentWords.some(w => w.toLowerCase() === word.toLowerCase())) {
                                                                    return [...currentWords, word].join('\n');
                                                                }
                                                                return prev;
                                                            } else {
                                                                // Remove word
                                                                return currentWords.filter(w => w.toLowerCase() !== word.toLowerCase()).join('\n');
                                                            }
                                                        });
                                                    }}
                                                    className="w-5 h-5 accent-cyber-primary bg-cyber-gray border-cyber-slate rounded focus:ring-cyber-primary flex-shrink-0 cursor-pointer"
                                                />
                                                <div className="min-w-0">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="font-bold text-white truncate font-cyber tracking-wide">{item.word}</span>
                                                        {item.ipa && <span className="text-xs text-cyber-purple font-mono flex-shrink-0">/{item.ipa}/</span>}
                                                    </div>
                                                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{item.definition}</p>
                                                </div>
                                            </div>

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full right-0 mb-3 w-72 p-4 bg-cyber-gray border border-cyber-primary/30 text-white text-sm rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-20 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
                                                <p className="font-bold text-cyber-primary mb-1 capitalize font-cyber">{item.word}</p>
                                                <p className="mb-3 leading-relaxed text-gray-300">{item.definition}</p>
                                                <div className="bg-cyber-black p-2 rounded-lg border border-cyber-slate">
                                                    <p className="italic text-cyber-accent text-xs">"{item.example}"</p>
                                                </div>
                                                {/* Arrow */}
                                                <div className="absolute top-full right-8 border-8 border-transparent border-t-cyber-primary/30"></div>
                                            </div>

                                            <button
                                                onClick={() => removeWord(item.word)}
                                                className="text-gray-600 hover:text-cyber-secondary p-2 rounded-full hover:bg-cyber-secondary/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ml-2 flex-shrink-0"
                                                title="Delete word"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600 py-12">
                            <p>No vocabulary saved yet.</p>
                            <p className="text-sm">Generate some words to get started!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
