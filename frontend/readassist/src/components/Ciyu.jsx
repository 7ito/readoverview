function Ciyu({ text, definitions, pinyin }) {

    return (
      <div className="pane p-2 flex justify-center items-center flex-col">
        <div className="original-text text-4xl">{text}</div>
        <div className="pinyin text-xl flex flex-row">{pinyin}</div>
        {/* <div className="definition">{definitions}</div> */}
      </div>
    );
  }
  
  export default Ciyu;