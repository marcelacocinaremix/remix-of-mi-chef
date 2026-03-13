import { useState, useRef, useCallback, useEffect } from "react";
import { Timer, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { MiniKitchenTimer } from "@/components/MiniKitchenTimer";

export function FloatingTimerButton() {
  const { t } = useLanguage();
  const [showTimer, setShowTimer] = useState(false);

  // Draggable panel state
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  // Initialize panel position centered above the button
  useEffect(() => {
    if (showTimer && !initialized) {
      const panelWidth = 200;
      const panelHeight = 420;
      const x = window.innerWidth - panelWidth - 8;
      const y = window.innerHeight - panelHeight - 140;
      setPanelPos({ x: Math.max(0, x), y: Math.max(0, y) });
      setInitialized(true);
    }
    if (!showTimer) setInitialized(false);
  }, [showTimer, initialized]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    posStart.current = { ...panelPos };
  }, [panelPos]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;
    const newX = Math.max(0, Math.min(window.innerWidth - 200, posStart.current.x + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 100, posStart.current.y + dy));
    setPanelPos({ x: newX, y: newY });
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Mouse drag support
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...panelPos };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = ev.clientX - dragStart.current.x;
      const dy = ev.clientY - dragStart.current.y;
      const newX = Math.max(0, Math.min(window.innerWidth - 200, posStart.current.x + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, posStart.current.y + dy));
      setPanelPos({ x: newX, y: newY });
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [panelPos]);

  return (
    <>
      <div className="fixed z-50" style={{ bottom: "148px", right: "16px" }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowTimer(!showTimer)}
          className="rounded-full bg-card/90 backdrop-blur-sm border border-border/50 hover:bg-card shadow-lg hover:scale-105 transition-transform h-11 w-11"
          aria-label={t("kitchenTimer")}
        >
          <Timer className="h-5 w-5 text-primary" />
        </Button>
      </div>

      {showTimer && (
        <div
          ref={dragRef}
          className="fixed z-[60] w-[200px] bg-card/95 backdrop-blur-md border border-border/60 rounded-2xl shadow-2xl"
          style={{
            left: `${panelPos.x}px`,
            top: `${panelPos.y}px`,
            touchAction: "none",
          }}
        >
          {/* Drag handle + close */}
          <div
            className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing border-b border-border/30"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <GripVertical className="w-3.5 h-3.5" />
              <Timer className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium">{t("kitchenTimer")}</span>
            </div>
            <button
              onClick={() => setShowTimer(false)}
              className="p-1 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Timer content - compact */}
          <div className="p-3 max-h-[70vh] overflow-y-auto">
            <MiniKitchenTimer />
          </div>
        </div>
      )}
    </>
  );
}
