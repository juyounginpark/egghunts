import { BALANCE } from "./data";
export class Input {
  x = 0;
  y = 0;
  keys = new Set<string>();
  pointer: number | null = null;
  constructor(
    private pad: HTMLElement,
    private knob: HTMLElement,
    action: () => void,
    pause: () => void,
  ) {
    pad.addEventListener("pointerdown", (e) => {
      if (this.pointer !== null) return;
      this.pointer = e.pointerId;
      pad.setPointerCapture(e.pointerId);
      this.update(e);
    });
    pad.addEventListener("pointermove", (e) => {
      if (e.pointerId === this.pointer) this.update(e);
    });
    const release = (e: PointerEvent) => {
      if (e.pointerId === this.pointer) this.reset();
    };
    pad.addEventListener("pointerup", release);
    pad.addEventListener("pointercancel", release);
    pad.addEventListener("lostpointercapture", release);
    window.addEventListener("keydown", (e) => {
      if ((e.target as HTMLElement).matches("input,button,select")) return;
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      )
        e.preventDefault();
      this.keys.add(e.key.toLowerCase());
      if (!e.repeat && ["e", " "].includes(e.key.toLowerCase())) action();
      if (!e.repeat && e.key === "Escape") pause();
    });
    window.addEventListener("keyup", (e) =>
      this.keys.delete(e.key.toLowerCase()),
    );
    window.addEventListener("blur", () => this.reset());
  }
  update(e: PointerEvent) {
    const r = this.pad.getBoundingClientRect(),
      dx = e.clientX - r.left - r.width / 2,
      dy = e.clientY - r.top - r.height / 2;
    const len = Math.hypot(dx, dy),
      limit = r.width * 0.3,
      scale = len > limit ? limit / len : 1;
    this.x = len < BALANCE.deadzone ? 0 : (dx * scale) / limit;
    this.y = len < BALANCE.deadzone ? 0 : (dy * scale) / limit;
    this.knob.style.transform = `translate(${dx * scale}px,${dy * scale}px)`;
  }
  reset() {
    this.pointer = null;
    this.x = this.y = 0;
    this.keys.clear();
    this.knob.style.transform = "";
  }
  vector() {
    return {
      x:
        this.x +
        (this.keys.has("d") || this.keys.has("arrowright") ? 1 : 0) -
        (this.keys.has("a") || this.keys.has("arrowleft") ? 1 : 0),
      y:
        this.y +
        (this.keys.has("s") || this.keys.has("arrowdown") ? 1 : 0) -
        (this.keys.has("w") || this.keys.has("arrowup") ? 1 : 0),
    };
  }
}
