
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book, Brain, Settings as SettingsIcon, GraduationCap, PenTool, TrendingUp, Wand2, FileSpreadsheet, BookOpen, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const { syncWithSupabase, supabaseUrl, supabaseKey } = useStore();

    useEffect(() => {
        // Fetch from Supabase on mount (Global sync)
        if (supabaseUrl && supabaseKey) {
            syncWithSupabase().catch(err => console.error('Failed to sync on mount:', err));
        }
    }, [supabaseUrl, supabaseKey, syncWithSupabase]);

    const navItems = [
        { path: '/', icon: Book, label: 'Vocab' },
        { path: '/flashcards', icon: Brain, label: 'Cards' },
        { path: '/quiz', icon: GraduationCap, label: 'Quiz' },
        { path: '/writing', icon: PenTool, label: 'Writing' },
        { path: '/story', icon: Book, label: 'Story' },
        { path: '/grammar', icon: Wand2, label: 'Grammar' },
        { path: '/export', icon: FileSpreadsheet, label: 'Export' },
        { path: '/ielts', icon: BookOpen, label: 'IELTS Scorer' },
        { path: '/ielts-samples', icon: Sparkles, label: 'Samples' },
        { path: '/stats', icon: TrendingUp, label: 'Stats' },
        { path: '/settings', icon: SettingsIcon, label: 'Settings' },
    ];

    return (
        <div className="flex min-h-screen bg-cyber-black text-gray-200 font-sans selection:bg-cyber-primary selection:text-cyber-black">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-cyber-gray border-r border-cyber-slate fixed h-full z-50 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
                <div className="p-6">
                    <div className="font-cyber font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary to-cyber-purple tracking-wider text-glow">
                        IELTS PUSH-UP
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-none border-l-2 transition-all duration-200 group relative overflow-hidden',
                                    isActive
                                        ? 'border-cyber-primary bg-cyber-primary/10 text-cyber-primary'
                                        : 'border-transparent text-gray-400 hover:text-gray-100 hover:bg-white/5 hover:border-gray-500'
                                )}
                            >
                                <Icon size={20} className={clsx(
                                    "transition-colors relative z-10",
                                    isActive ? "text-cyber-primary drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" : "group-hover:text-white"
                                )} />
                                <span className={clsx("font-medium relative z-10", isActive && "font-cyber tracking-wide")}>{item.label}</span>

                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyber-primary/20 to-transparent opacity-50" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-cyber-slate bg-cyber-black/30">
                    <div className="bg-cyber-slate/50 rounded-lg p-4 border border-cyber-primary/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-cyber-primary/5 group-hover:bg-cyber-primary/10 transition-colors" />
                        <p className="text-xs font-cyber text-cyber-primary mb-2 tracking-widest uppercase opacity-80">Daily Goal</p>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-2xl font-bold text-white font-cyber">85%</span>
                            <TrendingUp size={16} className="mb-1 text-cyber-primary" />
                        </div>
                        <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-white/10">
                            <div className="bg-cyber-primary h-full w-[85%] shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-cyber-gray border-t border-cyber-slate z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between items-center px-2 py-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[3.5rem] relative',
                                    isActive
                                        ? 'text-cyber-primary'
                                        : 'text-gray-500'
                                )}
                            >
                                {isActive && (
                                    <div className="absolute top-0 w-8 h-0.5 bg-cyber-primary shadow-[0_0_10px_#00f0ff]" />
                                )}
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" : ""} />
                                <span className={clsx("text-[10px] font-medium", isActive && "font-cyber")}>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 pb-24 md:p-8 max-w-screen-2xl mx-auto w-full relative">
                {/* Mobile Header for Logo */}
                <div className="md:hidden mb-6 flex items-center justify-center py-2">
                    <div className="font-cyber font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary to-cyber-purple tracking-wider text-glow">
                        IELTS PUSH-UP
                    </div>
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};
