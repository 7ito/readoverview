import { useState, useEffect, useRef } from "react";
import Ciyu from "./components/Ciyu";
import { ArrowLeft, CircleHelp } from "lucide-react";
import InfoModal from "./components/InfoModal";
import { hasChineseText } from "./utils/Utils";
import SyncLoader from "react-spinners/SyncLoader";
import { IncompleteJsonParser } from "incomplete-json-parser";

function App() {
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [segments, setSegments] = useState([]);
  const [translation, setTranslation] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isCharLimitExceeded, setIsCharLimitExceeded] = useState(false);
  const editableRef = useRef(null);
  const CHAR_LIMIT = 150;

  useEffect(() => {
    setIsValid(hasChineseText(userInput, 0.25));
    setCharCount(userInput.length);

    if (!editableRef.current) return;

    if (editableRef.current.innerHTML === "<br>") {
      editableRef.current.innerHTML = "";
    }
  }, [userInput]);

  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisited");
    if (!hasVisited) {
      setIsModalOpen(true);
      localStorage.setItem("hasVisited", "true");
    }
  }, []);

  const sendParse = async () => {
    if (!isValid) return;
    setSegments([]);
    setTranslation("");
    let contentBuffer = "";
    setIsPreview(true);
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/parse`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sentence: userInput }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });;

        while (true) {
            const lineEnd = buffer.indexOf('\n');
            if (lineEnd === -1) break;

            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);

            if (line.startsWith('data: ')) {
                const data = line.slice(6);

                if (data === '[DONE]') {
                    setSegments(JSON.parse(contentBuffer).segments);
                    break;
                }

                try {
                    const parsed = JSON.parse(data);

                    if (parsed.metadata) {
                        setTranslation(parsed.metadata.translation);
                        continue;
                    }

                    if (parsed.choices && parsed.choices[0]?.delta?.content) {
                        contentBuffer += parsed.choices[0].delta.content;

                        const partialParsed = IncompleteJsonParser.parse(contentBuffer);
                        console.log(partialParsed);

                        if (partialParsed && partialParsed.segments && Array.isArray(partialParsed.segments)) {
                            setSegments(partialParsed.segments);
                        }
                    }
                } catch (e) {
                    console.error('Error parsing JSON stream:', e);
                }
            }
        }
      }
    } catch (error) {
      console.error('Error fetching streamed response:', error);
    } finally {
      setIsLoading(false);
      console.log(segments);
    }
  };

  const resetPage = () => {
    setUserInput("");
    setIsPreview(false);
  };

  const handleInput = (e) => {
    const text = e.currentTarget.textContent;
    if (text.length <= CHAR_LIMIT) {
      setUserInput(text);
      setIsCharLimitExceeded(false);
    } else {
      e.currentTarget.textContent = text.slice(0, CHAR_LIMIT);
      setIsCharLimitExceeded(true);
      setUserInput(text.substring(0, CHAR_LIMIT));
    }
  };

  return (
    <div className="root-container flex flex-col bg-red-300 min-w-screen min-h-screen items-center justify-center">
      <div className="absolute right-3 top-3 flex gap-2">
        <CircleHelp
          onClick={() => setIsModalOpen(true)}
        />
      </div>
        {isPreview ? (
          <div className="inner-container bg-red-300 flex flex-col items-center justify-center mx-[5em]">
            <button
              className="absolute top-0 left-0 focus:outline-0 bg-red-300 hover:bg-gray-100/60 px-[0.6em] py-[1.2em] cursor-pointer"
              onClick={() => resetPage()}
            >
              <ArrowLeft />
            </button>
            <div className="text-xl lg:text-4xl text-black text-center py-[2em]">
              {translation}
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center flex-wrap pt-3">
              {segments.map((entry) => (
                <Ciyu
                  key={entry.token}
                  text={entry.token}
                  pinyin={entry.pinyin ? entry.pinyin.split(" ") : [""]}
                  definition={entry.definition}
                />
              ))}
            </div>
            {isLoading && <SyncLoader className="pt-[3em]" />}
          </div>
        ) : (
          <div className="inner-container bg-red-400 w-[90vw] h-[90vh] rounded-md flex flex-col items-center justify-center overflow-auto">
            <div
              ref={editableRef}
              className="flex items-center justify-center w-full h-full p-4 text-xl lg:text-4xl text-white text-center focus:outline-0 leading-normal resize-none whitespace-pre-wrap break-all"
              onInput={handleInput}
              contentEditable="plaintext-only"
              data-placeholder="Paste or type a Chinese sentence here"
            ></div>

            {isCharLimitExceeded && (
              <div className="text-sm lg:text-xl text-red-600 text-center">
                Maximum character limit exceeded (150 characters)
              </div>
            )}

            {!isValid && userInput.length > 1 && (
              <div className="text-sm lg:text-xl text-red-600 text-center">
                Please ensure at least 25% of text is Chinese characters
              </div>
            )}

            {userInput.length > 0 && (
              <button
                onClick={sendParse}
                className="bg-[#cc5052] hover:bg-[#b24648] border rounded-sm text-[1.2em] font-bold px-[1em] mx-[0.3em] py-[0.3em] my-[0.6em] cursor-pointer"
              >
                Go
              </button>

            )}
            <div
              className="text-base text-gray-600 lg:text-lg py-2"
              style={{
                color: charCount > CHAR_LIMIT ? 'red' : '#4a5565'
              }}
            >
              {charCount}/{CHAR_LIMIT}
            </div>
          </div>
        )}

      <InfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      ></InfoModal>
    </div>
  );
}

export default App;