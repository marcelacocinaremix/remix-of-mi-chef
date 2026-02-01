import { useEffect, useRef } from "react";

export function FuturisticBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      pulse: number;
    }

    // Create particles
    const createParticles = () => {
      particles = [];
      const numParticles = Math.floor((canvas.width * canvas.height) / 25000);
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.3 + 0.1,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    };

    createParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      // Draw subtle grid lines
      ctx.strokeStyle = "rgba(59, 130, 246, 0.03)";
      ctx.lineWidth = 1;
      const gridSize = 80;
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw and update particles
      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.pulse += 0.02;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        const pulseOpacity = particle.opacity * (0.5 + Math.sin(particle.pulse) * 0.5);
        
        // Draw particle glow
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 4
        );
        gradient.addColorStop(0, `rgba(59, 130, 246, ${pulseOpacity})`);
        gradient.addColorStop(0.5, `rgba(6, 182, 212, ${pulseOpacity * 0.5})`);
        gradient.addColorStop(1, "rgba(59, 130, 246, 0)");

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw particle core
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${pulseOpacity * 1.5})`;
        ctx.fill();
      });

      // Draw subtle flowing lines
      ctx.strokeStyle = "rgba(59, 130, 246, 0.02)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const yOffset = canvas.height * (0.3 + i * 0.2);
        ctx.moveTo(0, yOffset + Math.sin(time + i) * 50);
        for (let x = 0; x < canvas.width; x += 20) {
          ctx.lineTo(x, yOffset + Math.sin(time + x * 0.01 + i) * 50);
        }
        ctx.stroke();
      }

      // Draw corner accents
      const accentSize = 150;
      
      // Top-left accent
      const topLeftGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, accentSize);
      topLeftGradient.addColorStop(0, `rgba(59, 130, 246, ${0.08 + Math.sin(time) * 0.02})`);
      topLeftGradient.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = topLeftGradient;
      ctx.fillRect(0, 0, accentSize, accentSize);

      // Bottom-right accent
      const bottomRightGradient = ctx.createRadialGradient(
        canvas.width, canvas.height, 0,
        canvas.width, canvas.height, accentSize
      );
      bottomRightGradient.addColorStop(0, `rgba(6, 182, 212, ${0.06 + Math.sin(time + 1) * 0.02})`);
      bottomRightGradient.addColorStop(1, "rgba(6, 182, 212, 0)");
      ctx.fillStyle = bottomRightGradient;
      ctx.fillRect(canvas.width - accentSize, canvas.height - accentSize, accentSize, accentSize);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
