export type SecureRequest={kind:'payment'|'ad'|'coupon'|'leaderboard'|'event';id:string;value:unknown};
export type VerifiedReward={receiptId:string;kind:SecureRequest['kind'];payload:unknown};
export interface SecureEconomyProvider{
 execute(request:SecureRequest):Promise<VerifiedReward>;
}
/** No simulated advertisement or unverified local score enters this boundary. */
export class SecureEconomy{
 constructor(private provider?:SecureEconomyProvider){}
 async execute(kind:SecureRequest['kind'],value:unknown){
  if(!this.provider)throw Error('이 기능은 서버 검증 연결 후 사용할 수 있어요. 일반 게임은 계속할 수 있어요.');
  const result=await this.provider.execute({kind,id:crypto.randomUUID(),value});
  if(!result.receiptId||result.kind!==kind)throw Error('보상 검증 결과가 올바르지 않아요.');
  return result;
 }
 async submitLeaderboardScore(type:string,value:number){
  if(!Number.isFinite(value)||value<0)throw Error('Invalid score');
  return this.execute('leaderboard',{type,value});
 }
}
