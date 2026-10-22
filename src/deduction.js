// The journal's reasoning: which ghosts remain possible given what the player has marked.
// marks: { [evidenceKey]: 'yes' | 'no' | undefined }

export function isRuledOut(ghost, marks){
  for(const k in marks){
    if(marks[k]==='yes' && !ghost.ev.includes(k)) return true;
    if(marks[k]==='no' && ghost.ev.includes(k)) return true;
  }
  return false;
}
export function candidates(ghosts, marks){ return ghosts.filter(g=>!isRuledOut(g,marks)); }
export function cycleMark(m){ return m==='yes'?'no':m==='no'?undefined:'yes'; }
