import express from "express";
import cors from "cors";
import { Jieba } from '@node-rs/jieba';
import { dict } from '@node-rs/jieba/dict.js';
import cedict from "cc-cedict";
import { Ollama } from "ollama";
import translate from "translate";

const app = express();
const PORT = 5000;
const OLLAMA_API_URL = "http://localhost:11434";
const jieba = Jieba.withDict(dict);

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

app.get('/', (req, res) => {
    res.send("Server is running...");
});

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});

app.post('/parse', async (req, res) => {
    const { sentence } = req.body;

    if (!sentence) {
        res.status(400).json({ error: 'No input provided' });
    }

    try {
        let parsed = [];
        let raw = [];
        const translation = await translate(sentence, { from: "zh", to: "en" });        
        
        const segments = jieba.cut(sentence, true);
        for (const segment of segments) {
            let entry = await cedict.getBySimplified(segment);
            if (entry === null) {
                entry = await cedict.getByTraditional(segment);
            }

            // TODO: Make prediction request to Ollama

            const item = {
                token: segment,
                definitions: await ollamaRequest(segment, sentence, entry)
            }
            parsed.push(item);
            raw.push(entry);
        }

        res.status(200).json({ parsed: parsed, translation: translation, raw: raw, segments: segments });
        // res.status(200).json({ segments: segments });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: e.message });
    }
});

const ollamaRequest = async (token, contextSentence, definitions) => {
    try {

        const systemPrompt = `You are a Chinese linguistics expert AI. \
        You will be provided with a Chinese sentence, a word from that sentence, and dictionary entries for that word from CC-CEDICT. \
        Your task is to analyze a sentence, and determine the correct pinyin reading and English dictionary definition for a target word from the provided options.
        Respond in JSON format (without including formatting e.g. newlines or tab spaces): 
        { pinyin: "", definition: "" }

        Here are a couple examples of prompts, and the expected outputs from you:
        ---
        Sentence: 你有光明的未来
        Word: 光明
        Definitions:
        1. guang1 ming2
        - light
        - radiance
        - (fig.) bright (prospects etc)
        - openhearted
        
        // Output:
        {
            pinyin: "guang1 ming2",
            definition: "(fig.) bright (prospects etc)"
        }

        Sentence: 你喜欢这个味道吗
        Word: 吗
        Definitions:
        1. ma2
        - (coll.) what?
        2. ma3
        - used in 嗎啡|吗啡[ma3fei1]
        3. ma5
        - (question particle for "yes-no" questions)

        // Output:
        { 
            pinyin: "ma5",
            definition: "(question particle for "yes-no" questions)
        }`;

        const inputPrompt = `Sentence: ${contextSentence}
        Word: ${token}
        Definitions:
        ${formatDictionaryDefinitions(definitions)}
        `;

        const ollama = new Ollama({ host: OLLAMA_API_URL });
        // const model = "gemma3:12b";
        const model = "deepseek-r1:14b";
        const response = await ollama.chat({
            model: model,
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: inputPrompt,
                }
            ],
            format: {
                "type": "object",
                "properties": {
                    "pinyin": {
                        "type": "string"
                    },
                    "definition": {
                        "type": "string"
                    }
                }, 
                "required": ["pinyin", "definition"],
            }
        });
        
        return response.message.content;
    } catch (e) {
        return e.message;
    }
};

const formatDictionaryDefinitions = (entries) => {
    let res = "";
    
    for (const entry in entries) {
        let entryString = `${entry}:`;
        for (const definition of entries[entry]) {
            entryString += `\n- ${definition.english}`;
        }
        res += `${entryString}\n`;
    }
    return res;
};

// Test case: 你喜欢这个味道吗 simplified
// Traditional: 你喜歡這個味道嗎