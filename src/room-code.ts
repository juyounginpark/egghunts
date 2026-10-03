const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function createRoomCode(){return Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>alphabet[n%alphabet.length]).join('');}
export const validRoomCode=(value:string)=>/^[A-HJ-NP-Z2-9]{5,6}$/.test(value);
