import { useState, useRef, useCallback } from "react";
import { Clock, Pause, Play, X } from "lucide-react";
import { useKitchenTimer } from "@/hooks/useKitchenTimer";

interface FloatingTimerProps {
  activeTab: string;
  onNavigateToTimer: () => void;
}

export function FloatingTimer({ activeTab, onNavigateToTimer }: FloatingTimerProps) {
  const { remainingSeconds, isRunning, isFinished, startPause, reset } = useKitchenTimer();

  const [pos, setPos] = useState({ x: -1, y: -1 });
  const isDragging = useRef(false);
  const wasDragged = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  // Only show when timer is running/finished AND not on the timer tab
  if (activeTab === "reloj" || (!isRunning && !isFinished)) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (isFinished) return "bg-destructive";
    if (remainingSeconds <= 30) return "bg-amber-500";
    return "bg-primary";
  };

  const defaultStyle = pos.x === -1
    ? { bottom: "140px", right: "16px", position: "fixed" as const }
    : { left: `${pos.x}px`, top: `${pos.y}px`, position: "fixed" as const };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    wasDragged.current = false;
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    if (pos.x === -1) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      posStart.current = { x: rect.left, y: rect.top };
    } else {
      posStart.current = { ...pos };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    wasDragged.current = true;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 160, posStart.current.x + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 50, posStart.current.y + dy)),
    });
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    wasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (pos.x === -1) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      posStart.current = { x: rect.left, y: rect.top };
    } else {
      posStart.current = { ...pos };
    }

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      wasDragged.current = true;
      const dx = ev.clientX - dragStart.current.x;
      const dy = ev.clientY - dragStart.current.y;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 160, posStart.current.x + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 50, posStart.current.y + dy)),
      });
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleClick = () => {
    if (!wasDragged.current) onNavigateToTimer();
  };

  return (
    <div
      className="z-50 animate-in slide-in-from-right fade-in duration-300"
      style={{ ...defaultStyle, touchAction: "none" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg cursor-grab active:cursor-grabbing transition-all ${getTimerColor()} text-white`}
        onClick={handleClick}
      >
        <Clock className={`w-4 h-4 ${isFinished ? "animate-bounce" : isRunning ? "animate-pulse" : ""}`} />
        <span className="font-mono font-bold text-sm">
          {formatTime(remainingSeconds)}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); startPause(); }}
          className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); reset(); }}
          className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      {isFinished && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-ping" />
      )}
    </div>
  );
}
