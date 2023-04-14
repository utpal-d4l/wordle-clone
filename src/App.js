import { useEffect, useRef, useState } from "react";
import "./index.css";

const ROWS = 6,
  COLS = 5;

const STATES = Object.freeze({
  INDETERMINATE: "INDETERMINATE",
  CORRECT: "CORRECT",
  INCORRECT: "INCORRECT",
  INVALID: "INVALID",
});

const STATE_COLORS = Object.freeze({
  CORRECT: "#6AAA64",
  INCORRECT: "#C9B458",
  INVALID: "#787C7E",
});

const KEYBOARD_LAYOUT = Object.freeze([
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Enter", "Z", "X", "C", "V", "B", "N", "M", "Backspace"],
]);

const WORDS = Object.freeze([
  "APPLE",
  "FRUIT",
  "GAMES",
  "PASTE",
  "TOWER",
  "REACT",
  "PAINT",
  "FAINT",
  "BEAST",
  "FEAST",
]);

const isValidKey = (key = "") => {
  return (
    key === "Enter" ||
    key === "Backspace" ||
    (key.length === 1 &&
      key.toUpperCase().charCodeAt() >= 65 &&
      key.toUpperCase().charCodeAt() <= 90)
  );
};

const classNames = (...args) => args.filter(Boolean).join(" ");

const getWordMap = (word = "") => {
  const map = new Map();
  for (let i = 0; i < word.length; ++i) {
    if (!map.has(word[i])) map.set(word[i], 0);
    map.set(word[i], map.get(word[i]) + 1);
  }
  return map;
};

const Keyboard = ({ onPressKey = () => {} }) => {
  return (
    <section className="keyboard-section">
      {KEYBOARD_LAYOUT.map((row, rowIndex) => {
        return (
          <div className="keyboard-row" key={rowIndex}>
            {row.map((letter) => {
              return (
                <button
                  key={letter}
                  onClick={() => onPressKey({ key: letter })} // sending the key press as the event so that same function can be reused
                >
                  {letter === "Enter"
                    ? "ENTER"
                    : letter === "Backspace"
                    ? "DEL"
                    : letter}
                </button>
              );
            })}
          </div>
        );
      })}
    </section>
  );
};

const LetterBox = ({ letters = [] }) => {
  return (
    <section
      className="grid-section"
      style={{
        "--rows": ROWS,
        "--cols": COLS,
      }}
    >
      {letters.map((lettersRow, rowIndex) => {
        return lettersRow.map((item, colIndex) => {
          return (
            <div
              className={classNames(
                "grid-item",
                !!item.letter && "grid-item--filled",
                item.state !== STATES.INDETERMINATE && "grid-item--final"
              )}
              style={{
                ...(item.state !== STATES.INDETERMINATE && {
                  "--fill-color": STATE_COLORS[item.state],
                  transitionDelay: `${colIndex * 50}ms`,
                }),
              }}
              key={`${rowIndex}-${colIndex}`}
            >
              {item.letter}
            </div>
          );
        });
      })}
    </section>
  );
};

function App() {
  const todayWord = useRef(WORDS[Math.floor(Math.random() * WORDS.length)]); // word of the day
  const contentRef = useRef(); // ref to focus the content on mount so that keyboard events can be read
  const gridState = useRef(
    Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({
        letter: "", // letter to display in each grid tile
        state: STATES.INDETERMINATE, // the state of the letter
      }))
    )
  ); // using useRef as we won't have to create a new state for the grid state because we are already updating position
  const [position, setPosition] = useState([0, -1]); // current position in the grid
  const [hasGuessed, setHasGuessed] = useState(null); // state to handle final correct/incorrect state. null means the final state is not yet decided
  const currentRow = position[0];

  const onPressKey = (e) => {
    if (hasGuessed !== null) return; // final state has been decided so return

    // check for valid key press
    if (isValidKey(e.key)) {
      const [row, col] = position;
      const letters = gridState.current;

      if (e.key === "Enter") {
        if (col + 1 === COLS) {
          if (document.activeElement) document.activeElement.blur(); // unfocusing the active element to avoid inputs while checking word
          const word = letters[row].map((item) => item.letter).join("");
          const wordMap = getWordMap(todayWord.current); // creating a map of count of letters in original word to compare with the word entered by user
          let matchCount = 0;

          for (let i = 0; i < word.length; ++i) {
            let letterState;
            const currentChar = word[i],
              currentActualChar = todayWord.current[i];

            if (currentChar === currentActualChar) {
              letterState = STATES.CORRECT;
              ++matchCount;
            } else if (
              wordMap.has(currentChar) &&
              wordMap.get(currentChar) > 0
            ) {
              letterState = STATES.INCORRECT;
              wordMap.set(currentChar, wordMap.get(currentChar) - 1);
            } else {
              letterState = STATES.INVALID;
            }
            letters[row][i].state = letterState;
          }
          setPosition([row + 1, -1]); // moving on to next row

          if (matchCount === COLS) {
            setHasGuessed(true); // showing answer if word is guessed
          } else if (row + 1 === ROWS) {
            setHasGuessed(false); // showing answer if all the rows are full
          }
        }
      } else if (e.key === "Backspace") {
        if (col === -1) return;
        letters[row][col].letter = "";
        setPosition([row, col - 1]);
      } else {
        if (col + 1 === COLS) return;
        letters[row][col + 1].letter = e.key.toUpperCase();
        setPosition([row, col + 1]);
      }
    }
  };

  useEffect(() => {
    contentRef.current.focus(); // focusing the main element so that element can read key press events
  }, [currentRow]);

  return (
    <main onKeyDown={onPressKey} tabIndex={-1} ref={contentRef}>
      <header className="header">
        Wordle
        {hasGuessed !== null && (
          <div className="word-container">{todayWord.current}</div>
        )}
      </header>
      <LetterBox letters={gridState.current} />
      <Keyboard onPressKey={onPressKey} />
    </main>
  );
}

export default App;
