import { ROOMS } from '../src/data/rooms.js';
import { ACTIONS } from '../src/data/actions.js';
import { validateRooms } from '../src/core/validator.js';
const errors=validateRooms(ROOMS);
console.log('Rooms:',Object.keys(ROOMS).length,'Objects:',Object.values(ROOMS).reduce((n,r)=>n+r.objects.length,0),'Phrases:',Object.values(ROOMS).reduce((n,r)=>n+r.objects.reduce((m,o)=>m+o.phrases.length,0),0),'Action templates:',Object.keys(ACTIONS).length);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log('PASS: consistent parametrized content');
