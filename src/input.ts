import { BALANCE } from "./data";
export class Input {
  x = 0;
  y = 0;
  keys = new Set<string>();
  pointer: number | null = null;
  private surface:HTMLElement;
  private origin={x:0,y:0};
  constructor(
    private pad: HTMLElement,
    private knob: HTMLElement,
    action: () => void,
    pause: () => void,
  ) {
    this.surface=pad.closest<HTMLElement>('#shell')!;
    pad.dataset.floating='true';pad.hidden=true;
    this.surface.addEventListener("pointerdown", (e) => {
      if(this.pointer!==null||e.button!==0||!['base','expedition'].includes(this.surface.dataset.mode??''))return;
      if((e.target as HTMLElement).closest('button,nav,#top-hud,#panel,#modal,#return-reward,#loading'))return;
      if(!document.getElementById('modal')!.hidden||!document.getElementById('return-reward')!.hidden)return;
      e.preventDefault();
      this.pointer = e.pointerId;
      this.origin={x:e.clientX,y:e.clientY};
      pad.style.left=`${e.clientX}px`;pad.style.top=`${e.clientY}px`;pad.hidden=false;
      this.surface.setPointerCapture(e.pointerId);
    });
    this.surface.addEventListener("pointermove", (e) => {
      if (e.pointerId === this.pointer) this.update(e);
    });
    const release = (e: PointerEvent) => {
      if (e.pointerId === this.pointer) this.reset();
    };
    this.surface.addEventListener("pointerup", release);
    this.surface.addEventListener("pointercancel", release);
    this.surface.addEventListener("lostpointercapture", release);
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
      dx = e.clientX - this.origin.x,
      dy = e.clientY - this.origin.y;
    const len = Math.hypot(dx, dy),
      limit = r.width * 0.3,
      scale = len > limit ? limit / len : 1;
    this.x = len < BALANCE.deadzone ? 0 : (dx * scale) / limit;
    this.y = len < BALANCE.deadzone ? 0 : (dy * scale) / limit;
    this.knob.style.transform = `translate(${dx * scale}px,${dy * scale}px)`;
  }
  reset() {
    const pointer=this.pointer;
    this.pointer = null;
    if(pointer!==null&&this.surface.hasPointerCapture(pointer))this.surface.releasePointerCapture(pointer);
    this.pad.hidden=true;
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
