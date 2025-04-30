import { useState, useEffect, useRef } from "react";
import { convertPinyin } from "../utils/Utils";
import { useZIndexStore } from "../stores/useZIndexStore";
import { BookText } from "lucide-react";

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
    // Prevent default to stop scroll/zoom on touch devices
    if (e.type === 'touchstart') {
      e.preventDefault();
    }
    
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const rect = e.currentTarget.getBoundingClientRect();
    const isTopBar = clientY - rect.top < 40;
    
    if (isTopBar) {
      setZIndex(getNextZIndex());
      setIsDragging(true);
      
      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      
      dragStartPos.current = {
        x: clientX - position.x,
        y: clientY - position.y,
      };
      
      e.currentTarget.style.cursor = "grabbing";
    }
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      
      // Prevent default behavior (scrolling) when dragging
      if (e.cancelable) {
        e.preventDefault();
      }
      
      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      
      setPosition({
        x: clientX - dragStartPos.current.x,
        y: clientY - dragStartPos.current.y,
      });
    };
  
    const handleStopDrag = () => {
      if (!isDragging) return;
      
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
      document.removeEventListener('touchmove', handleMove);
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
      <div className="p-2 pt-4">
        {dictionaryData.map((entry, index) => (
          <PinyinEntry key={index} entry={entry} />
        ))}
      </div>
      <a href={`https://www.mdbg.net/chinese/dictionary?wdqb=${token}`} target="_blank" rel="noopener noreferrer" className="absolute right-1 top-1 flex items-center">
        <BookText size={15} />MDBG
      </a>
    </div>
  );
}

export default DictionaryPopup;