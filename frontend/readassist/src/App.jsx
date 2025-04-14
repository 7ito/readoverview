import { useState } from "react";
import MoonLoader from "react-spinners/MoonLoader";
import Ciyu from "./components/Ciyu";

const BASE_URL = "http://127.0.0.1:5000";

function App() {
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [translation, setTranslation] = useState("");

  const sendParse = async () => {
    setIsLoading(true);
    const response = await fetch(`${BASE_URL}/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sentence: userInput }),
    });
    const data = await response.json();
    console.log(data);
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
        <div>
          <MoonLoader size={80} loading={isLoading} />
        </div>
      ) : (
          <>
            {isPreview ? (
              <div className="inner-container bg-red-300 flex flex-col items-center justify-center">
                <button className="absolute top-0 left-0 focus:outline-0" onClick={() => resetPage()}>Back</button>
                <div className="text-4xl text-black text-center py-3">{translation}</div>
                <div className="flex items-start justify-center flex-wrap">
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
              <div className="inner-container bg-red-400 min-w-[90vw] min-h-[90vh] rounded-md flex flex-col items-center justify-center">
                <textarea
                  type="text"
                  className="w-[90vw] max-h-[90vh] p-4 text-4xl text-white text-center focus:outline-0 leading-normal resize-none"
                  placeholder="Paste a Chinese sentence here!"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                >
                </textarea>
      
                {userInput === "" ? "" : <button onClick={sendParse}>Go</button>}
              </div>
            )}
          </>
      )}
    </div>
  );
}

export default App;