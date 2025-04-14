import express from "express";
import cors from "cors";
import cedict from "cc-cedict";
import translate from "translate";
import OpenAI from "openai/index.mjs";
import 'dotenv/config'
import isChinese from 'is-chinese';

const app = express();
const PORT = 5000;

const SYSTEM_PROMPT = `Instructions:
  You are a Mandarin language expert. You will be given a Mandarin sentence, it's English translation, the segmentation of it's words (词语), and the dictionary data for each word. Your job is to analyze the sentence, and choose the most likely pinyin reading and dictionary definition for each word in the context of the sentence. 

  Important:
  This is the format of the dictionary data you will receive:
  <word>
  - <reading1>: <definition1>; <definition2>; <definition3>
  - <reading2>: <definition1>; <definition2>
  As you know, a Chinese word can have multiple pinyin readings, that have different definitions, and within these readings, there can be different definitions.
  Please choose just ONE of the definitions that you think the word means in the context of the sentence.

  Here is an example of the dictionary data you will be given
  語
  - yu3: dialect; language; speech
  - yu4: (literary) to tell; to let (sb) know
  In this example there are two entries for the word '語': yu3 and yu4. Definitions are delimited by ';'. 
  yu3 has 3 definitions: 'dialect', 'language', and 'speech'
  yu4 has 2 definitions: '(literary) to tell' and 'to let (sb) know'
  Your goal is choose ONE definition from all entries, and the corresponding pinyin reading for the word in the context of the sentence.

  Rules: 
  - Choose only ONE definition. There should be no ';' in the definition you give
  - Choose the definition you deem to be most likely to be meaning of the word in the context of the sentence
  - DO NOT hallucinate pinyin readings or definitions, the pinyin reading and definition you choose must come the dictionary data given to you
  - Preserve all punctuation in a sentence: Return a segment like { token: "。", pinyin: "", definition: "" } or { token: "，", pinyin: "", definition: "" }
  - For segments of the sentence that are in English or are a number, just return the token with pinyin and definition empty. e.g. { token: "2024", pinyin: "", definition: "" } or { token: "NBA", pinyin: "", definition: "" }

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

  Examples
  User: 
  Sentence: 我喜欢喝茶吗
  Translation: Do I like drinking tea
    
  CC-CEDICT Dictionary Data:
  我
  - wo3: I; me; my

  喜欢
  - xi3 huan5: to like; to be fond of

  喝茶
  - he1 cha2: to drink tea; to get engaged; to have a serious conversation; (fig.) to have a meeting with state security agents (to be warned to behave "responsibly")

  吗
  - ma2: (coll.) what?
  - ma3: used in 嗎啡|吗啡[ma3fei1]
  - ma5: (question particle for "yes-no" questions)

  Mandarin Expert:
  {
    "segments": [
      { "token": "我", "pinyin": "wo3", "definition": "I" },
      { "token": "喜欢", "pinyin": "xi3 huan5", "definition": "to like" },
      { "token": "喝茶", "pinyin": "he1 cha2", "definition": "to drink tea" },
      { "token": "吗", "pinyin": "ma5", "definition": "(question particle for "yes-no" questions" },
    ]
  }

  Example 2 
  User:
  Sentence: 你有光明的未来。
  Translation: You have a bright future
    
  CC-CEDICT Dictionary Data:
  你
  - ni3: you (informal, as opposed to courteous 您[nin2])

  有
  - you3: to have; there is; (bound form) having; with; -ful; -ed; -al (as in 有意[you3yi4] intentional)

  光明
  - guang1 ming2: light; radiance; (fig.) bright (prospects etc); openhearted

  的
  - de5: of; ~'s (possessive particle); (used after an attribute when it modifies a noun); (used at the end of a declarative sentence for emphasis); (used after a noun, verb or adjective to form a nominal expression, as in 皮革的[pi2ge2 de5] "one made of leather" or 跑堂兒的|跑堂儿的[pao3tang2r5de5] "a waiter (literally, one who runs back and forth in a restaurant)" or 新的[xin1 de5] "new one"); also pr. [di4] or [di5] in poetry and songs
  - di1: a taxi; a cab (abbr. for 的士[di1shi4])
  - di2: really and truly
  - di4: (bound form) bull's-eye; target

  未来
  - wei4 lai2: future; tomorrow; approaching; coming; pending

  Mandarin Expert:
  {
    "segments": [
      { "token": "你", "pinyin": "ni3", "definition": "you (informal, as opposed to courteous 您[nin2])" },
      { "token": "有", "pinyin": "you3", "definition": "to have" },
      { "token": "光明", "pinyin": "guang1 ming2", "definition": "bright (prospects etc)" },
      { "token": "的", "pinyin": "de5", "definition": "(used after an attribute when it modifies a noun)" },
      { "token": "未来", "pinyin": "wei4 lai2", "definition": "future" },
      { "token": "。", "pinyin": "", "definition": "" },
    ]
  }`;

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

