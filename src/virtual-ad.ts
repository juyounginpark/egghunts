import { BALANCE } from "./data";
export class VirtualAd {
  private readonly started:number;
  private claimed=false;
  constructor(private now:()=>number=()=>performance.now()){this.started=now();}
  get remaining(){return Math.max(0,Math.ceil((BALANCE.virtualAdDuration-(this.now()-this.started))/1000));}
  claim(){if(this.remaining>0||this.claimed)return 0;this.claimed=true;return BALANCE.virtualAdReward;}
}
