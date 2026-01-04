export interface GeneratedVocab {
    word: string;
    definition: string;
    example: string;
}

export interface GeneratedQuestion {
    question: string;
    correctAnswer: string;
    options: string[];
}

export interface WritingExercise {
    word: string;
    sentence: string;
    vietnamese: string;
}

export interface GroqUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface GroqResponse<T> {
    data: T;
    usage: GroqUsage;
}

export interface GrammarIssue {
    original: string;
    replacement: string;
    type: 'grammar' | 'spelling' | 'style' | 'punctuation' | 'clarity';
    explanation: string;
    context?: string;
}

export interface IELTSFeedback {
    overallScore: number;
    criteriaScores: {
        taskAchievement: number;
        coherenceCohesion: number;
        lexicalResource: number;
        grammaticalRange: number;
    };
    feedback: {
        taskAchievement: string;
        coherenceCohesion: string;
        lexicalResource: string;
        grammaticalRange: string;
    };
    improvements: string[];
    generalFeedback: string;
}

export interface IELTSGenResult {
    essay: string;
    analysis: {
        taskResponse: string;
        coherence: string;
        lexical: string;
        grammar: string;
        overall: string;
    };
}

export class GroqService {
    private apiKey: string;
    private model: string;
    private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    private modelsUrl = 'https://api.groq.com/openai/v1/models';

    constructor(apiKey: string, model: string = 'llama-3.1-8b-instant') {
        this.apiKey = apiKey;
        this.model = model === 'llama3-8b-8192' ? 'llama-3.1-8b-instant' : model;
    }

    async getModels(): Promise<string[]> {
        const response = await fetch(this.modelsUrl, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch models');
        }

        const data = await response.json();
        return data.data.map((m: any) => m.id);
    }

