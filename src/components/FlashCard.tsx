import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { VocabItem } from '../store/useStore';

interface FlashCardProps {
    item: VocabItem;
    onNext: () => void;
    onPrev: () => void;
}

export const FlashCard: React.FC<FlashCardProps> = ({ item }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = () => setIsFlipped(!isFlipped);

    return (
        <div className="perspective-1000 w-full max-w-md mx-auto h-96 cursor-pointer group" onClick={handleFlip}>
            <motion.div
                className="relative w-full h-full text-center transition-all duration-500 transform-style-3d"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            >
                {/* Front */}
                <div className="absolute w-full h-full backface-hidden bg-cyber-gray rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-cyber-slate flex flex-col items-center justify-center p-8 group-hover:border-cyber-primary/50 transition-colors">
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
                    <h3 className="text-4xl font-bold text-white mb-4 font-cyber tracking-wide text-glow">{item.word}</h3>
                    {item.ipa && <p className="text-cyber-primary font-mono mb-6 text-lg opacity-80">/{item.ipa}/</p>}
                    <p className="text-gray-500 text-sm font-cyber tracking-widest uppercase">Click to flip</p>
                </div>

                {/* Back */}
                <div
                    className="absolute w-full h-full backface-hidden bg-gradient-to-br from-cyber-primary to-cyber-purple rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.3)] flex flex-col items-center justify-center p-8 text-cyber-black rotate-y-180 border border-white/20"
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <h3 className="text-2xl font-bold text-center leading-relaxed font-cyber">{item.definition}</h3>
                    {item.example && (
                        <p className="mt-6 text-lg italic opacity-90 font-medium">"{item.example}"</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
