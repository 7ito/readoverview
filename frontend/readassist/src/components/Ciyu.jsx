import { useEffect, useState } from "react";

function Ciyu({ text, pinyin, prettyPinyin, definitions, predictedDefinition }) {

  const Zi = ({ text, pinyin, prettyPinyin }) => {
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

    return (
      <div className="flex flex-col justify-center items-center" style={{'color': fontColor}}>
        <div className="text-xl">
          {prettyPinyin}
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
        {pinyin.map((pinyinEntry, index) => <Zi text={text.substring(index, index + 1)} pinyin={pinyinEntry} prettyPinyin={prettyPinyin[index]} />)}
      </div>
      <div className="definition">{predictedDefinition}</div>
    </div>
  );
}

export default Ciyu;