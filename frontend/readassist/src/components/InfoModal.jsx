import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Ciyu from "./Ciyu";
import { X } from "lucide-react";

const exampleParsed = [
  {
    "token": "你",
    "pinyin": "ni3",
    "definition": "you"
  },
  {
    "token": "有",
    "pinyin": "you3",
    "definition": "have"
  },
  {
    "token": "光明",
    "pinyin": "guang1 ming2",
    "definition": "bright"
  },
  {
    "token": "的",
    "pinyin": "de",
    "definition": "'s (possessive particle)"
  },
  {
    "token": "未来",
    "pinyin": "wei4 lai2",
    "definition": "future"
  },
  {
    "token": "。",
    "pinyin": "",
    "definition": ""
  }
];

export default function InfoModal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocus.current = document.activeElement;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) firstElement.focus();

    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      } else if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleTab);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleTab);
      document.removeEventListener("keydown", handleEscape);
      previousFocus.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={modalRef}
      role="dialog"
      className="fixed inset-0 flex items-center justify-center p-4 z-20000"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative bg-red-300 rounded-lg shadow-xl max-w-full max-h-[90vh] w-full md:w-auto md:min-w-[500px] overflow-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100"
        >
          <X />
        </button>

        {/* Content */}
        <div className="p-6 text-black">
          <h2 id="modal-title" className="text-3xl font-bold mb-4 text-center">
            About
          </h2>
          <div className="prose flex flex-col">
            {children}
            <span>(name) is a tool that gives you an at a glance overview/break down of a Chinese sentence.</span>
            <span>&nbsp;</span>       
            <span className="font-bold text-xl">Usage</span>
            <span>1. Paste or type in a Chinese sentence, and click Go</span>
            <span>2. Wait (I'm sorry, please allow up to 1 minute)</span>
            <span>3. Take a look</span>

            <span className="py-2">
              <div className="text-4xl text-black text-center">You have a bright future.</div>
              <div className="flex items-start justify-center flex-wrap pt-3">
                {exampleParsed.map((entry) => (
                  <Ciyu
                    key={entry.token}
                    text={entry.token}
                    pinyin={entry.pinyin.split(" ")}
                    definition={entry.definition}
                  />
                ))}
              </div>
            </span>

            <span className="font-bold text-lg">Try it!</span>
            <span>Clicking on a word/segment will bring up the full dictionary listing for that word, and the link on the bottom right</span>
            <span>sends you to the MDBG entry.</span>
            <span>The entries take up a lot of space, so you can drag them around the window, and click on the word again to close it.</span>

            <span>&nbsp;</span>
            <span className="font-bold text-xl">Limitations</span>
            <span>Currently, this is done by prompting DeepSeek V3, which unfortunately means inconsistency in the wording of</span>
            <span>definitions, and significantly long loading times.</span>
            <span>15-90+ seconds depending on the length of the sentence (the sentence in the example can be considered as short).</span>
            <span>Longer sentences/paragraphs may take too long and trigger a time out from the DeepSeek API, which</span>
            <span>can cause it to error.</span>
            <span>The prompt is centered around analyzing sentences with semantic meaning, so shorter strings of text may</span>
            <span>yield off or unsatisfactory results.</span>

            <span>&nbsp;</span>
            <span className="font-bold text-xl">Next Steps</span>
            <span>The next major step for this project is to fine-tune a model specifically for analyzing and breaking down Chinese</span>
            <span>sentences in this manner. This will provide massive reductions in time using a smaller specialized model compared</span>
            <span>to the 671b parameter DeepSeek V3.</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}