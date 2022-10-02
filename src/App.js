import { useCallback, useState, useRef, useMemo } from "react";
import "./App.css";
import { prompts } from "./prompts";

const TOTAL_SEQUENCE_LENGTH = 51;
const START_INDEX = 10;
const TIME_STEPS = TOTAL_SEQUENCE_LENGTH - START_INDEX;

const availablePrompts = [0, 1, 2, 3, 4, 5, 50, 51, 100];

function useForceUpdate() {
  const update = useState(0)[1];
  return () => update((x) => x + 1);
}

const tried = new Set();

const intervalAtBeginning = 1500;
const intervalAtEnd = 875;

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

function App() {
  const [seqId, setSeqId_] = useState(null);
  const [idx, setIdx] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const forceTimerUpdate = useForceUpdate();
  const timerId = useRef(-1);

  const [seqIds, choices] = useMemo(() => {
    let seqIds = [];
    let choices_ = [prompts[seqId]];
    let combo = [[seqId, prompts[seqId]]];

    while (choices_.length < 5) {
      const sid = Math.floor(Math.random() * prompts.length);
      const choice = prompts[sid];
      if (!choices_.includes(choice)) {
        choices_.push(choice);
        combo.push([sid, choice]);
      }
    }

    shuffle(combo);

    seqIds = [];
    choices_ = [];

    for (let i = 0; i < combo.length; i++) {
      seqIds.push(combo[i][0]);
      choices_.push(combo[i][1]);
    }

    return [seqIds, choices_];
  }, [seqId]);

  const setSeqId = useCallback((seqId) => {
    setStartTime(null);
    setEndTime(null);
    setIdx(START_INDEX);
    setSeqId_(seqId);
  }, []);

  const start = useCallback(() => {
    if (tried.length === availablePrompts.length) {
      tried.clear();
    }
    let idx = Math.floor(Math.random() * availablePrompts.length);
    while (tried.has(availablePrompts[idx])) {
      idx = Math.floor(Math.random() * availablePrompts.length);
    }
    setSeqId(availablePrompts[idx]);

    function addTimeout(delay) {
      clearTimeout(timerId.current);
      timerId.current = setTimeout(() => {
        setIdx((idx) => {
          forceTimerUpdate();
          if (idx + 1 === TOTAL_SEQUENCE_LENGTH) {
            clearTimeout(timerId.current);
            return idx + 1;
          }
          addTimeout(((idx - START_INDEX + 1) / TIME_STEPS) * (intervalAtEnd - intervalAtBeginning) + intervalAtBeginning);
          return idx + 1;
        });
      }, delay);
    }

    addTimeout(intervalAtBeginning)

    setStartTime(Date.now());
  }, [forceTimerUpdate, setSeqId]);

  const end = useCallback(() => {
    clearTimeout(timerId.current);
    setEndTime(Date.now());
  }, []);

  const [guess, setGuess] = useState("");

  const started = startTime > 0;
  const ended = started && endTime !== null;
  const timeSinceBegin = started
    ? Math.round(((endTime || Date.now()) - startTime) / 1000)
    : -1;

  const stepsRemaining = TIME_STEPS - (idx - START_INDEX);

  return (
    <div className="App">
      <header className="App-header">
        <h1 style={{ marginBottom: 0 }}>💣 Defusion</h1>
        <a href="http://nn.labml.ai/diffusion/index.html">
          Learn about diffusion models
        </a>
        <h3>Guess the image before the bomb detonates!</h3>
        <div
          style={{ display: "flex", flexDirection: "column", width: "512px" }}
        >
          {started && (
            <>
              <div
                style={{
                  height: "10px",
                  width: "100%",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    backgroundColor: "red",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    right: `${(1 - stepsRemaining / TIME_STEPS) * 100}%`,
                    transition: "right 1.0s linear",
                  }}
                ></div>
              </div>
            </>
          )}
          {stepsRemaining === 0 ? (
            <b>Bomb detonated!</b>
          ) : (
            <b style={{ fontSize: "16px", margin: "10px" }}>
              {!started
                ? "Waiting to begin"
                : endTime !== null
                ? `Final time: ${timeSinceBegin}s`
                : `Elapsed time: ${timeSinceBegin}s`}
            </b>
          )}
          {seqId !== null ? (
            <img
              src={`/images/${seqId}/image_${Math.min(
                idx,
                TOTAL_SEQUENCE_LENGTH
              )}.png`}
              alt=""
              style={{
                width: "512px",
                borderRadius: "10px",
                marginBottom: "10px",
              }}
            />
          ) : (
            <div
              style={{
                width: "512px",
                height: "512px",
                borderRadius: "10px",
                marginBottom: "10px",
                backgroundColor: "lightgrey",
              }}
            ></div>
          )}
          {started && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    end();
                    setGuess(seqIds[idx]);
                  }}
                >
                  {choice}
                </button>
              ))}
            </div>
          )}
          <div style={{ marginTop: "10px", marginBottom: "10px" }}>
            {started ? (
              (!ended && (stepsRemaining > 0)) ? (
                <button onClick={end}>Submit</button>
              ) : (
                <>
                  <span
                    style={{
                      fontSize: "16px",
                      textAlign: "left",
                      lineHeight: "normal",
                    }}
                  >
                    {guess === seqId ? (
                      "Correct!"
                    ) : (
                      <>
                        The correct answer was{" "}
                        <b>{prompts[seqId].toLowerCase()}</b>
                      </>
                    )}
                  </span>
                  <br />
                  <br />
                  <button onClick={start}>Restart</button>
                </>
              )
            ) : (
              <button onClick={start}>Start</button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
