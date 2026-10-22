// Print generated houses as ASCII for eyeballing. Usage: node scripts/print-houses.js [count] [firstSeed]
import { generateHouse, houseToString } from '../src/procgen.js';
const count=+process.argv[2]||6, first=+process.argv[3]||1;
for(let s=first;s<first+count;s++){ const h=generateHouse(s); console.log(`\n== seed ${s} · ${h.name} · ${h.rooms.length} rooms\n`+houseToString(h)); }