    private async callGroq(messages: any[], jsonMode = false): Promise<{ content: string, usage: GroqUsage }> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages,
                model: this.model,
                response_format: jsonMode ? { type: 'json_object' } : undefined,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Groq API Error: ${response.status} ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content,
            usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        };
    }

    async generateVocabDetails(words: string[]): Promise<GroqResponse<GeneratedVocab[]>> {
        const prompt = `
      For the following list of words, provide a definition, an example sentence, and the IPA pronunciation for each.
      Return a JSON object with a "words" key containing an array of objects.
      Each object should have keys: "word", "definition", "example", "ipa".
      Words: ${words.join(', ')}
    `;

        const { content, usage } = await this.callGroq([{ role: 'user', content: prompt }], true);
        if (!content) throw new Error('No content received from Groq');

        try {
            const parsed = JSON.parse(content);
            let data: GeneratedVocab[] = [];
            if (parsed.words && Array.isArray(parsed.words)) data = parsed.words;
            else if (Array.isArray(parsed)) data = parsed; // Fallback
            else {
                const values = Object.values(parsed);
                if (values.length > 0 && Array.isArray(values[0])) data = values[0] as GeneratedVocab[];
                else throw new Error('Unexpected JSON format');
            }
            return { data, usage };
        } catch (e) {
            console.error('Failed to parse Groq response:', content);
            throw new Error('Failed to parse Groq response');
        }
    }

    async generateStory(words: string[]): Promise<GroqResponse<string>> {
        const prompt = `
      Write a short, funny story in Vietnamese (approx 150-200 words).
      However, you MUST use the following English words in the story exactly as they are (do not translate these specific words): ${words.join(', ')}.
      Highlight these English words in bold (**word**) when they appear.
      The context should make the meaning of the English words clear.
      This is a "Truyện Chêm" style story for learning English.
    `;

        const { content, usage } = await this.callGroq([{ role: 'user', content: prompt }]);
        return { data: content, usage };
    }

    async generateQuiz(words: string[], type: 'definition' | 'cloze' | 'antonym' | 'vietnamese' | 'sentence-challenge' = 'definition'): Promise<GroqResponse<GeneratedQuestion[]>> {
        let prompt = '';

        if (type === 'definition') {
            prompt = `
              Create a multiple choice quiz for exactly these words: ${words.join(', ')}.
              For each word, provide ONE question where the word is the "question" and the correct definition is the "correctAnswer".
              Provide 3 incorrect definitions as options.
              Do not generate extra questions.
              Return a JSON object with a "questions" key containing an array of objects.
              Each object should have keys: "question", "correctAnswer", "options" (array of 4 definitions including the correct one).
            `;
        } else if (type === 'cloze') {
            prompt = `
              Create a fill-in-the-blank quiz for exactly these words: ${words.join(', ')}.
              For each word, write ONE sentence with the word replaced by "_______".
              Do not generate extra questions.
              Return a JSON object with a "questions" key containing an array of objects.
              Structure:
              {
                "questions": [
                  {
                    "question": "Sentence with _______",
                    "correctAnswer": "missing_word",
                    "options": ["missing_word", "distractor1", "distractor2", "distractor3"]
                  }
                ]
              }
            `;
        } else if (type === 'antonym') {
            prompt = `
              Create an antonym quiz for exactly these words: ${words.join(', ')}.
              For each word, provide ONE question: "What is the opposite of [Word]?".
              The "correctAnswer" is the antonym.
              Provide 3 incorrect words as options.
              Do not generate extra questions.
              Return a JSON object with a "questions" key containing an array of objects.
              Each object should have keys: "question", "correctAnswer", "options" (array of 4 words including the correct one).
            `;
        } else if (type === 'vietnamese') {
            prompt = `
              Create a Vietnamese translation quiz for exactly these words: ${words.join(', ')}.
              For each word, provide a Vietnamese sentence or definition that describes the word or uses it in context (but with the word missing/implied).
              The question MUST end with "_______" (7 underscores) to indicate where the user should type the English word.
              Example Question: "Quả này màu đỏ và rất ngọt. _______" (for 'Apple')
              The "correctAnswer" is the English word.
              Provide 3 incorrect English words as options (distractors).
              Return a JSON object with a "questions" key containing an array of objects.
              Each object should have keys: "question", "correctAnswer", "options" (array of 4 words including the correct one).
            `;
        } else if (type === 'sentence-challenge') {
            prompt = `
              Create a Sentence Translation Challenge for exactly these words: ${words.join(', ')}.
              For each word, create a complete English sentence using the word.
              Then provide the Vietnamese translation of that sentence as the "question".
              The "correctAnswer" is the full English sentence.
              Provide 3 incorrect English sentences as options (distractors) - these can be slightly wrong grammar or different meaning.
              Return a JSON object with a "questions" key containing an array of objects.
              Each object should have keys: "question", "correctAnswer", "options" (array of 4 sentences including the correct one).
            `;
        }

        const { content, usage } = await this.callGroq([{ role: 'user', content: prompt }], true);
        if (!content) throw new Error('No content received from Groq');

        try {
            const parsed = JSON.parse(content);
            let data: GeneratedQuestion[] = [];
            if (parsed.questions && Array.isArray(parsed.questions)) data = parsed.questions;
            else if (Array.isArray(parsed)) data = parsed;
            else {
                const values = Object.values(parsed);
                if (values.length > 0 && Array.isArray(values[0])) data = values[0] as GeneratedQuestion[];
                else throw new Error('Unexpected JSON format');
            }
            return { data, usage };
        } catch (e) {
            console.error('Failed to parse Groq response:', content);
            throw new Error('Failed to parse Groq response');
        }
    }

    async generateVocabularyList(topic: string, count: number, excludeWords: string[] = []): Promise<GroqResponse<string[]>> {
        const exclusionPrompt = excludeWords.length > 0
            ? `Do not include these words: ${excludeWords.join(', ')}.`
            : '';

        const prompt = `
            Generate a list of ${count} English vocabulary items based on the input: "${topic}".
            
            IMPORTANT INSTRUCTIONS:
            1. If the input specifies a specific type (e.g., "phrasal verbs", "idioms", "slang", "collocations"), you MUST strictly provide that type.
            2. If the input is a general topic (e.g., "Business", "Travel"), provide advanced/challenging vocabulary words related to that topic.
            3. ${exclusionPrompt}
            
            Return a JSON object with a "words" key containing an array of strings.
            Do not include definitions or examples.
            Example: { "words": ["word1", "word2", "phrase 1"] }
        `;

        const { content, usage } = await this.callGroq([{ role: 'user', content: prompt }], true);
        if (!content) throw new Error('No content received from Groq');

        try {
            const parsed = JSON.parse(content);
            let data: string[] = [];
            if (parsed.words && Array.isArray(parsed.words)) data = parsed.words;
            else if (Array.isArray(parsed)) data = parsed;
            else {
                const values = Object.values(parsed);
                if (values.length > 0 && Array.isArray(values[0])) data = values[0] as string[];
                else throw new Error('Unexpected JSON format');
            }
            return { data, usage };
        } catch (e) {
            console.error('Failed to parse Groq response:', content);
            throw new Error('Failed to parse Groq response');
        }
    }

    async generateWritingExercises(words: string[]): Promise<GroqResponse<WritingExercise[]>> {
        const prompt = `
            For each of the following words, create a writing exercise data object.
            Words: ${words.join(', ')}
            
            Return a JSON object with an "exercises" key containing an array of objects.
            Each object MUST have these exact keys:
            - "word": The target word from the list.
            - "sentence": A complete, natural English sentence using the word.
            - "vietnamese": The Vietnamese translation of that full sentence.
            
            Example:
            {
                "word": "apple",
                "sentence": "I ate a red apple for lunch.",
                "vietnamese": "Tôi đã ăn một quả táo đỏ cho bữa trưa."
            }
        `;

        const { content, usage } = await this.callGroq([{ role: 'user', content: prompt }], true);
        if (!content) throw new Error('No content received from Groq');

        try {
            const parsed = JSON.parse(content);
            let data: WritingExercise[] = [];
            if (parsed.exercises && Array.isArray(parsed.exercises)) data = parsed.exercises;
            else if (Array.isArray(parsed)) data = parsed;
            else {
                const values = Object.values(parsed);
                if (values.length > 0 && Array.isArray(values[0])) data = values[0] as WritingExercise[];
                else throw new Error('Unexpected JSON format');
            }
            return { data, usage };
        } catch (e) {
            console.error('Failed to parse Groq response:', content);
            throw new Error('Failed to parse Groq response');
        }
    }
    async checkGrammar(text: string): Promise<GroqResponse<GrammarIssue[]>> {
        const prompt = `
            Analyze the following text for grammar, spelling, punctuation, style, and clarity issues.
            Return a JSON object with an "issues" key containing an array of objects.
            Each object MUST have these keys:
            - "original": The exact text segment that has the issue.
            - "replacement": The suggested correction.
            - "type": One of "grammar", "spelling", "style", "punctuation", "clarity".
            - "explanation": A brief explanation of why this change is recommended.
            - "context": A small snippet of surrounding text to help locate the issue (optional).

            Text to analyze:
            "${text}"
        `;

        const { content, usage } = await this.callGroq([{ role: 'user', content: prompt }], true);
        if (!content) throw new Error('No content received from Groq');

        try {
            const parsed = JSON.parse(content);
            let data: GrammarIssue[] = [];
            if (parsed.issues && Array.isArray(parsed.issues)) data = parsed.issues;
            else if (Array.isArray(parsed)) data = parsed;
            else {
                const values = Object.values(parsed);
                if (values.length > 0 && Array.isArray(values[0])) data = values[0] as GrammarIssue[];
                else throw new Error('Unexpected JSON format');
            }
            return { data, usage };
        } catch (e) {
            console.error('Failed to parse Groq response:', content);
            throw new Error('Failed to parse Groq response');
        }
    }
    async rewriteText(text: string, style: string): Promise<GroqResponse<string>> {
        const prompt = `
            Rewrite the following text to be more "${style}".
            Keep the original meaning but change the tone and vocabulary to match the requested style.
            Return ONLY the rewritten text. Do not include any explanations or quotes.

            Original Text:
            "${text}"
        `;

        const { content, usage } = await this.callGroq([{ role: 'user', content: prompt }]);
        return { data: content || '', usage };
    }
    async generateExcelData(words: string[]): Promise<GroqResponse<{ word: string, ipa: string, pos: string, english_meaning: string, vietnamese: string, synonyms: string, antonyms: string, example: string }[]>> {
        const prompt = `
            For the following list of words, provide the IPA pronunciation, Part of Speech (POS), English meaning, Vietnamese meaning, Synonyms, Antonyms, and an example sentence.
            
            IMPORTANT INSTRUCTIONS:
            1. If a word has multiple common meanings or parts of speech (e.g., "run" as a verb and "run" as a noun), create a SEPARATE entry for each.
            2. Return a JSON object with a "data" key containing an array of objects.
            3. Each object MUST have these exact keys: "word", "ipa", "pos", "english_meaning", "vietnamese", "synonyms", "antonyms", "example".
            4. For synonyms and antonyms, provide 2-3 items separated by commas.
            
            Words: ${words.join(', ')}
            
            Example:
            {
                "data": [
                    { 
                        "word": "run", 
                        "ipa": "/rʌn/", 
                        "pos": "verb", 
                        "english_meaning": "to move fast by using one's feet", 
                        "vietnamese": "chạy", 
                        "synonyms": "dash, sprint, race",
                        "antonyms": "walk, stand, halt",
                        "example": "I run every morning." 
                    }
                ]
            }
        `;

        const { content, usage } = await this.callGroq([{ role: 'user', content: prompt }], true);
        if (!content) throw new Error('No content received from Groq');

        try {
            const parsed = JSON.parse(content);
            let data: { word: string, ipa: string, pos: string, english_meaning: string, vietnamese: string, synonyms: string, antonyms: string, example: string }[] = [];
            if (parsed.data && Array.isArray(parsed.data)) data = parsed.data;
            else if (Array.isArray(parsed)) data = parsed;
            else {
                const values = Object.values(parsed);
                if (values.length > 0 && Array.isArray(values[0])) data = values[0] as any[];
                else throw new Error('Unexpected JSON format');
            }
            return { data, usage };
        } catch (e) {
            console.error('Failed to parse Groq response:', content);
            throw new Error('Failed to parse Groq response');
        }
    }
    async scoreIELTSWriting(text: string, taskType: 'task1' | 'task2', promptText: string = ''): Promise<GroqResponse<IELTSFeedback>> {
        const criteria = taskType === 'task1' ? 'Task Achievement' : 'Task Response';

        const prompt = `
            Act as an expert IELTS examiner. Score the following IELTS Writing ${taskType === 'task1' ? 'Task 1' : 'Task 2'} essay based on the official public band descriptors.
            
            Essay Prompt:
            "${promptText}"
            
            Student Essay:
            "${text}"
            
            Evaluate based on these 4 criteria:
            1. ${criteria}
            2. Coherence & Cohesion
            3. Lexical Resource
            4. Grammatical Range & Accuracy
            
            Provide a score (0-9, in 0.5 increments) for each criterion and an overall band score (rounded down to nearest 0.5).
            Provide specific feedback for each criterion explaining the score.
            Provide a list of 3-5 specific improvements.
            
            Return a JSON object with this EXACT structure:
            {
                "overallScore": number,
                "criteriaScores": {
                    "taskAchievement": number, // Use this key for both Task 1 (Achievement) and Task 2 (Response)
                    "coherenceCohesion": number,
                    "lexicalResource": number,
                    "grammaticalRange": number
                },
                "feedback": {
                    "taskAchievement": "string",
                    "coherenceCohesion": "string",
                    "lexicalResource": "string",
                    "grammaticalRange": "string"
                },
                "improvements": ["string", "string", ...],
                "generalFeedback": "string"
            }
        `;

        const { content, usage } = await this.callGroq([{ role: 'user', content: prompt }], true);
        if (!content) throw new Error('No content received from Groq');

        try {
            const parsed = JSON.parse(content);
            let data: IELTSFeedback;
            if (parsed.overallScore !== undefined) data = parsed as IELTSFeedback;
            else if (parsed.data) data = parsed.data as IELTSFeedback;
            else {
                // Try to find the object in values if structure is slightly off
                const values = Object.values(parsed);
                if (values.length > 0 && (values[0] as any).overallScore) data = values[0] as IELTSFeedback;
                else throw new Error('Unexpected JSON format');
            }
            return { data, usage };
        } catch (e) {
            console.error('Failed to parse Groq response:', content);
            throw new Error('Failed to parse Groq response');
        }
    }

    async generateIELTSWriting(topic: string, taskType: 'task1' | 'task2', bandScore: string): Promise<GroqResponse<IELTSGenResult>> {
        const length = taskType === 'task1' ? 'at least 150 words' : 'at least 250 words';

        const prompt = `
            Act as an expert IELTS examiner and educator.
            Write a MODEL IELTS Writing ${taskType === 'task1' ? 'Task 1' : 'Task 2'} essay that achieves an EXACT Band Score of ${bandScore}.
            
            Topic:
            "${topic}"
            
            Requirements:
            1. The essay must strictly adhere to the official band descriptors for Band ${bandScore}.
            2. Length: ${length}.
            3. Highlight key phrases or sentences in the essay that demonstrate the band score using **bold** markdown.
            4. Provide a detailed analysis broken down by 4 criteria and an overall summary.
            
            Return a JSON object with this EXACT structure:
            {
                "essay": "Essay text with **bold** highlights...",
                "analysis": {
                    "taskResponse": "Explanation of Task Response/Achievement...",
                    "coherence": "Explanation of Coherence & Cohesion...",
                    "lexical": "Explanation of Lexical Resource...",
                    "grammar": "Explanation of Grammatical Range & Accuracy...",
                    "overall": "Overall summary of why this is a Band ${bandScore}..."
                }
            }
        `;

        const { content, usage } = await this.callGroq([{ role: 'user', content: prompt }], true);
        if (!content) throw new Error('No content received from Groq');

        try {
            const parsed = JSON.parse(content);
            let data: IELTSGenResult;
            if (parsed.essay && parsed.analysis) data = parsed as IELTSGenResult;
            else if (parsed.data) data = parsed.data as IELTSGenResult;
            else {
                const values = Object.values(parsed);
                if (values.length > 0 && (values[0] as any).essay) data = values[0] as IELTSGenResult;
                else throw new Error('Unexpected JSON format');
            }
            return { data, usage };
        } catch (e) {
            console.error('Failed to parse Groq response:', content);
            throw new Error('Failed to parse Groq response');
        }
    }
}
