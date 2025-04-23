export const convertPinyin = (pinyinStr) => {
  const getAccentedVowel = (vowel, tone) => {
    const vowelMap = {
      a: { 1: "ā", 2: "á", 3: "ǎ", 4: "à" },
      o: { 1: "ō", 2: "ó", 3: "ǒ", 4: "ò" },
      e: { 1: "ē", 2: "é", 3: "ě", 4: "è" },
      i: { 1: "ī", 2: "í", 3: "ǐ", 4: "ì" },
      u: { 1: "ū", 2: "ú", 3: "ǔ", 4: "ù" },
      ü: { 1: "ǖ", 2: "ǘ", 3: "ǚ", 4: "ǜ" },
    };
    return vowelMap[vowel]?.[tone] || vowel;
  };

  const resString = pinyinStr
    .split(" ")
    .map((syllable) => {
      if (!syllable) return "";

      // Extract tone and letters
      let tone = "5";
      const matches = syllable.match(/(.*?)(\d)$/);
      let letters = matches ? matches[1] : syllable;
      tone = matches ? matches[2] : "5";

      // Handle ü cases
      letters = letters.replace(/u:/g, "ü");

      if (tone === "5") return letters;

      const lettersArr = letters.split("");
      let selectedIndex = -1;
      const priority = ["a", "o", "e"];

      // Check for a, o, e in priority order
      for (let i = 0; i < lettersArr.length; i++) {
        const c = lettersArr[i];
        if (priority.includes(c)) {
          if (selectedIndex === -1) selectedIndex = i;
          else if (
            priority.indexOf(c) < priority.indexOf(lettersArr[selectedIndex])
          ) {
            selectedIndex = i;
          }
        }
      }

      // If no a/o/e found, find last i/u/ü
      if (selectedIndex === -1) {
        for (let i = lettersArr.length - 1; i >= 0; i--) {
          if (["i", "u", "ü"].includes(lettersArr[i])) {
            selectedIndex = i;
            break;
          }
        }
      }

      if (selectedIndex !== -1) {
        const original = lettersArr[selectedIndex];
        lettersArr[selectedIndex] = getAccentedVowel(original, tone);
      }

      return lettersArr.join("");
    });

    const toneColorMapping = {
        0: '#000000',
        1: '#FF0000',
        2: '#D09000',
        3: '#00A000',
        4: '#0044FF',
        5: '#000000',
    };

    let colors = [];
    for (const pinyin of pinyinStr.split(' ')) {
        colors.push(toneColorMapping[pinyin.substring(pinyin.length-1)]);
    }

    return { pinyinString: resString, colors: colors };
}

export const hasChineseText = (text, threshold = 0.3) => {
  if (!text || text.length < 2) return false;

  const chineseRanges = [
    '\u4e00-\u9fff',   // Common
    '\u3400-\u4dbf',   // Ext A
    '\uf900-\ufaff',   // Compat
    '\u3000-\u303f',   // Punctuation
    '\uff00-\uffef'    // Full-width chars
  ];

  const chineseRegex = new RegExp(`[${chineseRanges.join('')}]`, 'g');
  const chineseMatches = text.match(chineseRegex) || [];
  const ratio = chineseMatches.length / text.length;

  return ratio >= threshold;
}