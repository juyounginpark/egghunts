/** Milliseconds; tune between 250 and 500 without changing gameplay simulation. */
export const PRESENCE={updateMs:500,reconnectMs:3000,heartbeatMs:10000,maxPeers:5};
export type MultiplayerConnection='disconnected'|'connecting'|'connected'|'reconnecting';
export type SharedEvent={id:string;kind:'secret'|'event'|'world-reward'|'limited';expiresAt:number;claimedBy?:string;payload:unknown};
