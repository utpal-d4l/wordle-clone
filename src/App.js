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

const getLetterIndex = (letter = "") => letter.toUpperCase().charCodeAt() - 65; // getting char code of letter and substracting code for 'A', so 'A' becomes 0, 'B' becomes 1 and so on

const getInitialGridState = () =>
  Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      letter: "", // letter to display in each grid tile
      state: STATES.INDETERMINATE, // the state of the letter
    }))
  );

const getInitialKeyboardState = () => Array(26).fill(STATES.INDETERMINATE);

const Keyboard = ({ onPressKey = () => {}, keyboardState = [] }) => {
  return (
    <section className="keyboard-section">
      {KEYBOARD_LAYOUT.map((row, rowIndex) => {
        return (
          <div className="keyboard-row" key={rowIndex}>
            {row.map((letter) => {
              const idx = getLetterIndex(letter);
              const showLetterState =
                letter !== "Enter" &&
                letter !== "Backspace" &&
                keyboardState[idx] !== STATES.INDETERMINATE;

              return (
                <button
                  key={letter}
                  onClick={() => onPressKey({ key: letter })} // sending the key press as the event so that same function can be reused
                  style={{
                    ...(showLetterState && {
                      "--background-color": STATE_COLORS[keyboardState[idx]],
                    }),
                  }}
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
  const [gridState, setGridState] = useState(() => getInitialGridState()); // state to store grid lettes and their state
  const [position, setPosition] = useState([0, -1]); // current position in the grid
  const [hasGuessed, setHasGuessed] = useState(null); // state to handle final correct/incorrect state. null means the final state is not yet decided
  const [keyboardState, setKeyboardState] = useState(() =>
    getInitialKeyboardState()
  ); // state to store the keyboard letter states, we will use an array of length 26 to store the states
  const currentRow = position[0];

  const onEnterLetter = (letter = "") => {
    const [row, col] = position;
    const newGridState = Array.from(gridState); // creating a new grid to avoid mutating the existing one

    if (col + 1 === COLS) return;
    newGridState[row][col + 1].letter = letter.toUpperCase();
    setPosition([row, col + 1]);
    setGridState(newGridState);
  };

  const onPressBackspace = () => {
    const [row, col] = position;
    const newGridState = Array.from(gridState);

    if (col === -1) return;
    newGridState[row][col].letter = "";
    setPosition([row, col - 1]);
    setGridState(newGridState);
  };

  const onPressEnter = () => {
    const [row, col] = position;
    const newGridState = Array.from(gridState);
    const newKeyboardState = Array.from(keyboardState);

    if (col + 1 < COLS) return; // not enough letters in the row yet so return
    if (document.activeElement) document.activeElement.blur(); // unfocusing the active element to avoid inputs while checking word

    const word = gridState[row].map((item) => item.letter).join("");
    const wordMap = getWordMap(todayWord.current); // creating a map of count of letters in original word to compare with the word entered by user
    const nonMatchingIndices = [];
    let matchCount = 0;

    // updating state for matching chars first
    for (let i = 0; i < word.length; ++i) {
      const currentChar = word[i],
        currentActualChar = todayWord.current[i];

      if (currentChar === currentActualChar) {
        newGridState[row][i].state = STATES.CORRECT;
        newKeyboardState[getLetterIndex(currentChar)] = STATES.CORRECT;
        wordMap.set(currentChar, wordMap.get(currentChar) - 1);
        ++matchCount;
      } else {
        nonMatchingIndices.push(i);
      }
    }

    // updating state for rest of the chars
    nonMatchingIndices.forEach((idx) => {
      const char = word[idx];
      if (wordMap.has(char) && wordMap.get(char) > 0) {
        wordMap.set(char, wordMap.get(char) - 1);
        newGridState[row][idx].state = STATES.INCORRECT;
        newKeyboardState[getLetterIndex(char)] = STATES.INCORRECT;
      } else {
        newGridState[row][idx].state = STATES.INVALID;
        newKeyboardState[getLetterIndex(char)] = STATES.INVALID;
      }
    });

    setPosition([row + 1, -1]); // moving on to next row
    setGridState(newGridState);
    setKeyboardState(newKeyboardState);

    if (matchCount === COLS) {
      setHasGuessed(true); // showing answer if word is guessed
    } else if (row + 1 === ROWS) {
      setHasGuessed(false); // showing answer if all the rows are full
    }
  };

  const onPressKey = (e) => {
    if (hasGuessed !== null) return; // final state has been decided so return
    if (!isValidKey(e.key)) return; // invalid input from user so return

    if (e.key === "Enter") {
      onPressEnter();
    } else if (e.key === "Backspace") {
      onPressBackspace();
    } else {
      onEnterLetter(e.key);
    }
  };

  const resetGame = () => {
    todayWord.current = WORDS[Math.floor(Math.random() * WORDS.length)];
    setGridState(getInitialGridState());
    setPosition([0, -1]);
    setHasGuessed(null);
    setKeyboardState(getInitialGridState());
  };

  useEffect(() => {
    contentRef.current.focus(); // focusing the main element so that element can read key press events
  }, [currentRow]);

  return (
    <main onKeyDown={onPressKey} tabIndex={-1} ref={contentRef}>
      <header className="header">Wordle</header>
      <LetterBox letters={gridState} />
      <Keyboard onPressKey={onPressKey} keyboardState={keyboardState} />
      {hasGuessed !== null && (
        <div className="word-container">
          {hasGuessed ? "Magnificent 🎉" : todayWord.current}
          <button type="button" className="reset-button" onClick={resetGame}>
            Reset
          </button>
        </div>
      )}
    </main>
  );
}

export default App;
