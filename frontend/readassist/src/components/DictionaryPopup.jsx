import { useState, useEffect, useRef } from "react";
import { convertPinyin } from "../utils/Utils";
import { useZIndexStore } from "../stores/useZIndexStore";
import { BookText } from "lucide-react";

const BASE_URL = "http://127.0.0.1:5000";

function DictionaryPopup({ token, parentRef }) {
  const { getNextZIndex } = useZIndexStore();
  const [dictionaryData, setDictionaryData] = useState([]);
  const [zIndex, setZIndex] = useState(100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const popupRef = useRef(null);

  useEffect(() => {
    dictionaryLookup(token);
    setZIndex(getNextZIndex());

    if (parentRef.current && popupRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect();
      const popupWidth = popupRef.current.offsetWidth;

      setPosition({ x: parentRect.left, y: parentRect.bottom + 8 });

      if (parentRect.left + popupWidth > window.innerWidth) {
        setPosition((prev) => ({
          ...prev,
          x: window.innerWidth - popupWidth - 8,
        }));
      }
    }
  }, [token, getNextZIndex, parentRef]);

  const dictionaryLookup = async (token) => {
    const response = await fetch(`${BASE_URL}/definitionLookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: token }),
    });
    const data = await response.json();
    console.log(data.dictionaryData);
    setDictionaryData(data.dictionaryData);
  };

  const handleMouseDown = (e) => {
    const isTopBar =
      e.clientY - e.currentTarget.getBoundingClientRect().top < 40;
    if (isTopBar) {
      setZIndex(getNextZIndex());
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
      e.currentTarget.style.cursor = "grabbing";
    }
  };

  const handleMouseUp = (e) => {
    setIsDragging(false);
    if (popupRef.current) {
      popupRef.current.style.cursor = '';
    }
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y,
      });
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const PinyinEntry = ({ entry }) => {
    return (
      <div className="pl-1 py-1">
        <div className="flex flex-col">
          <div className="token flex flex-row text-[1.2em]">
            {entry.simplified === entry.traditional ? (
              <span className="pr-2">{entry.traditional}</span>
            ) : (
              <>
                <span className="pr-2">{entry.simplified}</span>
                <span className="pr-2">{entry.traditional}</span>
              </>
            )}
            <span>
              {convertPinyin(entry.pinyin).pinyinString.map((pinyin, index) => (
                <span
                  style={{ color: convertPinyin(entry.pinyin).colors[index] }}
                >
                  {pinyin}{" "}
                </span>
              ))}
            </span>
          </div>
        </div>
        <div className="definitions text-[0.8em]">
          {entry.english.map((definition, index) => (
            <span>
              {index < entry.english.length - 1
                ? `${definition} ◆ `
                : definition}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={popupRef}
      style={{ 
        zIndex: zIndex,
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: 'grab',
        position: 'fixed'
      }}
      className="border border-black shadow-xl rounded-sm bg-amber-200 text-black w-[600px]"
      onClick={() => setZIndex(getNextZIndex())}
      onMouseDown={handleMouseDown}
    >
      {dictionaryData.map((entry) => (
        <PinyinEntry entry={entry} />
      ))}
      <a href={`https://www.mdbg.net/chinese/dictionary?wdqb=${token}`} target="_blank" className="absolute right-1 top-1 flex items-center"><BookText size={15} />MDBG</a>
    </div>
  );
}

export default DictionaryPopup;