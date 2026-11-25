import type { Caption } from "@remotion/captions";
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { fontFamily } from "./font";
import { SUBTITLE_TOP } from "./Gallery";
import { SAFE_LEFT, SAFE_RIGHT } from "./layouts";

type Props = {
  /** Word timings relative to the voice clip's start. */
  readonly words: Caption[];
  /** Frame within the scene the voice clip starts at. */
  readonly offsetFrames: number;
  readonly accent: string;
};

type Page = {
  readonly startMs: number;
  readonly endMs: number;
  readonly words: Caption[];
};

/**
 * About two lines at 46px in the 860px subtitle box. Anything longer would
 * push a third line off the foot of the frame.
 */
const MAX_CHARS_PER_PAGE = 54;

/** Keeps a finished line on screen briefly so it can be read to the end. */
const HOLD_MS = 350;

const ENDS_CLAUSE = /[,.?!;:]$/;

const charCount = (words: Caption[]) =>
  words.reduce((sum, word) => sum + word.text.length, 0);

/**
 * Splits narration into subtitle pages by clause, then by length.
 *
 * Vietnamese marks every syllable as a separate word, so splitting on timing
 * alone (as createTikTokStyleCaptions does) cuts names like "Hội | An" and
 * puts no ceiling on the number of lines. Here a clause stays whole when it
 * fits in two lines; a longer one is cut into evenly sized pages.
 */
const paginate = (words: Caption[]): Page[] => {
  const clauses: Caption[][] = [];
  let clause: Caption[] = [];
  for (const word of words) {
    clause.push(word);
    if (ENDS_CLAUSE.test(word.text)) {
      clauses.push(clause);
      clause = [];
    }
  }
  if (clause.length > 0) {
    clauses.push(clause);
  }

  const chunks: Caption[][] = [];
  for (const group of clauses) {
    const target = charCount(group) / Math.ceil(charCount(group) / MAX_CHARS_PER_PAGE);
    let chunk: Caption[] = [];
    let size = 0;
    group.forEach((word, index) => {
      chunk.push(word);
      size += word.text.length;
      if (size >= target && index < group.length - 1) {
        chunks.push(chunk);
        chunk = [];
        size = 0;
      }
    });
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks.map((chunk, index) => {
    const next = chunks[index + 1];
    return {
      startMs: chunk[0].startMs,
      endMs: next ? next[0].startMs : chunk[chunk.length - 1].endMs + HOLD_MS,
      words: chunk,
    };
  });
};

/**
 * Burned-in subtitles for the scene's voice-over, with the current word
 * highlighted. Sits in a band at the foot of the frame, below the scene's
 * text block, so the two never overlap.
 */
export const Subtitles: React.FC<Props> = ({ words, offsetFrames, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pages = useMemo(() => paginate(words), [words]);
  const ms = ((frame - offsetFrames) / fps) * 1000;
  const page = pages.find(
    (candidate) => ms >= candidate.startMs && ms < candidate.endMs,
  );
  if (!page) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: SUBTITLE_TOP,
        left: SAFE_LEFT,
        right: SAFE_RIGHT,
        textAlign: "center",
        lineHeight: 1.5,
        // Two even lines rather than a long one and an orphaned word.
        textWrap: "balance",
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: 46,
          fontWeight: 800,
          padding: "6px 22px 10px",
          borderRadius: 16,
          backgroundColor: "rgba(4,16,26,0.62)",
          boxDecorationBreak: "clone",
          WebkitBoxDecorationBreak: "clone",
        }}
      >
        {page.words.map((word, index) => {
          const spoken = ms >= word.startMs;
          const active = spoken && ms < word.endMs;
          return (
            <span
              key={`${word.startMs}-${word.text}`}
              style={{
                color: active
                  ? accent
                  : spoken
                    ? "#ffffff"
                    : "rgba(255,255,255,0.6)",
              }}
            >
              {index === 0 ? word.text.trimStart() : word.text}
            </span>
          );
        })}
      </span>
    </div>
  );
};
