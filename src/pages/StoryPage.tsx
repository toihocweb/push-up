import React from 'react';
import { Link } from 'react-router-dom';
import { StoryGenerator } from '../components/StoryGenerator';
import { useStore } from '../store/useStore';

export const StoryPage: React.FC = () => {
    const { activeWords } = useStore();

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

    return (
        <div className="py-8">
            <StoryGenerator />
        </div>
    );
};
