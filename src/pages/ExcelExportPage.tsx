import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { GroqService } from '../services/groq';
import { FileSpreadsheet, Download, RefreshCw, AlertCircle, Table } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ExcelData {
    word: string;
    ipa: string;
    pos: string;
    english_meaning: string;
    vietnamese: string;
    synonyms: string;
    antonyms: string;
    example: string;
    cambridge: string;
}

export const ExcelExportPage: React.FC = () => {
    const { groqApiKey, groqModel, trackGroqUsage } = useStore();
    const [input, setInput] = useState('');
    const [data, setData] = useState<ExcelData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!input.trim()) return;
        if (!groqApiKey) {
            setError('Please set your Groq API key in Settings first.');
            return;
        }

        setLoading(true);
        setError('');
        setData([]);

        const words = input.split('\n').map(w => w.trim()).filter(w => w);

        try {
            const groq = new GroqService(groqApiKey, groqModel);
            // Process in chunks of 20 to avoid token limits
            const chunkSize = 20;
            let allData: Omit<ExcelData, 'cambridge'>[] = [];

            for (let i = 0; i < words.length; i += chunkSize) {
                const chunk = words.slice(i, i + chunkSize);
                const { data: chunkData, usage } = await groq.generateExcelData(chunk);
                trackGroqUsage(usage);
                allData = [...allData, ...chunkData];
            }

            setData(allData.map(item => ({
                ...item,
                cambridge: `https://dictionary.cambridge.org/dictionary/english/${item.word.toLowerCase().replace(/\s+/g, '-')}`
            })));
        } catch (err) {
            console.error(err);
            setError('Failed to generate data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (data.length === 0) return;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Vocabulary');

        // Define Columns
        worksheet.columns = [
            { header: 'Vocabulary', key: 'word', width: 25 },
            { header: 'IPA', key: 'ipa', width: 20 },
            { header: 'Part of Speech', key: 'pos', width: 20 },
            { header: 'English Meaning', key: 'english_meaning', width: 40 },
            { header: 'Vietnamese Meaning', key: 'vietnamese', width: 40 },
            { header: 'Synonyms', key: 'synonyms', width: 30 },
            { header: 'Antonyms', key: 'antonyms', width: 30 },
            { header: 'Example', key: 'example', width: 50 },
            { header: 'Cambridge Link', key: 'cambridge', width: 60 },
        ];

        // Style Header Row
        const headerRow = worksheet.getRow(1);
        headerRow.height = 30;
        headerRow.eachCell((cell) => {
            cell.font = {
                name: 'Calibri',
                size: 16,
                bold: true,
                color: { argb: 'FFFFFFFF' } // White text
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF000080' } // Dark Blue background (Cyberpunk-ish)
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Add Data and Style Rows
        data.forEach((item) => {
            const row = worksheet.addRow({
                word: item.word,
                ipa: item.ipa,
                pos: item.pos,
                english_meaning: item.english_meaning,
                vietnamese: item.vietnamese,
                synonyms: item.synonyms,
                antonyms: item.antonyms,
                example: item.example,
                cambridge: { text: 'Link', hyperlink: item.cambridge }
            });

            row.height = 25; // Taller rows for readability

            row.eachCell((cell, colNumber) => {
                // Default Cell Style
                cell.font = {
                    name: 'Calibri',
                    size: 16, // Requested default font size
                    color: { argb: 'FF000000' }
                };
                cell.alignment = { vertical: 'middle', wrapText: true };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };

                // Specific styling for Cambridge Link (Column 9)
                if (colNumber === 9) {
                    cell.font = {
                        name: 'Calibri',
                        size: 16,
                        color: { argb: 'FF0000FF' }, // Blue
                        underline: true
                    };
                }
            });
        });

        // Generate Buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Save File
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'vocabulary_export_fancy.xlsx');
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white font-cyber tracking-wide text-glow flex items-center gap-3">
                    <FileSpreadsheet className="text-cyber-primary" size={32} />
                    Excel Export
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-4">
                    <div className="bg-cyber-gray rounded-xl border border-cyber-slate p-6 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                        <label className="block text-gray-400 mb-2 font-medium">Enter Vocabulary List (one per line)</label>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="apple&#10;banana&#10;beautiful&#10;..."
                            className="w-full h-96 p-4 rounded-lg bg-cyber-black border border-cyber-slate focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary outline-none transition-all font-mono text-lg resize-none text-cyber-primary placeholder-gray-700"
                        />

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleGenerate}
                                disabled={loading || !input.trim()}
                                className="bg-cyber-primary hover:bg-cyan-400 text-cyber-black px-6 py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyber-black"></div>
                                ) : (
                                    <RefreshCw size={20} />
                                )}
                                {loading ? 'Generating...' : 'Generate Data'}
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

                {/* Preview Section */}
                <div className="space-y-4">
                    <div className="bg-cyber-gray rounded-xl border border-cyber-slate p-6 shadow-[0_0_20px_rgba(0,0,0,0.3)] h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white font-cyber flex items-center gap-2">
                                <Table size={20} className="text-cyber-primary" />
                                Preview Data <span className="text-cyber-primary">({data.length})</span>
                            </h2>
                            <button
                                onClick={handleExport}
                                disabled={data.length === 0}
                                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download size={18} />
                                Export Excel
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar bg-cyber-black rounded-lg border border-cyber-slate">
                            {data.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-cyber-slate/30 text-gray-300 border-b border-cyber-slate">
                                            <th className="p-3 font-bold">Word</th>
                                            <th className="p-3 font-bold">IPA</th>
                                            <th className="p-3 font-bold">POS</th>
                                            <th className="p-3 font-bold">English Meaning</th>
                                            <th className="p-3 font-bold">Vietnamese Meaning</th>
                                            <th className="p-3 font-bold">Synonyms</th>
                                            <th className="p-3 font-bold">Antonyms</th>
                                            <th className="p-3 font-bold">Example</th>
                                            <th className="p-3 font-bold">Cambridge</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cyber-slate/30">
                                        {data.map((item, index) => (
                                            <tr key={index} className="hover:bg-white/5 transition-colors">
                                                <td className="p-3 text-cyber-primary font-medium">{item.word}</td>
                                                <td className="p-3 text-gray-400 font-mono text-sm">{item.ipa}</td>
                                                <td className="p-3 text-purple-400 text-sm italic">{item.pos}</td>
                                                <td className="p-3 text-gray-300 text-sm">{item.english_meaning}</td>
                                                <td className="p-3 text-gray-200">{item.vietnamese}</td>
                                                <td className="p-3 text-blue-400 text-sm">{item.synonyms}</td>
                                                <td className="p-3 text-orange-400 text-sm">{item.antonyms}</td>
                                                <td className="p-3 text-gray-400 text-sm italic">{item.example}</td>
                                                <td className="p-3">
                                                    <a
                                                        href={item.cambridge}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-cyber-primary hover:underline text-sm truncate block max-w-[200px]"
                                                    >
                                                        Link
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
                                    <FileSpreadsheet size={48} className="mb-4 opacity-20" />
                                    <p>No data generated yet.</p>
                                    <p className="text-sm mt-2">Enter words and click Generate to see preview.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
