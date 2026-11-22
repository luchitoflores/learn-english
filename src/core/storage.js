const KEY='word-quest-living-english-v1';
const initial={xp:0,correct:0,attempts:0,discovered:{},practice:{},stars:{},streak:0,room:'bedroom'};
export function loadProgress(){try{return {...initial,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...initial}}}
export function saveProgress(progress){try{localStorage.setItem(KEY,JSON.stringify(progress))}catch{}}
export function remember(progress,room,object,phrase,correct=true){
  const id=`${room}/${object}/${phrase.action}/${phrase.english}`;
  progress.attempts++;
  if(correct){progress.correct++;progress.streak++;progress.xp+=10+Math.min(progress.streak,10)*2;
    progress.practice[id]=(progress.practice[id]||0)+1;
    progress.discovered[id]=true;
  }else progress.streak=0;
  saveProgress(progress);
}
