import { useState, useEffect, useRef } from "react";
import GridLoader from "react-spinners/GridLoader";
import Ciyu from "./components/Ciyu";
import { ArrowLeft, CircleHelp } from 'lucide-react';
import InfoModal from "./components/InfoModal";
import { hasChineseText } from "./utils/Utils";

function App() {
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [translation, setTranslation] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const editableRef = useRef(null);

  useEffect(() => {
    setIsValid(hasChineseText(userInput, 0.25));

    if (!editableRef.current) return;

    if (editableRef.current.innerHTML === '<br>') {
      editableRef.current.innerHTML = '';
    }
  }, [userInput]);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setIsModalOpen(true);
      localStorage.setItem('hasVisited', 'true');
    }
  }, []);

  const sendParse = async () => {
    if (!isValid) {
      return;
    }

    setIsLoading(true);
    const response = await fetch(`${import.meta.env.VITE_BASE_URL}/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sentence: userInput }),
    });
    const data = await response.json();
    setParsedData(data.parsed);
    setTranslation(data.translation);
    setIsLoading(false);
    setIsPreview(true);
  };

  const resetPage = () => {
    setUserInput("");
    setIsPreview(false);
  }

  return (
    <div className="root-container flex bg-red-300 min-w-screen min-h-screen items-center justify-center">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center text-lg">
          <span className="pb-[2em]">Breaking it down...</span>
          <GridLoader size={40} loading={isLoading} />
          <span className="pt-[2em]">Please allow up to 60 seconds or more depending on the length of the sentence!</span>
          <span className="pt-2">Click the icon at the top right for more information.</span>
        </div>
      ) : (
          <>
            {isPreview ? (
              <div className="inner-container bg-red-300 flex flex-col items-center justify-center mx-[5em]">
                <button className="absolute top-0 left-0 focus:outline-0 bg-red-300 px-[0.6em] py-[1.2em] cursor-pointer" onClick={() => resetPage()}><ArrowLeft /></button>
                <div className="text-4xl text-black text-center pb-[2em]">{translation}</div>
                <div className="flex items-start justify-center flex-wrap pt-3">
                  {parsedData.segments.map((entry) => (
                    <Ciyu
                      key={entry.token}
                      text={entry.token}
                      pinyin={entry.pinyin.split(" ")}
                      definition={entry.definition}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="inner-container bg-red-400 w-[90vw] h-[90vh] rounded-md flex flex-col items-center justify-center">
                <div
                  ref={editableRef}
                  className="flex items-center justify-center w-full h-full p-4 text-4xl text-white text-center focus:outline-0 leading-normal resize-none"
                  onInput={(e) => setUserInput(e.currentTarget.textContent)}
                  contentEditable="plaintext-only"
                  data-placeholder="Paste a Chinese sentence here!"
                >
                </div>

                {!isValid && userInput.length > 1 && (
                  <div className="text-xl text-red-600">
                    Please ensure at least 25% of text is Chinese characters
                  </div>
                )}
      
                {userInput.length > 0 && <button onClick={sendParse} className="text-[1.2em] font-bold px-[0.6em] py-[1.2em] cursor-pointer">Go</button>}
              </div>
            )}
          </>
      )}
      <CircleHelp onClick={() => setIsModalOpen(true)} className="fixed right-3 top-3" />
      <InfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        
      </InfoModal>
    </div>
  );
}

export default App;