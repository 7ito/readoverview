import { useState, useEffect, useRef } from "react";
import { convertPinyin } from "../utils/Utils";
import { useZIndexStore } from "../stores/useZIndexStore";
import { BookText, X } from "lucide-react";

function DictionaryPopup({ token, parentRef, onClose }) {
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
    const response = await fetch(`${import.meta.env.VITE_BASE_URL}/definitionLookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: token }),
    });
    const data = await response.json();
    setDictionaryData(data.dictionaryData);
  };

  const handleStartDrag = (e) => {
    let clientX, clientY;
    console.log(e);

    if (e.type === 'touchstart') {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;

      const rect = e.currentTarget.getBoundingClientRect();
      if (clientY - rect.top < 40) {
        e.preventDefault();
      } else {
        return;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
      
      const rect = e.currentTarget.getBoundingClientRect();
      if (clientY - rect.top >= 40) {
        return;
      }
    }

    setZIndex(getNextZIndex());
    setIsDragging(true);

    dragStartPos.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };

    if (popupRef.current) {
      popupRef.current.style.cursor = "grabbing";
    }
  };

  useEffect(() => {
    const handleMove = (e) => {
      console.log(e);
      if (!isDragging) return;
      
      // Prevent default behavior (scrolling) when dragging
      if (e.cancelable) {
        e.preventDefault();
      }

      let clientX, clientY;

      if (e.type === 'touchmove') {
        const touch = e.touches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      setPosition({
        x: clientX - dragStartPos.current.x,
        y: clientY - dragStartPos.current.y,
      });
    };
  
    const handleStopDrag = (e) => {
      if (!isDragging) return;
      console.log(e);
      
      setIsDragging(false);
      if (popupRef.current) {
        popupRef.current.style.cursor = 'grab';
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('mouseup', handleStopDrag);
      document.addEventListener('touchend', handleStopDrag);
      document.addEventListener('touchcancel', handleStopDrag);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove, { passive: false });
      document.removeEventListener('mouseup', handleStopDrag);
      document.removeEventListener('touchend', handleStopDrag);
      document.removeEventListener('touchcancel', handleStopDrag);
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
                  key={index}
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
            <span key={index}>
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
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'fixed',
        touchAction: 'none',
      }}
      className="border border-black shadow-xl rounded-sm bg-amber-200 text-black w-[300px] md:w-[400px] lg:w-[600px]"
      onClick={() => setZIndex(getNextZIndex())}
      onMouseDown={handleStartDrag}
      onTouchStart={handleStartDrag}
    >
      {dictionaryData.map((entry, index) => (
        <div style={{ maxWidth: index == dictionaryData.length - 1 ? "80%" : "" }}>  
          <PinyinEntry key={index} entry={entry} />
        </div>
      ))}
      <X size={15} className="absolute right-1 top-1 hover:cursor-auto" onClick={onClose}/>

      <a href={`https://www.mdbg.net/chinese/dictionary?wdqb=${token}`} target="_blank" rel="noopener noreferrer" className="absolute right-1 bottom-1 flex items-center">
        <BookText size={15} />MDBG
      </a>
    </div>
  );
}

export default DictionaryPopup;