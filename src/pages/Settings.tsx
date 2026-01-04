import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Save, Key, Cpu, Loader2, Database, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { GroqService } from '../services/groq';

export const Settings: React.FC = () => {
    const {
        groqApiKey, setGroqApiKey,
        groqModel, setGroqModel,
        supabaseUrl, supabaseKey, setSupabaseConfig, syncWithSupabase,
        totalSpend
    } = useStore();

    const [inputKey, setInputKey] = useState(groqApiKey);
    const [saved, setSaved] = useState(false);

    const [inputSupabaseUrl, setInputSupabaseUrl] = useState(supabaseUrl);
    const [inputSupabaseKey, setInputSupabaseKey] = useState(supabaseKey);
    const [savedSupabase, setSavedSupabase] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncError, setSyncError] = useState('');

    const [models, setModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);

    useEffect(() => {
        const fetchModels = async () => {
            if (!groqApiKey) return;
            setLoadingModels(true);
            try {
                const service = new GroqService(groqApiKey);
                const availableModels = await service.getModels();
                setModels(availableModels);
            } catch (err) {
                console.error('Failed to fetch models', err);
            } finally {
                setLoadingModels(false);
            }
        };

        if (groqApiKey) {
            fetchModels();
        }
    }, [groqApiKey]);

    const handleSave = () => {
        setGroqApiKey(inputKey);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleSaveSupabase = () => {
        setSupabaseConfig(inputSupabaseUrl, inputSupabaseKey);
        setSavedSupabase(true);
        setTimeout(() => setSavedSupabase(false), 2000);
    };

    const handleSync = async () => {
        setSyncing(true);
        setSyncError('');
        try {
            // Ensure config is saved first
            setSupabaseConfig(inputSupabaseUrl, inputSupabaseKey);
            await syncWithSupabase();
            setSavedSupabase(true);
            setTimeout(() => setSavedSupabase(false), 2000);
        } catch (err: any) {
            setSyncError(err.message || 'Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-8">
            <header>
                <h1 className="text-3xl font-bold text-white font-cyber tracking-wide text-glow">Settings</h1>
                <p className="text-gray-400 mt-1">Configure your application preferences</p>
            </header>

            <div className="space-y-6">
                {/* API Key Section */}
                <div className="bg-cyber-gray p-6 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.3)] border border-cyber-slate space-y-6 relative overflow-hidden group hover:border-cyber-primary/30 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyber-primary to-cyber-purple" />

                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-cyber">
                                <Key size={20} className="text-cyber-primary" />
                                Groq API Key
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">
                                Required for generating definitions, quizzes, and stories. Get one from <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-cyber-primary hover:text-cyan-300 hover:underline transition-colors">Groq Console</a>.
                            </p>
                        </div>
                        {totalSpend > 0 && (
                            <div className="bg-cyber-black/50 text-cyber-primary px-4 py-2 rounded-full text-sm font-medium border border-cyber-primary/30 flex items-center gap-2 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                                <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
                                Total Spend: ${totalSpend.toFixed(5)}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <input
                            type="password"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            placeholder="gsk_..."
                            className="w-full px-4 py-3 rounded-lg bg-cyber-black border border-cyber-slate text-white focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary outline-none transition-all font-mono text-sm placeholder-gray-600"
                        />

                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                className="bg-cyber-primary hover:bg-cyan-400 text-cyber-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                            >
                                <Save size={18} />
                                {saved ? 'Saved!' : 'Save Key'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Model Selection Section */}
                <div className="bg-cyber-gray p-6 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.3)] border border-cyber-slate space-y-6 relative overflow-hidden group hover:border-cyber-primary/30 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyber-purple to-cyber-accent" />

                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-cyber">
                            <Cpu size={20} className="text-cyber-purple" />
                            AI Model
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Select the AI model to use for content generation.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {groqApiKey ? (
                            <div className="relative">
                                {loadingModels && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Loader2 size={18} className="animate-spin text-cyber-primary" />
                                    </div>
                                )}
                                <select
                                    value={groqModel}
                                    onChange={(e) => setGroqModel(e.target.value)}
                                    disabled={loadingModels}
                                    className="w-full px-4 py-3 rounded-lg bg-cyber-black border border-cyber-slate text-white focus:border-cyber-purple focus:ring-1 focus:ring-cyber-purple outline-none transition-all appearance-none cursor-pointer"
                                >
                                    {models.length > 0 ? (
                                        models.map(model => (
                                            <option key={model} value={model} className="bg-cyber-black text-white">{model}</option>
                                        ))
                                    ) : (
                                        <option value="llama-3.1-8b-instant" className="bg-cyber-black text-white">llama-3.1-8b-instant</option>
                                    )}
                                </select>
                            </div>
                        ) : (
                            <div className="p-4 bg-cyber-black/50 border border-cyber-slate text-gray-400 rounded-lg text-sm">
                                Please save your API Key first to load available models.
                            </div>
                        )}
                    </div>
                </div>
                {/* Supabase Configuration Section */}
                <div className="bg-cyber-gray p-6 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.3)] border border-cyber-slate space-y-6 relative overflow-hidden group hover:border-cyber-primary/30 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyber-accent to-cyber-primary" />

                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-cyber">
                            <Database size={20} className="text-cyber-accent" />
                            Supabase Storage
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Configure Supabase to sync your vocabulary across devices.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Project URL</label>
                            <input
                                type="text"
                                value={inputSupabaseUrl}
                                onChange={(e) => setInputSupabaseUrl(e.target.value)}
                                placeholder="https://your-project.supabase.co"
                                className="w-full px-4 py-3 rounded-lg bg-cyber-black border border-cyber-slate text-white focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent outline-none transition-all font-mono text-sm placeholder-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Anon Key</label>
                            <input
                                type="password"
                                value={inputSupabaseKey}
                                onChange={(e) => setInputSupabaseKey(e.target.value)}
                                placeholder="your-anon-key"
                                className="w-full px-4 py-3 rounded-lg bg-cyber-black border border-cyber-slate text-white focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent outline-none transition-all font-mono text-sm placeholder-gray-600"
                            />
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <button
                                onClick={handleSync}
                                disabled={syncing || !inputSupabaseUrl || !inputSupabaseKey}
                                className="text-cyber-primary hover:text-cyan-300 font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {syncing ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Checking...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={16} />
                                        Test & Sync
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleSaveSupabase}
                                className="bg-cyber-accent hover:bg-yellow-400 text-cyber-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-[0_0_10px_rgba(255,255,0,0.3)]"
                            >
                                <Save size={18} />
                                {savedSupabase ? 'Saved!' : 'Save Config'}
                            </button>
                        </div>

                        {syncError === 'table_missing' ? (
                            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <h3 className="text-amber-400 font-bold">Table Missing</h3>
                                        <p className="text-amber-200/80 text-sm mt-1">
                                            The <code>vocabulary</code> table doesn't exist in your Supabase project.
                                            Please run the following SQL in your Supabase SQL Editor to create it:
                                        </p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <pre className="bg-black/50 text-gray-300 p-3 rounded-lg text-xs overflow-x-auto font-mono border border-white/10">
                                        {`create table vocabulary (
  id uuid primary key,
  word text not null,
  definition text,
  example text,
  ipa text,
  mastery int default 0,
  attempts int default 0,
  correct int default 0,
  last_practiced bigint,
  created_at timestamp with time zone default timezone('utc'::text, now())
);`}
                                    </pre>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(`create table vocabulary (
  id uuid primary key,
  word text not null,
  definition text,
  example text,
  ipa text,
  mastery int default 0,
  attempts int default 0,
  correct int default 0,
  last_practiced bigint,
  created_at timestamp with time zone default timezone('utc'::text, now())
);`)}
                                        className="absolute top-2 right-2 text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors"
                                    >
                                        Copy SQL
                                    </button>
                                </div>
                            </div>
                        ) : syncError && (
                            <p className="text-cyber-secondary text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {syncError}
                            </p>
                        )}

                        {!syncError && !syncing && savedSupabase && (
                            <p className="text-green-400 text-sm flex items-center gap-2">
                                <Check size={16} />
                                Connected and Synced
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
