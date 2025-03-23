import express from "express";
import cors from "cors";
import { Jieba } from '@node-rs/jieba';
import { dict } from '@node-rs/jieba/dict.js';
import mdbg from "mdbg";
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
        const translation = await translate(sentence, { from: "zh", to: "en" });        
        
        const segments = jieba.cut(sentence, false);
        for (const segment of segments) {
            const entry = await mdbg.get(segment);

            // TODO: Make prediction request to Ollama

            const item = {
                token: segment,
                definitions: entry.definitions,
                simplified: entry.simplified,
                traditional : entry.traditional,
            }
            parsed.push(item);
        }

        res.status(200).json({ parsed: parsed, translation: translation });
    } catch (e) {
        res.status(500).json({ error: e });
    }
});

const ollamaRequest = (token, contextSentence, definitions) => {
    try {

        const ollama = new Ollama({ host: OLLAMA_API_URL });
        const model = "gemma3:12b";
        const response = ollama.generate({ model: model });
        
        return response.response;
    } catch (e) {

    }
}

// Test case: 你喜歡這個味道吗