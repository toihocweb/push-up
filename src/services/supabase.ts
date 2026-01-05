import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VocabItem } from '../store/useStore';

export class SupabaseService {
    private client: SupabaseClient;

    constructor(url: string, key: string) {
        this.client = createClient(url, key);
    }

    async getVocabulary(): Promise<VocabItem[]> {
        const { data, error } = await this.client
            .from('vocabulary')
            .select('*');

        if (error) throw error;

        // Map snake_case DB fields to camelCase if necessary, 
        // but for simplicity let's assume DB columns match or we map them here.
        // Assuming DB columns: id, word, definition, example, ipa, mastery, attempts, correct, last_practiced
        return data.map((item: any) => ({
            id: item.id,
            word: item.word,
            definition: item.definition,
            example: item.example,
            ipa: item.ipa,
            mastery: item.mastery,
            attempts: item.attempts,
            correct: item.correct,
            lastPracticed: item.last_practiced
        }));
    }

    async addWords(items: VocabItem[]): Promise<void> {
        const { error } = await this.client
            .from('vocabulary')
            .upsert(
                items.map(item => ({
                    id: item.id,
                    word: item.word,
                    definition: item.definition,
                    example: item.example,
                    ipa: item.ipa,
                    mastery: item.mastery,
                    attempts: item.attempts,
                    correct: item.correct,
                    last_practiced: item.lastPracticed
                }))
            );

        if (error) throw error;
    }

    async addWord(item: VocabItem): Promise<void> {
        await this.addWords([item]);
    }

    async deleteWord(word: string): Promise<void> {
        const { error } = await this.client
            .from('vocabulary')
            .delete()
            .eq('word', word);

        if (error) throw error;
    }

    async updateWordProgress(item: VocabItem): Promise<void> {
        const { error } = await this.client
            .from('vocabulary')
            .update({
                mastery: item.mastery,
                attempts: item.attempts,
                correct: item.correct,
                last_practiced: item.lastPracticed
            })
            .eq('id', item.id);

        if (error) throw error;
    }

    async checkConnection(): Promise<{ connected: boolean; error?: any }> {
        try {
            const { error } = await this.client
                .from('vocabulary')
                .select('id')
                .limit(1);

            if (error) {
                // Postgres error code for undefined table is 42P01
                // Also handle "Could not find the table" message which happens when schema cache is stale or table missing
                if (error.code === '42P01' || error.message.includes('Could not find the table')) {
                    return { connected: false, error: 'table_missing' };
                }
                return { connected: false, error };
            }

            return { connected: true };
        } catch (err) {
            return { connected: false, error: err };
        }
    }
}
