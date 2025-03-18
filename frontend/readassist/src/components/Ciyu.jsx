import { useEffect, useState } from "react";

function Ciyu({ text, pinyin, definitions, predictedDefinition }) {

  const Zi = ({ text, pinyin }) => {
    const [fontColor, setFontColor] = useState("");

    const toneMappings = {
      'a': {1: 'ā', 2: 'á', 3: 'ǎ', 4: 'à'},
      'e': {1: 'ē', 2: 'é', 3: 'ě', 4: 'è'},
      'i': {1: 'ī', 2: 'í', 3: 'ǐ', 4: 'ì'},
      'o': {1: 'ō', 2: 'ó', 3: 'ǒ', 4: 'ò'},
      'u': {1: 'ū', 2: 'ú', 3: 'ǔ', 4: 'ù'},
      'A': {1: 'Ā', 2: 'Á', 3: 'Ǎ', 4: 'À'},
      'E': {1: 'Ē', 2: 'É', 3: 'Ě', 4: 'È'},
      'I': {1: 'Ī', 2: 'Í', 3: 'Ǐ', 4: 'Ì'},
      'O': {1: 'Ō', 2: 'Ó', 3: 'Ǒ', 4: 'Ò'},
      'U': {1: 'Ū', 2: 'Ú', 3: 'Ǔ', 4: 'Ù'},
     }

    useEffect(() => {
      switch (pinyin.substring(pinyin.length-1)) {
        case '1':
          setFontColor('#FF0000');
          break;
        case '2':
          setFontColor('#D09000');
          break;
        case '3':
          setFontColor('#00A000');
          break;
        case '4':
          setFontColor('#0044FF');
          break;
        default:
          setFontColor('#000000');
          break;
      }      
    }, [pinyin]);

    function convertPinyin(pinyin) {
      const tone = parseInt(pinyin.slice(-1), 10);

      const base = pinyin.slice(0, -1);

      const vowelMatch = base.match(/[aeiouv]/);
      if (!vowelMatch) return base; 

      const vowel = vowelMatch[0];
      const index = vowelMatch.index;

      const toneMarkedVowel = toneMappings[vowel][tone - 1] || vowel;
      const result = base.slice(0, index) + toneMarkedVowel + base.slice(index + 1);

      return result;
    }

    return (
      <div className="flex flex-col justify-center items-center" style={{'color': fontColor}}>
        <div className="text-xl">
          {convertPinyin(pinyin)}
        </div>
        <div className="text-4xl">
          {text}
        </div>
      </div>
    );
  };

  return (
    <div className="pane p-4 flex justify-center items-center flex-col max-w-[150px]">
      <div className="flex flex-row">
        {pinyin.map((pinyinEntry, index) => <Zi text={text.substring(index, index + 1)} pinyin={pinyinEntry} />)}
      </div>
      <div className="definition">{predictedDefinition}</div>
    </div>
  );
}

export default Ciyu;