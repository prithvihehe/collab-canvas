import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Stage, Layer, Line } from "react-konva";
import {
  Pencil,
  Eraser,
  Trash2,
  Users,
  Copy,
  Check,
  Minus,
  Plus,
  Hand,
} from "lucide-react";
import { socket } from "../lib/socket";
import type { Tool, LineData } from "../types/socket";

type ToolType = Tool | "pan";

export default function Room() {
  const { id: roomId } = useParams<{ id: string }>();
  const [tool, setTool] = useState<ToolType>("pen");
  const [color, setColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [lines, setLines] = useState<LineData[]>([]);
  const [userCount, setUserCount] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const isDrawing = useRef(false);
  const currentLineIndex = useRef<number | null>(null);

  // Preset colors (Excalidraw-like palette)
  const presetColors = [
    "#ffffff", // white
    "#ff6b6b", // red
    "#ffa94d", // orange
    "#ffd43b", // yellow
    "#69db7c", // green
    "#4dabf7", // blue
    "#9775fa", // purple
    "#f783ac", // pink
  ];

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Socket connection and event handlers
  useEffect(() => {
    if (!roomId) return;

    // Connection event handlers
    const onConnect = () => {
      console.log("Socket connected!");
      setIsConnected(true);
      setConnectionError(null);
      socket.emit("join-room", roomId);
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    };

    const onConnectError = (error: Error) => {
      console.error("Socket connection error:", error);
      setConnectionError(error.message);
      setIsConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    socket.on("canvas-state", (serverLines) => {
      setLines(serverLines);
    });

    socket.on("user-count", (count) => {
      setUserCount(count);
    });

    socket.on("draw-start", (line) => {
      setLines((prev) => [...prev, line]);
    });

    socket.on("draw-move", ({ lineIndex, points }) => {
      setLines((prev) => {
        const updated = [...prev];
        if (updated[lineIndex]) {
          updated[lineIndex] = { ...updated[lineIndex], points };
        }
        return updated;
      });
    });

    socket.on("canvas-cleared", () => {
      setLines([]);
    });

    // Connect the socket
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("canvas-state");
      socket.off("user-count");
      socket.off("draw-start");
      socket.off("draw-move");
      socket.off("canvas-cleared");
      socket.disconnect();
    };
  }, [roomId]);

  const handleMouseDown = useCallback(
    (e: any) => {
      if (!roomId || tool === "pan") return;
      isDrawing.current = true;
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;

      const newLine: LineData = {
        id: crypto.randomUUID(),
        tool: tool === "eraser" ? "eraser" : "pen",
        points: [pos.x, pos.y],
        color: tool === "eraser" ? "#121212" : color,
        strokeWidth: tool === "eraser" ? 30 : strokeWidth,
      };

      setLines((prev) => {
        currentLineIndex.current = prev.length;
        return [...prev, newLine];
      });

      socket.emit("draw-start", { roomId, line: newLine });
    },
    [roomId, tool, color, strokeWidth]
  );

  const handleMouseMove = useCallback(
    (e: any) => {
      if (!isDrawing.current || !roomId || currentLineIndex.current === null)
        return;

      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      if (!point) return;

      setLines((prev) => {
        const lineIndex = currentLineIndex.current!;
        const lastLine = prev[lineIndex];
        if (!lastLine) return prev;

        const newPoints = [...lastLine.points, point.x, point.y];
        const updated = [...prev];
        updated[lineIndex] = { ...lastLine, points: newPoints };

        socket.emit("draw-move", { roomId, lineIndex, points: newPoints });

        return updated;
      });
    },
    [roomId]
  );

  const handleMouseUp = useCallback(() => {
    isDrawing.current = false;
    currentLineIndex.current = null;
  }, []);

  const handleClearCanvas = useCallback(() => {
    if (!roomId) return;
    socket.emit("clear-canvas", roomId);
  }, [roomId]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  }, []);

  const getCursor = () => {
    if (tool === "pan") return "grab";
    if (tool === "eraser") return "crosshair";
    return "crosshair";
  };

  return (
    <div className="h-screen w-screen bg-[#121212] overflow-hidden relative">
      {/* Main Toolbar - Excalidraw style centered */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-1 bg-[#232329] px-2 py-2 rounded-xl shadow-2xl border border-[#3d3d45]">
          {/* Hand/Pan Tool */}
          <button
            onClick={() => setTool("pan")}
            className={`p-3 rounded-lg transition-all ${
              tool === "pan"
                ? "bg-[#4f46e5] text-white"
                : "text-[#a1a1aa] hover:bg-[#2d2d35] hover:text-white"
            }`}
            title="Pan (H)"
          >
            <Hand size={18} />
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-[#3d3d45] mx-1" />

          {/* Pen Tool */}
          <button
            onClick={() => setTool("pen")}
            className={`p-3 rounded-lg transition-all ${
              tool === "pen"
                ? "bg-[#4f46e5] text-white"
                : "text-[#a1a1aa] hover:bg-[#2d2d35] hover:text-white"
            }`}
            title="Pen (P)"
          >
            <Pencil size={18} />
          </button>

          {/* Eraser Tool */}
          <button
            onClick={() => setTool("eraser")}
            className={`p-3 rounded-lg transition-all ${
              tool === "eraser"
                ? "bg-[#4f46e5] text-white"
                : "text-[#a1a1aa] hover:bg-[#2d2d35] hover:text-white"
            }`}
            title="Eraser (E)"
          >
            <Eraser size={18} />
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-[#3d3d45] mx-1" />

          {/* Color Palette */}
          <div className="flex items-center gap-1 px-1">
            {presetColors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-md transition-all border-2 ${
                  color === c
                    ? "border-[#4f46e5] scale-110"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent"
              title="Custom color"
            />
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-[#3d3d45] mx-1" />

          {/* Stroke Width */}
          <div className="flex items-center gap-2 px-2">
            <button
              onClick={() => setStrokeWidth((w) => Math.max(1, w - 1))}
              className="p-1.5 rounded-md text-[#a1a1aa] hover:bg-[#2d2d35] hover:text-white transition-all"
              title="Decrease stroke"
            >
              <Minus size={14} />
            </button>
            <span className="text-[#a1a1aa] text-sm font-mono w-6 text-center">
              {strokeWidth}
            </span>
            <button
              onClick={() => setStrokeWidth((w) => Math.min(20, w + 1))}
              className="p-1.5 rounded-md text-[#a1a1aa] hover:bg-[#2d2d35] hover:text-white transition-all"
              title="Increase stroke"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-[#3d3d45] mx-1" />

          {/* Clear Canvas */}
          <button
            onClick={handleClearCanvas}
            className="p-3 rounded-lg text-[#ef4444] hover:bg-[#2d2d35] transition-all"
            title="Clear canvas"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Top Right - Share & Users */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-20">
        {/* Share Link Button */}
        <button
          onClick={handleCopyLink}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-lg ${
            copied
              ? "bg-[#22c55e] text-white"
              : "bg-[#4f46e5] text-white hover:bg-[#4338ca]"
          }`}
          title="Copy room link"
        >
          {copied ? (
            <>
              <Check size={16} />
              <span className="text-sm font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span className="text-sm font-medium">Share</span>
            </>
          )}
        </button>

        {/* User Count & Connection Status */}
        <div className="flex items-center gap-2 bg-[#232329] px-4 py-2.5 rounded-xl shadow-lg border border-[#3d3d45]">
          <div className="flex items-center gap-1">
            <div 
              className={`w-2 h-2 rounded-full ${
                isConnected 
                  ? "bg-[#22c55e] animate-pulse" 
                  : "bg-[#ef4444]"
              }`} 
              title={isConnected ? "Connected" : connectionError || "Disconnected"}
            />
            <Users size={16} className="text-[#a1a1aa]" />
          </div>
          <span className="text-sm font-medium text-[#e4e4e7]">
            {isConnected ? `${userCount} ${userCount === 1 ? "user" : "users"}` : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg">
          <span className="text-sm">Connection failed: {connectionError}</span>
        </div>
      )}

      {/* Room ID indicator - bottom left */}
      <div className="fixed bottom-4 left-4 z-20">
        <div className="flex items-center gap-2 bg-[#232329]/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-[#3d3d45]">
          <span className="text-xs text-[#71717a]">Room:</span>
          <span className="text-xs text-[#a1a1aa] font-mono">
            {roomId?.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* Canvas */}
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        style={{ cursor: getCursor() }}
      >
        <Layer>
          {lines.map((line) => (
            <Line
              key={line.id}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === "eraser" ? "destination-out" : "source-over"
              }
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
