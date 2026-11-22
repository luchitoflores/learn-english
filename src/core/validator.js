import { ACTIONS } from '../data/actions.js';
export function validateRooms(rooms){
 const errors=[];
 for(const [key,room] of Object.entries(rooms)){
   if(!Array.isArray(room.objects))errors.push(`${key}: missing objects`);
   const seen=new Set();
   for(const obj of room.objects||[]){
     if(seen.has(obj.id))errors.push(`${key}: duplicate ${obj.id}`); seen.add(obj.id);
     if(!Number.isFinite(obj.x)||!Number.isFinite(obj.y))errors.push(`${key}/${obj.id}: invalid coordinates`);
     if(!obj.kind||!obj.name)errors.push(`${key}/${obj.id}: invalid identity`);
     for(const phrase of obj.phrases||[]){
       if(!ACTIONS[phrase.action])errors.push(`${key}/${obj.id}: unknown action ${phrase.action}`);
       if(!phrase.english||!phrase.spanish)errors.push(`${key}/${obj.id}: incomplete phrase`);
     }
   }
 }
 return errors;
}
