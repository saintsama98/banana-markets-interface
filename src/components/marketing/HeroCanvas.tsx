"use client";

import { useEffect, useRef } from "react";

/**
 * The hero "liquidity routing" scene: matcha ink streams flowing from a
 * deposit source into three venue blocks across the yellow canvas. Hand-rolled
 * vector canvas, transform/opacity-grade work only.
 *
 * Static under prefers-reduced-motion: routes + nodes render once, no particles.
 */

const STREAM = "#5C8A2C";
const INK = "#141412";
const PAPER = "rgba(255, 247, 224, 0.96)";
const VENUES = [
  { label: "AAVE V3", color: "#0F766E", ty: 0.26 },
  { label: "MORPHO", color: "#4338CA", ty: 0.5 },
  { label: "PENDLE PT", color: "#A21CAF", ty: 0.74 },
];

interface Particle {
  route: number;
  t: number;
  speed: number;
  size: number;
}

function routePoint(w: number, h: number, route: number, t: number) {
  // Cubic bezier from the source node to a venue block.
  const x0 = w * 0.14;
  const y0 = h * 0.5;
  const x3 = w * 0.84;
  const y3 = h * VENUES[route].ty;
  const x1 = w * 0.42;
  const y1 = y0;
  const x2 = w * 0.6;
  const y2 = y3;
  const u = 1 - t;
  const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
  const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
  return { x, y };
}

export function HeroCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const particles: Particle[] = [];
    if (!reduce) {
      for (let i = 0; i < 42; i++) {
        particles.push({
          route: i % 3,
          t: Math.random(),
          speed: 0.0016 + Math.random() * 0.0026,
          size: 1 + Math.random() * 1.8,
        });
      }
    }

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawStatic() {
      const c = ctx!;
      c.clearRect(0, 0, w, h);

      // routes
      c.lineWidth = 1.5;
      for (let r = 0; r < 3; r++) {
        c.beginPath();
        const p0 = routePoint(w, h, r, 0);
        c.moveTo(p0.x, p0.y);
        for (let i = 1; i <= 48; i++) {
          const p = routePoint(w, h, r, i / 48);
          c.lineTo(p.x, p.y);
        }
        c.strokeStyle = "rgba(20, 20, 18, 0.22)";
        c.stroke();
      }

      // source node — the deposit
      const sx = w * 0.14;
      const sy = h * 0.5;
      const glow = c.createRadialGradient(sx, sy, 0, sx, sy, 60);
      glow.addColorStop(0, "rgba(92,138,44,0.4)");
      glow.addColorStop(1, "rgba(92,138,44,0)");
      c.fillStyle = glow;
      c.fillRect(sx - 60, sy - 60, 120, 120);
      c.beginPath();
      c.arc(sx, sy, 6, 0, Math.PI * 2);
      c.fillStyle = INK;
      c.fill();

      // venue blocks — cream cards with ink borders + hard shadow
      VENUES.forEach((v, i) => {
        const p = routePoint(w, h, i, 1);
        const bw = Math.min(150, w * 0.16);
        const bh = 44;
        const x = p.x;
        const y = p.y - bh / 2;
        c.beginPath();
        c.roundRect(x + 4, y + 4, bw, bh, 8);
        c.fillStyle = INK;
        c.fill();
        c.beginPath();
        c.roundRect(x, y, bw, bh, 8);
        c.fillStyle = PAPER;
        c.fill();
        c.strokeStyle = INK;
        c.lineWidth = 2;
        c.stroke();
        c.fillStyle = v.color;
        c.fillRect(x + 2, y + 8, 4, bh - 16);
        c.font = "700 10px var(--font-mono), monospace";
        c.fillStyle = INK;
        c.fillText(v.label, x + 16, y + bh / 2 + 3.5);
      });
    }

    function frame() {
      drawStatic();
      const c = ctx!;
      for (const p of particles) {
        p.t += p.speed;
        if (p.t > 1) p.t = 0;
        const pos = routePoint(w, h, p.route, p.t);
        // short trail
        c.beginPath();
        const tail = routePoint(w, h, p.route, Math.max(0, p.t - 0.025));
        c.moveTo(tail.x, tail.y);
        c.lineTo(pos.x, pos.y);
        c.strokeStyle = "rgba(92, 138, 44, 0.5)";
        c.lineWidth = p.size;
        c.lineCap = "round";
        c.stroke();
        c.beginPath();
        c.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
        c.fillStyle = STREAM;
        c.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (reduce) {
      drawStatic();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
