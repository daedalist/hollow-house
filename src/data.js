// Static game data: evidence, ghosts, instruments, the house plan.
// ---------- Data ----------
export const EV = {
  emf:   {name:'EMF Level 5',      short:'EMF 5'},
  cold:  {name:'Freezing cold',    short:'Freezing'},
  box:   {name:'Spirit box reply', short:'Spirit box'},
  uv:    {name:'UV handprints',    short:'UV prints'},
  orbs:  {name:'Orbs on camera',   short:'Orbs'},
  book:  {name:'Ghost writing',    short:'Writing'},
};
export const GHOSTS = [
  {n:'Wraith',    ev:['emf','cold','box'],   note:'Never leaves a print. Fast once roused.', speed:1.12},
  {n:'Poltergeist',ev:['emf','uv','book'],   note:'Throws what it cannot hold.', speed:1.0},
  {n:'Banshee',   ev:['cold','box','orbs'],  note:'Keens before it hunts.', speed:0.95},
  {n:'Revenant',  ev:['cold','uv','book'],   note:'Slow until it sees you. Then it is not.', speed:0.8, chase:1.5},
  {n:'Shade',     ev:['emf','orbs','book'],  note:'Shy. Patient. Hunts late and long.', speed:0.95, patience:1.35},
  {n:'Phantom',   ev:['box','uv','orbs'],    note:'Vanishes when photographed.', speed:1.0},
  {n:'Mare',      ev:['cold','orbs','book'], note:'Hates the lantern. Hunts early.', speed:1.0, patience:0.7},
  {n:'Hollow',    ev:['emf','box','uv'],     note:'Answers the box eagerly, and lies.', speed:1.05, liar:true},
];
export const TOOLS = [
  {id:'emf',  n:'EMF reader',    cost:40, desc:'Passive. Needle climbs near the spirit. Level 5 is evidence.'},
  {id:'temp', n:'Thermometer',   cost:30, desc:'Passive. Below 0°C in a room is evidence.'},
  {id:'box',  n:'Spirit box',    cost:50, desc:'Use in its room to ask a question. Angers it a little each time.'},
  {id:'uv',   n:'UV torch',      cost:35, desc:'Use near a doorway in its room to find handprints.'},
  {id:'cam',  n:'Camera',        cost:45, desc:'Use in its room. Five shots. Orbs are evidence.'},
  {id:'book', n:'Writing book',  cost:40, desc:'Use to lay it down. Come back in a while and read it.'},
  {id:'salt', n:'Salt line',     cost:25, desc:'Consumable. Lay it in a doorway; a hunting ghost stalls on it.', consumable:true},
  {id:'charm',n:'Hearth charm',  cost:60, desc:'Consumable. Burn it to calm the house for 30 seconds.', consumable:true},
];
export const MAP = [
'####################',
'#C...#....C#......C#',
'#....#.....D.......#',
'#....D.....#.......#',
'#....#.....#...#####',
'##D###..D###...D...#',
'#.....D........#...#',
'#.....#........#...#',
'#....C#..###D###...#',
'#######..#.....#...#',
'#....D...#.....D...#',
'#....#...#....C#...#',
'#...C#...#######..C#',
'####################'];
export const ROOMS = [
  {n:'Kitchen', x:1,y:1,w:4,h:4},
  {n:'Dining room', x:6,y:1,w:5,h:4},
  {n:'Lounge', x:12,y:1,w:7,h:4},
  {n:'Study', x:1,y:6,w:5,h:3},
  {n:'Bedroom', x:16,y:5,w:3,h:8},
  {n:'Nursery', x:10,y:9,w:5,h:3},
  {n:'Cellar', x:1,y:10,w:4,h:3},
];
export const W=20,H=14,T=32;
