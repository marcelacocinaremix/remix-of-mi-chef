import { useEffect, useRef } from "react";

export function FuturisticBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    interface CircuitNode {
      x: number;
      y: number;
      connections: number[];
      pulsePhase: number;
      size: number;
    }

    interface DataPulse {
      startNode: number;
      endNode: number;
      progress: number;
      speed: number;
      active: boolean;
    }

    let nodes: CircuitNode[] = [];
    let pulses: DataPulse[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initCircuit();
    };

    const initCircuit = () => {
      nodes = [];
      pulses = [];
      
      // Create a grid of nodes with some randomness
      const gridSpacingX = 80;
      const gridSpacingY = 70;
      const cols = Math.ceil(canvas.width / gridSpacingX) + 2;
      const rows = Math.ceil(canvas.height / gridSpacingY) + 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Add some randomness to positions
          const offsetX = (Math.random() - 0.5) * 40;
          const offsetY = (Math.random() - 0.5) * 30;
          
          // Only add ~75% of nodes for irregular pattern
          if (Math.random() > 0.25) {
            nodes.push({
              x: col * gridSpacingX + offsetX,
              y: row * gridSpacingY + offsetY,
              connections: [],
              pulsePhase: Math.random() * Math.PI * 2,
              size: Math.random() * 2 + 2,
            });
          }
        }
      }

      // Create connections between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Connect nodes within range, with preference for horizontal/vertical
          if (dist < 150 && dist > 30) {
            const angle = Math.abs(Math.atan2(dy, dx));
            // Prefer more horizontal or vertical connections
            if (angle < 0.3 || angle > 1.27 || (angle > 0.7 && angle < 1.0)) {
              if (Math.random() > 0.4) {
                nodes[i].connections.push(j);
                nodes[j].connections.push(i);
              }
            }
          }
        }
      }

      // Initialize data pulses
      for (let i = 0; i < 15; i++) {
        createNewPulse();
      }
    };

    const createNewPulse = () => {
      const nodeWithConnections = nodes.filter(n => n.connections.length > 0);
      if (nodeWithConnections.length === 0) return;
      
      const startIdx = nodes.indexOf(nodeWithConnections[Math.floor(Math.random() * nodeWithConnections.length)]);
      const startNode = nodes[startIdx];
      if (startNode.connections.length === 0) return;
      
      const endIdx = startNode.connections[Math.floor(Math.random() * startNode.connections.length)];
      
      pulses.push({
        startNode: startIdx,
        endNode: endIdx,
        progress: 0,
        speed: 0.002 + Math.random() * 0.004,
        active: true,
      });
    };

    const drawCircuitLine = (x1: number, y1: number, x2: number, y2: number) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      
      // Draw circuit-style lines with right angles
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal first, then vertical
        const midX = x1 + dx * 0.7;
        ctx.lineTo(midX, y1);
        ctx.lineTo(midX, y2);
        ctx.lineTo(x2, y2);
      } else {
        // Vertical first, then horizontal
        const midY = y1 + dy * 0.7;
        ctx.lineTo(x1, midY);
        ctx.lineTo(x2, midY);
        ctx.lineTo(x2, y2);
      }
      
      ctx.stroke();
    };

    const getPointOnCircuitLine = (x1: number, y1: number, x2: number, y2: number, t: number) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        const midX = x1 + dx * 0.7;
        const segment1 = 0.35;
        const segment2 = 0.65;
        
        if (t < segment1) {
          return { x: x1 + (midX - x1) * (t / segment1), y: y1 };
        } else if (t < segment2) {
          return { x: midX, y: y1 + (y2 - y1) * ((t - segment1) / (segment2 - segment1)) };
        } else {
          return { x: midX + (x2 - midX) * ((t - segment2) / (1 - segment2)), y: y2 };
        }
      } else {
        const midY = y1 + dy * 0.7;
        const segment1 = 0.35;
        const segment2 = 0.65;
        
        if (t < segment1) {
          return { x: x1, y: y1 + (midY - y1) * (t / segment1) };
        } else if (t < segment2) {
          return { x: x1 + (x2 - x1) * ((t - segment1) / (segment2 - segment1)), y: midY };
        } else {
          return { x: x2, y: midY + (y2 - midY) * ((t - segment2) / (1 - segment2)) };
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      // Draw circuit connections
      ctx.strokeStyle = "rgba(59, 130, 246, 0.25)";
      ctx.lineWidth = 1.5;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        for (const connIdx of node.connections) {
          if (connIdx > i) {
            const targetNode = nodes[connIdx];
            drawCircuitLine(node.x, node.y, targetNode.x, targetNode.y);
          }
        }
      }

      // Draw and update data pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        if (!pulse.active) continue;

        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          // Pulse reached end, potentially continue to next connection
          const currentEnd = nodes[pulse.endNode];
          if (currentEnd.connections.length > 0 && Math.random() > 0.3) {
            const nextNodeIdx = currentEnd.connections[Math.floor(Math.random() * currentEnd.connections.length)];
            pulse.startNode = pulse.endNode;
            pulse.endNode = nextNodeIdx;
            pulse.progress = 0;
            pulse.speed = 0.002 + Math.random() * 0.004;
          } else {
            pulses.splice(i, 1);
            createNewPulse();
          }
          continue;
        }

        const startNode = nodes[pulse.startNode];
        const endNode = nodes[pulse.endNode];
        const pos = getPointOnCircuitLine(startNode.x, startNode.y, endNode.x, endNode.y, pulse.progress);

        // Draw pulse glow
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 15);
        gradient.addColorStop(0, "rgba(6, 182, 212, 0.6)");
        gradient.addColorStop(0.5, "rgba(59, 130, 246, 0.3)");
        gradient.addColorStop(1, "rgba(59, 130, 246, 0)");

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw pulse core
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(147, 197, 253, 0.9)";
        ctx.fill();

        // Draw trailing line
        const trailLength = 0.15;
        const trailStart = Math.max(0, pulse.progress - trailLength);
        ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let t = trailStart; t <= pulse.progress; t += 0.01) {
          const trailPos = getPointOnCircuitLine(startNode.x, startNode.y, endNode.x, endNode.y, t);
          if (t === trailStart) {
            ctx.moveTo(trailPos.x, trailPos.y);
          } else {
            ctx.lineTo(trailPos.x, trailPos.y);
          }
        }
        ctx.stroke();
      }

      // Draw circuit nodes
      for (const node of nodes) {
        node.pulsePhase += 0.02;
        const pulseIntensity = 0.3 + Math.sin(node.pulsePhase) * 0.2;

        // Node glow
        const nodeGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 4);
        nodeGradient.addColorStop(0, `rgba(59, 130, 246, ${pulseIntensity})`);
        nodeGradient.addColorStop(0.5, `rgba(6, 182, 212, ${pulseIntensity * 0.5})`);
        nodeGradient.addColorStop(1, "rgba(59, 130, 246, 0)");

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = nodeGradient;
        ctx.fill();

        // Node core
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${pulseIntensity + 0.3})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
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
      style={{ opacity: 0.3 }}
    />
  );
}
