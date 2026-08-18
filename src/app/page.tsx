"use client";

import { useEffect, useRef } from "react";
import { Barlow_Condensed, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import styles from "./page.module.css";

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

export default function ComingSoon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const N = 64;
    const paper = "242,237,227";
    const rust = "200,91,28";
    type Particle = {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      o: number;
      accent: boolean;
    };
    const pts: Particle[] = [];

    function seed() {
      pts.length = 0;
      for (let i = 0; i < N; i++) {
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1 + Math.random() * 2.2,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          o: 0.05 + Math.random() * 0.18,
          accent: Math.random() < 0.08,
        });
      }
    }

    function size() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const oldW = w;
      const oldH = h;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Keep the field evenly distributed across viewport changes; a zero-size
      // viewport (e.g. hydrating in a hidden/unsized pane) needs a full reseed.
      if (pts.length && oldW > 0 && oldH > 0) {
        for (const p of pts) {
          p.x = (p.x / oldW) * w;
          p.y = (p.y / oldH) * h;
        }
      } else {
        seed();
      }
    }
    size();
    window.addEventListener("resize", size);

    let raf = 0;
    function step() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.accent ? rust : paper},${p.o})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    }
    step();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, []);

  return (
    <div
      className={`${barlow.variable} ${plexMono.variable} ${plexSans.variable} ${styles.page}`}
    >
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.wrap}>
        <div className={styles.status}>In progress</div>
        <div className={styles.mark}>
          Coagulate<span className={styles.markDot}>.dev</span>
        </div>
        <p className={styles.blurb}>
          Coagulate Dev helps small businesses turn scattered tools and messy
          workflows into clear, automated systems — CRM and pipeline setup,
          workflow automation, AI-driven processes, and the websites and
          documentation to back it all up.{" "}
          <strong>The site is being built right now.</strong>
        </p>

        <a
          className={styles.product}
          href="https://storage-analyst.vercel.app/welcome"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.productLabel}>Now building</span>
          <span className={styles.productName}>Storage Analyst</span>
          <span className={styles.productBlurb}>
            Underwrite a self-storage deal in the time it takes to read the rent
            roll. Rent rolls and T-12s in, rent benchmarking, financing
            scenarios, and a straight answer on whether the deal works.
          </span>
          <span className={styles.productCta}>
            Join the waitlist<span aria-hidden="true"> →</span>
          </span>
        </a>
      </div>
    </div>
  );
}
