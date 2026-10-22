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

// ---------- Procedural houses ----------
// Every knob the generator reads. Tune here; test/procgen.test.js checks that plans stay valid.
export const GEN = {
  w:20, h:14,                 // footprint in tiles, the same as Marrow Lane
  attempts:60,                // layouts to try per seed before giving up
  hallWidth:2,                // tiles. 1 is claustrophobic and a hunting ghost blocks it completely
  spineSpread:3,              // the front-door hall sits within this many tiles of the centre column
  corridorChance:0.85,        // a cross corridor off the hall (T, L or + shaped hall). Otherwise a straight hall
  lChance:0.25,               // when there is a corridor, chance it runs one way only
  spineUpChance:0.4,          // the hall continues past the corridor to the back wall
  capChance:0.55,             // each corridor end stops short of the outer wall and a room sits across the end
  capWidth:[3,5],             // width of that end room
  room:{ minW:3, minH:3, maxW:7, maxH:6, maxArea:36 }, // wider/taller than the max is always split; bigger in area is split if that keeps it on the hall
  splitChance:0.65,           // chance to split a rect that does not have to be split (more rooms, smaller rooms)
  splitBias:0.6,              // where the wall goes when splitting: 0 anywhere, 1 always the middle (fewer slivers)
  innerRoomChance:0.2,        // chance to allow a split that leaves a room with no wall on the hall (reached through a neighbour)
  rooms:[6,9],                // accept a plan only if it has this many rooms
  extraRoomDoorChance:0.2,    // connecting door between two adjacent rooms that already have a way in
  secondHallDoorChance:0.15,  // a second door onto the hall, on a different wall of the room
  closetCornerBias:0.8,       // closets prefer corners
  names:{ largeArea:20, smallArea:12, kitchenMinArea:12, diningMinArea:9 }, // area thresholds for naming
};
// Rooms named by rule first (Kitchen, Dining room next to it, Lounge is the largest), then by size.
export const ROOM_NAMES = {
  large:  ['Drawing room','Library','Parlour','Billiard room','Morning room'],
  medium: ['Study','Bedroom','Back bedroom','Guest room','Sewing room','Music room'],
  small:  ['Nursery','Bathroom','Pantry','Box room','Scullery','Cellar','Larder','Linen room'],
};
export const STREETS = ['Thorn Street','Gallows Row','Candle Lane','Wick Street','Sallow Road','Pale Court','Tallow Lane','Mourning Row','Birch Hollow','Hollins Walk','Ember Terrace','Vellum Close'];
