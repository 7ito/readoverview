import { useEffect, useState } from "react";

function Ciyu({ text, pinyin, definition }) {

  const Zi = ({ text, pinyin }) => {
    const [fontColor, setFontColor] = useState("");

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

    function convertPinyin(pinyinStr) {
      const getAccentedVowel = (vowel, tone) => {
          const vowelMap = {
              'a': { '1': 'ā', '2': 'á', '3': 'ǎ', '4': 'à' },
              'o': { '1': 'ō', '2': 'ó', '3': 'ǒ', '4': 'ò' },
              'e': { '1': 'ē', '2': 'é', '3': 'ě', '4': 'è' },
              'i': { '1': 'ī', '2': 'í', '3': 'ǐ', '4': 'ì' },
              'u': { '1': 'ū', '2': 'ú', '3': 'ǔ', '4': 'ù' },
              'ü': { '1': 'ǖ', '2': 'ǘ', '3': 'ǚ', '4': 'ǜ' }
          };
          return vowelMap[vowel]?.[tone] || vowel;
      };
  
      return pinyinStr.split(' ')
          .map(syllable => {
              if (!syllable) return '';
              
              // Extract tone and letters
              let tone = '5';
              const matches = syllable.match(/(.*?)(\d)$/);
              let letters = matches ? matches[1] : syllable;
              tone = matches ? matches[2] : '5';
  
              // Handle ü cases
              letters = letters.replace(/u:/g, 'ü');
  
              if (tone === '5') return letters;
  
              const lettersArr = letters.split('');
              let selectedIndex = -1;
              const priority = ['a', 'o', 'e'];
  
              // Check for a, o, e in priority order
              for (let i = 0; i < lettersArr.length; i++) {
                  const c = lettersArr[i];
                  if (priority.includes(c)) {
                      if (selectedIndex === -1) selectedIndex = i;
                      else if (priority.indexOf(c) < priority.indexOf(lettersArr[selectedIndex])) {
                          selectedIndex = i;
                      }
                  }
              }
  
              // If no a/o/e found, find last i/u/ü
              if (selectedIndex === -1) {
                  for (let i = lettersArr.length - 1; i >= 0; i--) {
                      if (['i', 'u', 'ü'].includes(lettersArr[i])) {
                          selectedIndex = i;
                          break;
                      }
                  }
              }
  
              if (selectedIndex !== -1) {
                  const original = lettersArr[selectedIndex];
                  lettersArr[selectedIndex] = getAccentedVowel(original, tone);
              }
  
              return lettersArr.join('');
          })
          .join(' ');
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
      <div className="definition">{definition}</div>
    </div>
  );
}

export default Ciyu;