app.post("/parse", async (req, res) => {
  const { sentence } = req.body;
  if (!sentence) {
    res.status(400).json({ error: "No input provided" });
  }

  try {
    let raw = [];
    let dictEntries = [];
    const translation = await translate(sentence, { from: "zh", to: "en" });

    const segments = Array.from(
      new Intl.Segmenter("cn", { granularity: "word" }).segment(sentence)
    );
    let finalSegments = [];

    for (const segmentEntry of segments) {
      const segment = segmentEntry.segment;
      let entry = await getCedictEntry(segment);
      if (entry === null) {
        if (!isChinese(segment)) {
          finalSegments.push(segment);
        } else {
          if (segment.length == 1) {
            const item = {
              token: segment,
              entries: "punctuation",
            };
            dictEntries.push(item);
          } else if (segment.length == 2) {
            for (let i = 0; i < segment.length; i++) {
              let individual = await getCedictEntry(segment[i]);
  
              const item = {
                token: segment[i],
                entries: individual,
              };
              dictEntries.push(item);
              finalSegments.push(segment[i]);
            }
          } else {
            const edgeCaseSegments = await recursiveSegment(segment);
            for (let i = 0; i < edgeCaseSegments.length; i++) {
              let individual = await getCedictEntry(edgeCaseSegments[i]);
  
              const item = {
                token: edgeCaseSegments[i],
                entries: individual,
              };
              dictEntries.push(item);
              finalSegments.push(edgeCaseSegments[i]);
            }
          }
        }
      } else {
        const item = {
          token: segment,
          entries: entry,
        };
        dictEntries.push(item);
        finalSegments.push(segment);
      }
      raw.push(entry);
    }

    const llmPrediction = await llmRequest(sentence, finalSegments, dictEntries, translation);

    res
      .status(200)
      .json({
        translation: translation,
        dictEntries: dictEntries,
        finalSegments: finalSegments,
        segments: segments,
        parsed: llmPrediction,
      });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/definitionLookup", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: "No input provided" });
  }

  try {
    const dictionaryData = await getCedictEntry(token);
    res.status(200).json({ dictionaryData: dictionaryData });
  } catch (e) {
    res.status(500).json({ error: e.message });
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
  cedictCache.set(token, entry || null);
  return entry;
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

const llmRequest = async (sentence, segments, dictionaryData, translation) => {
  const buildUserPrompt = (sentence, segments, dictionaryData, translation) => {
    const entryMap = new Map();
    dictionaryData.forEach((entry) => {
      entryMap.set(entry.token, entry);
    });

    const formattedSegments = segments.map((segment) => {

      const entry = entryMap.get(segment);
      if (!entry) {
        return `${segment}\n   No dictionary entry found`;
      }

      const validEntries = [];
      for (const [pinyin, entries] of Object.entries(entry.entries)) {

        // Filter entries that match the segment token
        const matchingEntries = entries.filter((e) => {
          const isMatch = e.traditional === segment || e.simplified === segment;
          return isMatch;
        });

        if (matchingEntries.length > 0) {
          const definitions = matchingEntries
            .flatMap((e) => e.english)
            .join("; ");

          validEntries.push(`- ${pinyin}: ${definitions}`);
        }
      }

      const result =
        validEntries.length > 0
          ? `${segment}\n   ${validEntries.join("\n   ")}`
          : `${segment}\n   No valid entries match token`;

      return result;
    });

    const finalPrompt = `Sentence: ${sentence}\nTranslation: ${translation}\n\n CC-CEDICT Dictionary Data:\n${formattedSegments.join(
      "\n\n"
    )}`;

    return finalPrompt;
  };

  const userPrompt = buildUserPrompt(sentence, segments, dictionaryData, translation);
  console.log(userPrompt);

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
    response_format: { type: 'json_object' }
  })

  return JSON.parse(response.choices[0].message.content);
};

// Test case: 你喜欢这个味道吗 simplified
// Traditional: 你喜歡這個味道嗎。
// 你有光明的未来。
// 萨哈达在伊斯兰教是信仰的证明。
// 我让你玩
// 他们已经参加了高考