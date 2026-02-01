export type Tool = "pen" | "eraser";

export type LineData = {
  id: string;
  tool: Tool;
  points: number[];
  color: string;
  strokeWidth: number;
};

// Socket event types for type safety
export interface ServerToClientEvents {
  "canvas-state": (lines: LineData[]) => void;
  "user-count": (count: number) => void;
  "draw-start": (line: LineData) => void;
  "draw-move": (data: { lineIndex: number; points: number[] }) => void;
  "canvas-cleared": () => void;
}

export interface ClientToServerEvents {
  "join-room": (roomId: string) => void;
  "draw-start": (data: { roomId: string; line: LineData }) => void;
  "draw-move": (data: { roomId: string; lineIndex: number; points: number[] }) => void;
  "clear-canvas": (roomId: string) => void;
}
