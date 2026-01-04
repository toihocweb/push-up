import { create } from 'zustand';
import { get, set, del } from 'idb-keyval';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { SupabaseService } from '../services/supabase';

export interface VocabItem {
    id: string;
    word: string;
    definition: string;
    example: string;
    ipa?: string;
    mastery?: number; // 0-100
    attempts?: number;
    correct?: number;
    lastPracticed?: number;
}

interface AppState {
    rawWords: string[];
    activeWords: string[];
    vocabDetails: Record<string, VocabItem>;
    groqApiKey: string;
    groqModel: string;
    supabaseUrl: string;
    supabaseKey: string;

    // Persisted Content
    quizQuestions: any[];
    writingQuestions: any[];
    quizAnswers: Record<number, { answer: string; correct: boolean }>;
    writingAnswers: Record<number, { answer: string; correct: boolean }>;
    story: string;
    currentQuizIndex: number;
    currentWritingIndex: number;
    totalSpend: number;

    setRawWords: (words: string[]) => void;
    setActiveWords: (words: string[]) => void;
    addVocabDetails: (details: VocabItem[]) => void;
    removeWord: (word: string) => void;
    setGroqApiKey: (key: string) => void;
    setGroqModel: (model: string) => void;
    setSupabaseConfig: (url: string, key: string) => void;
    syncWithSupabase: () => Promise<void>;

    setQuizQuestions: (questions: any[]) => void;
    setWritingQuestions: (questions: any[]) => void;
    setQuizAnswer: (index: number, answer: string, correct: boolean) => void;
    setWritingAnswer: (index: number, answer: string, correct: boolean) => void;
    resetQuiz: () => void;
    resetWriting: () => void;
    resetQuizProgress: () => void;
    resetWritingProgress: () => void;
    setStory: (story: string) => void;
    setCurrentQuizIndex: (index: number) => void;
    setCurrentWritingIndex: (index: number) => void;

    updateWordProgress: (word: string, isCorrect: boolean) => void;
    trackGroqUsage: (usage: { prompt_tokens: number, completion_tokens: number }) => void;

    // Computed helpers
    getDetailedList: () => VocabItem[];
}

// Custom storage adapter for IndexedDB with migration support
const storage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        const value = await get(name);
        return value || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await set(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name);
    },
};

