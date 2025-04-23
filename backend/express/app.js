import express from "express";
import cors from "cors";
import cedict from "cc-cedict";
import translate from "translate";
import OpenAI from "openai/index.mjs";
import "dotenv/config";
import { validateInputIsChinese } from "./middleware/validation.js";

const app = express();
const PORT = 5000;

const SYSTEM_PROMPT = `Instructions: 
You are a Mandarin language expert. You will be given a Mandarin sentence and it's English translation. Your job is to segment the sentence into its words (词语), and provide the pinyin reading and English definition for each word in the context of the sentence
Important: 
Pinyin should be formatted like this: 'ni3 hao3' (你好), 'ta1' (他), 'nu:3' (女)

Format:
Format response as JSON
- Output JSON with "segments" array
- Each entry MUST have:
  - "token": Original segment text
  - "pinyin": Selected pronunciation
  - "definition": SINGLE most appropriate definition
{
  segments: [
    {
      token: string,
      pinyin: string,
      definition: string
    },
  ]
}

- Preserve all punctuation in a sentence: Return a segment like { token: "。", pinyin: "", definition: "" } or { token: "，", pinyin: "", definition: "" }
- For segments of the sentence that are in English or are a number, just return the token with pinyin and definition empty. e.g. { token: "2024", pinyin: "", definition: "" } or { token: "NBA", pinyin: "", definition: "" }`;

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});

app.post("/parse", validateInputIsChinese, async (req, res) => {
  try {
    const { validatedText } = req;
    if (!validatedText) {
      res.status(400).json({ error: "No input provided" });
    }
    const translation = await translate(validatedText, { from: "zh", to: "en" });
    const llmPrediction = await llmRequest(validatedText, translation);

    return res.status(200).json({ translation: translation, parsed: llmPrediction });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post("/definitionLookup", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "No input provided" });
  }

  try {
    const dictionaryData = await getCedictEntry(token);
    if (dictionaryData == null) {
      let dictionaryEntries = [];
      const edgeCaseSegments = await recursiveSegment(token);
      for (const segment of edgeCaseSegments) {
        dictionaryEntries = dictionaryEntries.concat(await getCedictEntry(segment));
      }
      return res.status(200).json({ dictionaryData: dictionaryEntries, segments: edgeCaseSegments, });
    } else {
      return res.status(200).json({ dictionaryData: dictionaryData });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

const cedictCache = new Map();
const getCedictEntry = async (token) => {
  if (cedictCache.has(token)) {
    return cedictCache.get(token);
  }

  const entry =
    (await cedict.getByTraditional(token)) ||
    (await cedict.getBySimplified(token));

  if (entry) {
    const relevantEntries = [];
    for (const entries of Object.values(entry)) {
      const matchingEntries = entries.filter((e) => {
        const isMatch = e.traditional === token || e.simplified === token;
        return isMatch;
      })
      for (const pinyinEntry of matchingEntries) {
        relevantEntries.push(pinyinEntry);
      }
    }
    cedictCache.set(token, relevantEntries || null);
    return relevantEntries;
  } else {
    cedictCache.set(token, entry || null);
    return entry;
  }
};

const segmentCache = new Map();
const recursiveSegment = async (edgeCase) => {
  if (segmentCache.has(edgeCase)) {
    return segmentCache.get(edgeCase);
  }

  const result = await _recursiveSegmentImpl(edgeCase);
  segmentCache.set(edgeCase, result);
  return result;
};

const _recursiveSegmentImpl = async (segment) => {
  if (segment.length === 0) return [];

  const wholeEntry = await getCedictEntry(segment);
  if (wholeEntry) return [segment];

  for (let splitSize = segment.length - 1; splitSize >= 1; splitSize--) {
    const left = segment.slice(0, splitSize);
    const right = segment.slice(splitSize);

    const leftEntry = await getCedictEntry(left);
    if (leftEntry) {
      const rightSegments = await recursiveSegment(right);
      if (rightSegments) {
        return [left, ...rightSegments];
      }
    }
  }

  if (segment.length >= 1) {
    const firstChar = segment[0];
    const remaining = segment.slice(1);
    return [firstChar, ...(await recursiveSegment(remaining))];
  }

  return [segment];
};

const llmRequest = async (sentence, translation) => {
  const userPrompt = `Sentence: ${sentence}\nTranslation: ${translation}`;

  const client = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY,
  });

  const model = "deepseek-chat";

  const response = await client.chat.completions.create({
    model: model,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
};

// Test case: 你喜欢这个味道吗 simplified
// Traditional: 你喜歡這個味道嗎。
// 你有光明的未来。
// 萨哈达在伊斯兰教是信仰的证明。
// 我让你玩
// 他们已经参加了高考
