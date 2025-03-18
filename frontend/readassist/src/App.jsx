import { useState } from "react";
import MoonLoader from "react-spinners/MoonLoader";
import Ciyu from "./components/Ciyu";

const BASE_URL = "http://127.0.0.1:5000";

function App() {
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [parsedData, setParsedData] = useState([]);

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
    setIsLoading(false);
    setIsPreview(true);
  };

  return (
    <div className="root-container flex bg-red-300 min-w-screen min-h-screen items-center justify-center">
      {isLoading ? (
        <div>
          <MoonLoader size={80} loading={isLoading} />
        </div>
      ) : (
          <div className="inner-container bg-red-400 min-w-[90vw] min-h-[90vh] rounded-md flex items-center justify-center">
            {isPreview ? (
              <>
                <div className="w-full h-full flex items-start justify-center">
                  {parsedData.map((entry) => (
                    <Ciyu
                      key={entry.token}
                      text={entry.token}
                      pinyin={entry.pinyin}
                      prettyPinyin={entry.pretty_pinyin}
                      definitions={entry.definitions}
                      predictedDefinition={entry.predicted_definition}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <input
                  type="text"
                  className="w-full h-[90vh] p-4 text-4xl text-white"
                  placeholder="Paste a Chinese sentence here!"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                />
      
                {userInput === "" ? "" : <button onClick={sendParse}>Go</button>}
              </>
            )}
  
          </div>
      )}
    </div>
  );
}

export default App;