const PRICING: Record<string, { input: number, output: number }> = {
    'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
    'llama3-8b-8192': { input: 0.05, output: 0.08 },
    'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
    'mixtral-8x7b-32768': { input: 0.24, output: 0.24 },
    'gemma2-9b-it': { input: 0.20, output: 0.20 },
};

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            rawWords: [],
            activeWords: [],
            vocabDetails: {},
            groqApiKey: '',
            groqModel: 'llama-3.1-8b-instant',
            supabaseUrl: '',
            supabaseKey: '',

            quizQuestions: [],
            writingQuestions: [],
            quizAnswers: {},
            writingAnswers: {},
            story: '',
            currentQuizIndex: 0,
            currentWritingIndex: 0,
            totalSpend: 0,

            setRawWords: (words) => set({ rawWords: words }),
            setActiveWords: (words) => set({ activeWords: words }),

            addVocabDetails: async (details) => {
                const state = get();

                // Optimistic update
                set((state) => {
                    const newDetails = { ...state.vocabDetails };
                    details.forEach(item => {
                        const existing = newDetails[item.word.toLowerCase()];
                        newDetails[item.word.toLowerCase()] = {
                            ...item,
                            mastery: existing?.mastery || 0,
                            attempts: existing?.attempts || 0,
                            correct: existing?.correct || 0,
                            lastPracticed: existing?.lastPracticed || 0,
                        };
                    });
                    return { vocabDetails: newDetails };
                });

                // Sync to Supabase if configured
                if (state.supabaseUrl && state.supabaseKey) {
                    try {
                        const supabase = new SupabaseService(state.supabaseUrl, state.supabaseKey);
                        for (const item of details) {
                            const currentItem = get().vocabDetails[item.word.toLowerCase()];
                            await supabase.addWord(currentItem);
                        }
                    } catch (err) {
                        console.error('Failed to sync with Supabase:', err);
                    }
                }
            },

            removeWord: async (word) => {
                const state = get();

                set((state) => {
                    const newRawWords = state.rawWords.filter(w => w !== word);
                    const newDetails = { ...state.vocabDetails };
                    delete newDetails[word.toLowerCase()];
                    return { rawWords: newRawWords, vocabDetails: newDetails };
                });

                if (state.supabaseUrl && state.supabaseKey) {
                    try {
                        const supabase = new SupabaseService(state.supabaseUrl, state.supabaseKey);
                        await supabase.deleteWord(word);
                    } catch (err) {
                        console.error('Failed to delete from Supabase:', err);
                    }
                }
            },

            setGroqApiKey: (key) => set({ groqApiKey: key }),
            setGroqModel: (model) => set({ groqModel: model }),
            setSupabaseConfig: (url, key) => set({ supabaseUrl: url, supabaseKey: key }),

            syncWithSupabase: async () => {
                const state = get();
                if (!state.supabaseUrl || !state.supabaseKey) return;

                try {
                    const supabase = new SupabaseService(state.supabaseUrl, state.supabaseKey);

                    // Check connection first
                    const check = await supabase.checkConnection();
                    if (!check.connected) {
                        if (check.error === 'table_missing') {
                            throw new Error('table_missing');
                        }
                        throw check.error || new Error('Connection failed');
                    }

                    const remoteWords = await supabase.getVocabulary();

                    const newDetails: Record<string, VocabItem> = {};
                    const newRawWords: string[] = [];

                    remoteWords.forEach(item => {
                        newDetails[item.word.toLowerCase()] = item;
                        if (!newRawWords.includes(item.word)) {
                            newRawWords.push(item.word);
                        }
                    });

                    set((state) => {
                        const validActiveWords = state.activeWords.filter(w => newDetails[w.toLowerCase()]);
                        return {
                            vocabDetails: newDetails,
                            rawWords: newRawWords,
                            activeWords: validActiveWords
                        };
                    });
                } catch (err) {
                    console.error('Sync failed:', err);
                    throw err;
                }
            },

            setQuizQuestions: (questions) => set({ quizQuestions: questions }),
            setWritingQuestions: (questions) => set({ writingQuestions: questions }),

            setQuizAnswer: (index, answer, correct) => set((state) => ({
                quizAnswers: { ...state.quizAnswers, [index]: { answer, correct } }
            })),

            setWritingAnswer: (index, answer, correct) => set((state) => ({
                writingAnswers: { ...state.writingAnswers, [index]: { answer, correct } }
            })),

            resetQuiz: () => set({ quizQuestions: [], quizAnswers: {}, currentQuizIndex: 0 }),
            resetWriting: () => set({ writingQuestions: [], writingAnswers: {}, currentWritingIndex: 0 }),

            resetQuizProgress: () => set({ quizAnswers: {}, currentQuizIndex: 0 }),
            resetWritingProgress: () => set({ writingAnswers: {}, currentWritingIndex: 0 }),

            setStory: (story) => set({ story }),
            setCurrentQuizIndex: (index) => set({ currentQuizIndex: index }),
            setCurrentWritingIndex: (index) => set({ currentWritingIndex: index }),

            updateWordProgress: async (word, isCorrect) => {
                const state = get();
                let updatedItem: VocabItem | null = null;

                set((state) => {
                    const lowerWord = word.toLowerCase();
                    const item = state.vocabDetails[lowerWord];
                    if (!item) return state;

                    const attempts = (item.attempts || 0) + 1;
                    const correct = (item.correct || 0) + (isCorrect ? 1 : 0);
                    const mastery = Math.round((correct / attempts) * 100);

                    updatedItem = {
                        ...item,
                        attempts,
                        correct,
                        mastery,
                        lastPracticed: Date.now(),
                    };

                    return {
                        vocabDetails: {
                            ...state.vocabDetails,
                            [lowerWord]: updatedItem
                        }
                    };
                });

                if (state.supabaseUrl && state.supabaseKey && updatedItem) {
                    try {
                        const supabase = new SupabaseService(state.supabaseUrl, state.supabaseKey);
                        await supabase.updateWordProgress(updatedItem);
                    } catch (err) {
                        console.error('Failed to update progress in Supabase:', err);
                    }
                }
            },

            trackGroqUsage: (usage) => {
                const state = get();
                const model = state.groqModel;
                const pricing = PRICING[model] || PRICING['llama-3.1-8b-instant'];

                const inputCost = (usage.prompt_tokens / 1_000_000) * pricing.input;
                const outputCost = (usage.completion_tokens / 1_000_000) * pricing.output;
                const totalCost = inputCost + outputCost;

                set((state) => ({
                    totalSpend: (state.totalSpend || 0) + totalCost
                }));
            },

            getDetailedList: () => {
                const state = get();
                return state.rawWords
                    .map(word => state.vocabDetails[word.toLowerCase()])
                    .filter(Boolean);
            }
        }),
        {
            name: 'english-app-storage-v2',
            storage: createJSONStorage(() => storage),
        }
    )
);
