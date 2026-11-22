// One shared vector source: SVG in character-lab is rendered in both the editor and Phaser.
export const AVATAR_KEY='wq-avatar-profile-v1';
export const AVATAR_DEFAULT=Object.freeze({actor:'he',beard:'full',outfit:'casual',hair:'short',hairColor:'silver',skin:'medium',shirtColor:'brick'});
export const OUTFITS=['casual','formal','home','pajamas'];
export const BEARDS=['full','none'];
export const POSES=['idle','walk1','walk2','crouch','reach','grab','sit','hold','use'];
export const EXPRESSIONS=['smile','shout','cry','blink','brush','shave','makeup'];
const NS='http://www.w3.org/2000/svg';
const COLORS={
 skin:{medium:['#e6b484','#bb805e'],light:['#f4d6b7','#d5a27e'],dark:['#9a654e','#754736']},
 hair:{silver:'#8a8e99',brown:'#473349',black:'#222837',blonde:'#9c6c43'},
 shirt:{brick:['#a65749','#783d3d'],teal:['#579a9a','#327578'],purple:['#9c77b7','#6d4d91'],orange:['#db8a68','#9e5b53']}
};
export function getAvatarProfile(){try{return {...AVATAR_DEFAULT,...JSON.parse(localStorage.getItem(AVATAR_KEY)||'{}')}}catch{return {...AVATAR_DEFAULT}}}
export function saveAvatarProfile(p){const allowed=Object.fromEntries(Object.entries(p||{}).filter(([k])=>k in AVATAR_DEFAULT));const out={...AVATAR_DEFAULT,...allowed};localStorage.setItem(AVATAR_KEY,JSON.stringify(out));return out;}
const show=(root,id,visible)=>{const el=root.querySelector('#'+id);if(el)el.setAttribute('display',visible?'inline':'none')};
export class AvatarFactory {
 constructor(markup){this.markup=markup}
 static async load(base){
  const r=await fetch(base+'character-lab/index.html',{cache:'no-cache'});
  if(!r.ok)throw new Error('No se pudo cargar el arte del personaje: '+r.status);
  const doc=new DOMParser().parseFromString(await r.text(),'text/html');
  const svg=doc.querySelector('.stage svg');
  if(!svg)throw new Error('Falta SVG del personaje');
  return new AvatarFactory(new XMLSerializer().serializeToString(svg));
 }
 textureKey(outfit,beard,pose){return 'avatar-'+outfit+'-'+beard+'-'+pose}
 profileKey(profile,pose='idle'){return this.textureKey(OUTFITS.includes(profile.outfit)?profile.outfit:'casual',profile.beard==='none'?'none':'full',pose)}
 expressionKey(profile,emotion){return this.profileKey(profile,'expr-'+emotion)}
 characterProfile(p){
  const prefix=this.profileKey(p,'');
  return {id:prefix,imagePrefix:prefix,poses:{idle:'idle',walkA:'walk1',walkB:'walk2',crouch:'crouch',reach:'reach',grab:'grab',sit:'sit',hold:'hold',use:'use'},movement:{walkFrameRate:7,walkSpeed:.31}}
 }
 svg(profile={},pose='idle',emotion='neutral'){
  const p={...AVATAR_DEFAULT,...profile};
  const doc=new DOMParser().parseFromString(this.markup,'image/svg+xml');
  const svg=doc.documentElement;
  if(svg.tagName==='parsererror')throw new Error('SVG inválido');
  svg.setAttribute('xmlns',NS);svg.setAttribute('viewBox','105 35 210 414');
  svg.setAttribute('width','170');svg.setAttribute('height','320');
  svg.querySelector('#supportActor')?.remove();
  const skin=COLORS.skin[p.skin]||COLORS.skin.medium;
  const hair=COLORS.hair[p.hairColor]||COLORS.hair.silver;
  const shirt=COLORS.shirt[p.shirtColor]||COLORS.shirt.brick;
  svg.setAttribute('style',[
   '--skin:'+skin[0],'--skin-shadow:'+skin[1],'--hair:'+hair,
   '--beard:#747b88','--shirt:'+(p.outfit==='pajamas'?'#718bbc':shirt[0]),
   '--shirt-shadow:'+(p.outfit==='pajamas'?'#4c65a0':shirt[1]),
   '--pants:#465f8d','--shoes:#302c42'].join(';')+';');
  show(svg,'hairShort',p.hair!=='long');show(svg,'hairLong',p.hair==='long');
  show(svg,'beard',p.beard!=='none');
  show(svg,'shirtLayer',p.outfit==='casual'||p.outfit==='pajamas');
  show(svg,'suitLayer',p.outfit==='formal');
  if(p.outfit==='home'){
    const arms=[['#armBack','path:nth-child(2)'],['#armNormal','path:first-child'],['#armWorking','path:first-child']];
    for(const [parent,child] of arms){
      const node=svg.querySelector(parent+' '+child);
      if(node)node.setAttribute('stroke',skin[0]);
    }
  }
  show(svg,'eyesOpen',emotion!=='blink');show(svg,'eyesClosed',emotion==='blink');
  show(svg,'browsNormal',!['cry','shout'].includes(emotion));
  show(svg,'browsSad',emotion==='cry');show(svg,'browsRaised',emotion==='shout');
  show(svg,'mouthNeutral',!['smile','cry','shout'].includes(emotion));
  show(svg,'mouthSmile',emotion==='smile');show(svg,'mouthSad',emotion==='cry');
  show(svg,'mouthShout',emotion==='shout');show(svg,'tears',emotion==='cry');
  const arm=['reach','grab','hold','use'].includes(pose)||['brush','shave','makeup'].includes(emotion);
  show(svg,'armNormal',!arm);show(svg,'armWorking',arm);
  for(const id of ['toothbrush','razor','makeupBrush','nailClipper'])show(svg,id,false);
  if(emotion==='brush')show(svg,'toothbrush',true);
  if(emotion==='shave')show(svg,'razor',true);
  if(emotion==='makeup')show(svg,'makeupBrush',true);
  if(pose==='walk1'){svg.querySelector('#legFront')?.setAttribute('transform','rotate(13 231 332)');svg.querySelector('#legBack')?.setAttribute('transform','rotate(-14 177 332)')}
  if(pose==='walk2'){svg.querySelector('#legFront')?.setAttribute('transform','rotate(-13 231 332)');svg.querySelector('#legBack')?.setAttribute('transform','rotate(14 177 332)')}
  if(pose==='sit'){svg.querySelector('#legFront')?.setAttribute('transform','rotate(-35 231 332)');svg.querySelector('#legBack')?.setAttribute('transform','rotate(36 177 332)')}
  if(pose==='crouch')svg.querySelector('#char')?.setAttribute('transform','translate(0 65) scale(1 .85)');
  return new XMLSerializer().serializeToString(svg);
 }
 uri(p,pose,emotion='neutral'){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(this.svg(p,pose,emotion))}
 queueTextures(loader,profile){
  for(const outfit of OUTFITS)for(const beard of BEARDS){
   const p={...profile,outfit,beard};
   for(const pose of POSES)loader.svg(this.textureKey(outfit,beard,pose),this.uri(p,pose));
   for(const expression of EXPRESSIONS)loader.svg(this.textureKey(outfit,beard,'expr-'+expression),this.uri(p,'use',expression));
  }
 }
}
