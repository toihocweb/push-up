import React from 'react';
import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const StatsPage: React.FC = () => {
    const { getDetailedList } = useStore();
    const words = getDetailedList();

    const totalWords = words.length;
    const masteredWords = words.filter(w => (w.mastery || 0) >= 80).length;
    const learningWords = words.filter(w => (w.mastery || 0) > 0 && (w.mastery || 0) < 80).length;
    const newWords = words.filter(w => !w.attempts).length;

    const needsPractice = words
        .filter(w => (w.attempts || 0) > 0 && (w.mastery || 0) < 60)
        .sort((a, b) => (a.mastery || 0) - (b.mastery || 0))
        .slice(0, 5);

    const data = [
        { name: 'Mastered', count: masteredWords, color: '#22c55e' },
        { name: 'Learning', count: learningWords, color: '#3b82f6' },
        { name: 'New', count: newWords, color: '#94a3b8' },
    ];

    return (
        <div className="max-w-5xl mx-auto py-8 space-y-8">
            <h2 className="text-3xl font-bold text-slate-900">Your Progress</h2>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4"
                >
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Words</p>
                        <p className="text-2xl font-bold text-slate-900">{totalWords}</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4"
                >
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Mastered</p>
                        <p className="text-2xl font-bold text-slate-900">{masteredWords}</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4"
                >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Learning</p>
                        <p className="text-2xl font-bold text-slate-900">{learningWords}</p>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
                >
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Mastery Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Needs Practice */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <AlertCircle className="text-amber-500" size={20} />
                        <h3 className="text-lg font-bold text-slate-900">Needs Practice</h3>
                    </div>

                    {needsPractice.length > 0 ? (
                        <div className="space-y-4">
                            {needsPractice.map((word) => (
                                <div key={word.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-slate-900">{word.word}</p>
                                        <p className="text-xs text-slate-500">
                                            {word.correct || 0}/{word.attempts} correct
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                                            {word.mastery}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <p>No words need urgent practice.</p>
                            <p className="text-sm mt-2">Keep up the good work!</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
