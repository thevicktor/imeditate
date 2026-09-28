export const C = {
  navy: "#0F1E3D",
  navy2: "#16294f",
  emblem: "#16264A",
  line: "#2c4478",
  input: "#0b1730",
  red: "#B3202A",
  amber: "#D9772E",
  gold: "#F4B942",
  parchment: "#F7F4EC",
  dusk: "#8FA6C9",
  green: "#1E7D5C",
  ink: "#101828",
};

export const AGE_GROUPS = ["4-7", "8-11", "12-17"] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];
export type Stage = "ponder" | "mutter" | "roar" | "done";

export interface Child {
  id: string;
  nickname: string;
  age_group: AgeGroup;
  soldier_rank: string;
}

export interface Scripture {
  id: string;
  ref: string;
  text: string;
  phrases: string[];
  questions: Record<AgeGroup, string[]>;
  audio_url: string | null;
}
