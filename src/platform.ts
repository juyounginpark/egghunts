import {
  Device,
  Environment,
  Game,
  SafeArea,
  Storage,
  Analytics,
  getUserKeyForGame,
} from "@apps-in-toss/web-framework";
import { parseSave, type Save } from "./game";
export interface PlatformAdapter {
  native: boolean;
  now(): number;
  syncTime(): Promise<void>;
  login(): Promise<void>;
  load(): Promise<Save>;
  save(data: Save): Promise<void>;
  submitScore(score: number): Promise<void>;
  leaderboard(score: number): Promise<void>;
  track(name: string, params?: Record<string, string | number>): void;
  haptic(): void;
}
export class Platform implements PlatformAdapter {
  native = false;
  offset = 0;
  key = "alkong:v1:local";
  private writes = Promise.resolve();
  private unsubscribe?: () => void;
  warning = "";
  constructor(private sdk = {Device, Environment, Game, SafeArea, Storage, Analytics, getUserKeyForGame}) {
    try {
      this.native = Boolean(this.sdk.Environment.tossAppVersion);
    } catch {
      /* Browser development fallback. */
    }
  }
  now() {
    return Date.now() + this.offset;
  }
  async syncTime() {
    if (this.native) {
      if (!this.sdk.Environment.getServerTime.isSupported())
        throw new Error("토스 앱을 최신 버전으로 업데이트해 주세요.");
      const time = await this.sdk.Environment.getServerTime();
      if (typeof time !== "number" || !Number.isFinite(time))
        throw new Error("서버 시간을 확인하지 못했어요. 다시 시도해 주세요.");
      this.offset = time - Date.now();
    }
  }
  async login() {
    if (!this.native) return;
    const user = await this.sdk.getUserKeyForGame();
    if (!user || typeof user === "string" || !("hash" in user))
      throw new Error(
        "게임 사용자 연결에 실패했어요. 토스에서 다시 열어주세요.",
      );
    this.key = `alkong:v1:${user.hash}`;
    try { await this.syncTime(); } catch (err) { this.warning = (err as Error).message; }
    const apply = (v: ReturnType<typeof SafeArea.get>) => {
      for (const side of ["top", "bottom", "left", "right"] as const)
        document.documentElement.style.setProperty(
          `--safe-${side}`,
          `${v[side]}px`,
        );
    };
    try {
      apply(this.sdk.SafeArea.get());
      this.unsubscribe = this.sdk.SafeArea.subscribe({ onEvent: apply });
    } catch { this.warning ||= "Safe Area unavailable; CSS insets retained."; }
  }
  async load() {
    const raw = this.native
      ? await this.sdk.Storage.getItem(this.key)
      : localStorage.getItem(this.key);
    return parseSave(raw ?? null, this.now());
  }
  save(data: Save) {
    const value = JSON.stringify(data);
    this.writes = this.writes
      .catch(() => {})
      .then(async () => {
        if (this.native) await this.sdk.Storage.setItem(this.key, value);
        else localStorage.setItem(this.key, value);
      });
    return this.writes;
  }
  async submitScore(score: number) {
    if (!this.native)
      throw new Error("순위는 토스 게임센터에서 확인할 수 있어요.");
    const result = await this.sdk.Game.setLeaderboardScore({ score: String(Math.floor(score)) });
    if (result?.statusCode !== "SUCCESS")
      throw new Error(
        "게임센터 연결을 확인해 주세요. 게임 등록과 리더보드 승인이 필요해요.",
      );
  }
  async leaderboard(score: number) {
    await this.submitScore(score);
    await this.sdk.Game.openLeaderboard();
    this.track("leaderboard_open");
  }
  track(name: string, params: Record<string, string | number> = {}) {
    try { if (this.native)
      void this.sdk.Analytics.log({ log_name: name, log_type: "event", params }).catch(
        () => {},
      ); } catch { /* Optional telemetry must not interrupt gameplay. */ }
  }
  dispose() { this.unsubscribe?.(); }
  haptic() {
    try { if (this.native)
      void this.sdk.Device.triggerHaptic({ type: "tickWeak" }).catch(() => {}); } catch { /* Optional feedback. */ }
  }
}
