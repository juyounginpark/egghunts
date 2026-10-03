export const EMOTES=[{id:'hello',icon:'👋',label:'안녕'},{id:'love',icon:'❤️',label:'좋아!'},{id:'laugh',icon:'😄',label:'웃음'},{id:'angry',icon:'😠',label:'화남'},{id:'surprise',icon:'😮',label:'놀람'},{id:'go',icon:'🚀',label:'가자!'}] as const;
export type EmoteId=typeof EMOTES[number]['id'];
export type Emote={id:EmoteId;at:number};
export const emoteIcon=(id:string)=>EMOTES.find(e=>e.id===id)?.icon??'';
export const EMOTE_DURATION=2500;
