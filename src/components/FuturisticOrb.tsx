import { useEffect, useRef } from "react";

interface FuturisticOrbProps {
  size?: number;
  isActive?: boolean;
  isThinking?: boolean;
  className?: string;
}

export function FuturisticOrb({ 
  size = 80, 
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
    const radius = size / 2.3;

    // Blue-themed Siri-style blobs
    const blobs = [
      { 
        color: "rgba(0, 120, 255, 0.85)", 
        x: 0, y: 0, 
        angle: 0, 
        speed: 0.025, 
        orbitRadius: radius * 0.28,
        size: radius * 0.7
      },
      { 
        color: "rgba(80, 180, 255, 0.8)", 
        x: 0, y: 0, 
        angle: Math.PI * 0.66, 
        speed: 0.02, 
        orbitRadius: radius * 0.32,
        size: radius * 0.6
      },
      { 
        color: "rgba(0, 200, 255, 0.75)", 
        x: 0, y: 0, 
        angle: Math.PI * 1.33, 
        speed: 0.03, 
        orbitRadius: radius * 0.25,
        size: radius * 0.55
      },
      { 
        color: "rgba(100, 150, 255, 0.7)", 
        x: 0, y: 0, 
        angle: Math.PI * 0.5, 
        speed: 0.022, 
        orbitRadius: radius * 0.2,
        size: radius * 0.5
      },
    ];

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, size, size);

      // Create clipping circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      // Dark blue background
      const bgGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      );
      bgGradient.addColorStop(0, "rgba(15, 25, 50, 0.95)");
      bgGradient.addColorStop(1, "rgba(5, 10, 30, 1)");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, size, size);

      // Speed based on state - Siri-like responsiveness
      const speedMultiplier = isThinking ? 3 : isActive ? 2 : 1;
      const sizeMultiplier = isThinking ? 1.15 : isActive ? 1.08 : 1;

      // Draw flowing blobs
      blobs.forEach((blob, index) => {
        blob.angle += blob.speed * speedMultiplier;
        
        // Smooth organic Siri-like movement
        const wobbleX = Math.sin(time * 0.004 + index * 2.1) * (radius * 0.15);
        const wobbleY = Math.cos(time * 0.005 + index * 1.7) * (radius * 0.15);
        
        blob.x = centerX + Math.cos(blob.angle) * blob.orbitRadius + wobbleX;
        blob.y = centerY + Math.sin(blob.angle * 1.2) * blob.orbitRadius + wobbleY;

        // Pulsing size
        const pulseSize = blob.size * sizeMultiplier * (1 + Math.sin(time * 0.006 + index * 1.5) * 0.2);

        // Soft gradient blob
        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, pulseSize
        );
        gradient.addColorStop(0, blob.color.replace(/[\d.]+\)$/, "1)"));
        gradient.addColorStop(0.4, blob.color);
        gradient.addColorStop(1, blob.color.replace(/[\d.]+\)$/, "0)"));

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Bright white-blue core
      const corePulse = 1 + Math.sin(time * 0.01) * 0.25;
      const coreSize = radius * 0.35 * corePulse * sizeMultiplier;
      const coreGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, coreSize
      );
      coreGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      coreGradient.addColorStop(0.25, "rgba(220, 240, 255, 0.9)");
      coreGradient.addColorStop(0.6, "rgba(100, 200, 255, 0.5)");
      coreGradient.addColorStop(1, "rgba(50, 150, 255, 0)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      ctx.restore();

      // Outer glow
      const glowIntensity = isActive ? 0.4 : 0.25;
      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.85,
        centerX, centerY, radius * 1.4
      );
      glowGradient.addColorStop(0, `rgba(50, 150, 255, ${glowIntensity})`);
      glowGradient.addColorStop(0.5, `rgba(50, 150, 255, ${glowIntensity * 0.4})`);
      glowGradient.addColorStop(1, "rgba(50, 150, 255, 0)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Subtle border
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(100, 180, 255, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top highlight
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        centerX - radius * 0.15, 
        centerY - radius * 0.35, 
        radius * 0.3, 
        radius * 0.12, 
        -0.2, 
        0, 
        Math.PI * 2
      );
      const hlGradient = ctx.createRadialGradient(
        centerX - radius * 0.15, centerY - radius * 0.35, 0,
        centerX - radius * 0.15, centerY - radius * 0.35, radius * 0.3
      );
      hlGradient.addColorStop(0, "rgba(255, 255, 255, 0.5)");
      hlGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = hlGradient;
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
          filter: isActive ? "brightness(1.15) saturate(1.1)" : "brightness(1)"
        }}
        className="transition-all duration-300"
      />
      {/* Ambient glow */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(50, 150, 255, ${isActive ? 0.35 : 0.2}) 0%, transparent 70%)`,
          transform: "scale(1.6)",
          filter: "blur(12px)"
        }}
      />
    </div>
  );
}
