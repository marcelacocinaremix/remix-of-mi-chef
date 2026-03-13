import { useState, useRef, useCallback, useEffect } from "react";
import { Clock, Pause, Play, X } from "lucide-react";
import { useKitchenTimer } from "@/hooks/useKitchenTimer";

interface FloatingTimerProps {
  activeTab: string;
  onNavigateToTimer: () => void;
}

export function FloatingTimer({ activeTab, onNavigateToTimer }: FloatingTimerProps) {
  const { remainingSeconds, isRunning, isFinished, startPause, reset } = useKitchenTimer();
  const [visible, setVisible] = useState(true);
  const elRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const wasDragged = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const elStart = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  // Direct DOM manipulation for smooth dragging
  const updatePosition = useCallback((x: number, y: number) => {
    if (elRef.current) {
      elRef.current.style.left = `${x}px`;
      elRef.current.style.top = `${y}px`;
      elRef.current.style.right = "auto";
      elRef.current.style.bottom = "auto";
    }
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    wasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    const rect = elRef.current?.getBoundingClientRect();
    if (rect) {
      elStart.current = { x: rect.left, y: rect.top };
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    wasDragged.current = true;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const newX = Math.max(0, Math.min(window.innerWidth - 160, elStart.current.x + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 50, elStart.current.y + dy));
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => updatePosition(newX, newY));
  }, [updatePosition]);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleClick = useCallback(() => {
    if (!wasDragged.current) onNavigateToTimer();
  }, [onNavigateToTimer]);

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

  return (
    <div
      ref={elRef}
      className="fixed z-[55]"
      style={{ bottom: "140px", right: "16px", touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg cursor-grab active:cursor-grabbing select-none transition-colors ${getTimerColor()} text-white`}
        onClick={handleClick}
      >
        <Clock className={`w-4 h-4 ${isFinished ? "animate-bounce" : isRunning ? "animate-pulse" : ""}`} />
        <span className="font-mono font-bold text-sm">{formatTime(remainingSeconds)}</span>
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
