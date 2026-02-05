import confetti from "canvas-confetti";

export function fireConfetti() {
  const end = Date.now() + 600;
  const defaults = { startVelocity: 25, spread: 360, ticks: 55, zIndex: 9999 };

  function frame() {
    confetti({ ...defaults, particleCount: 22, origin: { x: 0.2, y: 0.6 } });
    confetti({ ...defaults, particleCount: 22, origin: { x: 0.8, y: 0.6 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  }

  frame();
}
