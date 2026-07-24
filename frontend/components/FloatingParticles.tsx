"use client";

// Fixed (not random) so server- and client-rendered markup always match.
const PARTICLES = [
  { emoji: "🍔", left: 4, delay: 0, duration: 16, size: 1.4 },
  { emoji: "🍕", left: 14, delay: 3, duration: 20, size: 1.6 },
  { emoji: "🥤", left: 24, delay: 7, duration: 14, size: 1.2 },
  { emoji: "🌮", left: 34, delay: 1, duration: 18, size: 1.3 },
  { emoji: "🍟", left: 44, delay: 9, duration: 15, size: 1.1 },
  { emoji: "🍩", left: 54, delay: 4, duration: 19, size: 1.3 },
  { emoji: "🍜", left: 64, delay: 11, duration: 17, size: 1.5 },
  { emoji: "🧋", left: 74, delay: 2, duration: 21, size: 1.2 },
  { emoji: "🍦", left: 84, delay: 6, duration: 16, size: 1.3 },
  { emoji: "🥡", left: 92, delay: 13, duration: 18, size: 1.2 },
  { emoji: "🍕", left: 9, delay: 15, duration: 22, size: 1.1 },
  { emoji: "🍔", left: 68, delay: 8, duration: 13, size: 1.0 },
];

export function FloatingParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="animate-float-up absolute bottom-0 select-none opacity-0"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}rem`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
