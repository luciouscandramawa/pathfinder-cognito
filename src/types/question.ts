export type Question = {
  id: string;
  question: string;
  type: "mcq" | "text" | "audio";
  difficulty: number;
  block: "career" | "academic";
  options: string[] | null;
};
