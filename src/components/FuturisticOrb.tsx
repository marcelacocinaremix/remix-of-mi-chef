import { useEffect, useRef } from "react";

interface FuturisticOrbProps {
  size?: number;
  isActive?: boolean;
  isThinking?: boolean;
  className?: string;
}

export function FuturisticOrb({ 
  size = 120, 
  isActive = false,
  isThinking = false,
  className = "" 
}: FuturisticOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2.5;

    // Blob parameters
    const blobs = [
      { 
        color: "rgba(0, 150, 255, 0.8)", 
        x: 0, y: 0, 
        angle: 0, 
        speed: 0.02, 
        orbitRadius: radius * 0.3,
        size: radius * 0.6
      },
      { 
        color: "rgba(255, 50, 100, 0.7)", 
        x: 0, y: 0, 
        angle: Math.PI * 0.7, 
        speed: 0.015, 
        orbitRadius: radius * 0.35,
        size: radius * 0.55
      },
      { 
        color: "rgba(0, 230, 200, 0.75)", 
        x: 0, y: 0, 
        angle: Math.PI * 1.4, 
        speed: 0.025, 
        orbitRadius: radius * 0.25,
        size: radius * 0.5
      },
      { 
        color: "rgba(150, 50, 255, 0.6)", 
        x: 0, y: 0, 
        angle: Math.PI * 0.3, 
        speed: 0.018, 
        orbitRadius: radius * 0.32,
        size: radius * 0.45
      },
    ];

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, size, size);

      // Create clipping circle for the orb
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      // Dark background for orb interior
      const bgGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      );
      bgGradient.addColorStop(0, "rgba(20, 30, 60, 0.9)");
      bgGradient.addColorStop(1, "rgba(10, 15, 35, 1)");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, size, size);

      // Speed multiplier based on state
      const speedMultiplier = isThinking ? 2.5 : isActive ? 1.5 : 1;

      // Update and draw blobs
      blobs.forEach((blob, index) => {
        blob.angle += blob.speed * speedMultiplier;
        
        // Add some organic movement
        const wobbleX = Math.sin(time * 0.003 + index) * 5;
        const wobbleY = Math.cos(time * 0.004 + index * 1.5) * 5;
        
        blob.x = centerX + Math.cos(blob.angle) * blob.orbitRadius + wobbleX;
        blob.y = centerY + Math.sin(blob.angle) * blob.orbitRadius + wobbleY;

        // Dynamic size pulsing
        const pulseSize = blob.size * (1 + Math.sin(time * 0.005 + index) * 0.15);

        // Draw blob with gradient
        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, pulseSize
        );
        gradient.addColorStop(0, blob.color.replace(/[\d.]+\)$/, "0.9)"));
        gradient.addColorStop(0.5, blob.color);
        gradient.addColorStop(1, blob.color.replace(/[\d.]+\)$/, "0)"));

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Central bright core
      const coreSize = radius * 0.3 * (1 + Math.sin(time * 0.008) * 0.2);
      const coreGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, coreSize
      );
      coreGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      coreGradient.addColorStop(0.3, "rgba(200, 230, 255, 0.8)");
      coreGradient.addColorStop(0.7, "rgba(100, 180, 255, 0.4)");
      coreGradient.addColorStop(1, "rgba(50, 100, 255, 0)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      ctx.restore();

      // Draw outer glow
      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.9,
        centerX, centerY, radius * 1.3
      );
      glowGradient.addColorStop(0, "rgba(100, 150, 255, 0.3)");
      glowGradient.addColorStop(0.5, "rgba(100, 150, 255, 0.1)");
      glowGradient.addColorStop(1, "rgba(100, 150, 255, 0)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Draw sphere outline with subtle gradient
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(150, 200, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add highlight reflection on top
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        centerX - radius * 0.2, 
        centerY - radius * 0.4, 
        radius * 0.35, 
        radius * 0.15, 
        -0.3, 
        0, 
        Math.PI * 2
      );
      const highlightGradient = ctx.createRadialGradient(
        centerX - radius * 0.2, centerY - radius * 0.4, 0,
        centerX - radius * 0.2, centerY - radius * 0.4, radius * 0.35
      );
      highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
      highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = highlightGradient;
      ctx.fill();
      ctx.restore();

      time++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [size, isActive, isThinking]);

  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ 
          width: size, 
          height: size,
          filter: isActive ? "brightness(1.2)" : "brightness(1)"
        }}
        className="transition-all duration-300"
      />
      {/* Ambient glow effect */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(100, 150, 255, ${isActive ? 0.3 : 0.15}) 0%, transparent 70%)`,
          transform: "scale(1.5)",
          filter: "blur(10px)"
        }}
      />
    </div>
  );
}
