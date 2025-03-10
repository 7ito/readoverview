import { useState } from "react";

const BASE_URL = "https://127.0.0.1:5000";

function App() {
  const [userInput, setUserInput] = useState("");

  const sendParse = async () => {
    const response = await fetch(`${BASE_URL}/parse`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sentence: userInput }),
    });
    const data = await response.json();
    console.log(data);
  }

  return (
    <div className="root-container flex bg-red-300 min-w-screen min-h-screen items-center justify-center">
      <div className="inner-container bg-red-400 min-w-[90vw] min-h-[90vh] rounded-md flex items-center justify-center">
        <input
          type="text"
          className="w-full h-[90vh] p-4 text-4xl text-white"
          placeholder="Paste a Chinese sentence here!"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />

        {userInput === "" ? "" : <button onClick={sendParse}>Go</button>}

        {/* <div className="w-full h-full flex items-center justify-center">
          {parsed.map((entry) => (
            <Ciyu
              key={entry.token}
              text={entry.token}
              pinyin={entry.pinyin}
              definitions={entry.definitions}
            />
          ))}
        </div> */}
      </div>
    </div>
  );
}

export default App;