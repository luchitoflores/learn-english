// Raster-based Word Quest character loading. No SVG-to-texture conversion.
// In the first release these are three artwork variants of one mature protagonist.
export const AVATAR_KEY='wq-avatar-profile-v1';
export const AVATAR_DEFAULT=Object.freeze({actor:'he',beard:'full',outfit:'casual',hair:'short',hairColor:'silver',skin:'medium',shirtColor:'brick'});
const ART={
  beard:'hero-raster-beard',
  shaved:'hero-raster-shaved',
  suit:'hero-raster-suit'
};
export function getAvatarProfile(){
  try{return {...AVATAR_DEFAULT,...JSON.parse(localStorage.getItem(AVATAR_KEY)||'{}')}}
  catch{return {...AVATAR_DEFAULT}}
}
export function saveAvatarProfile(p){
  const clean={...AVATAR_DEFAULT,...Object.fromEntries(Object.entries(p||{}).filter(([k])=>k in AVATAR_DEFAULT))};
  localStorage.setItem(AVATAR_KEY,JSON.stringify(clean));return clean;
}
export class AvatarFactory {
  constructor(base){this.base=base}
  static load(base){return new AvatarFactory(base)}
  visualName(p){
    if(p?.outfit==='formal')return 'suit';
    return p?.beard==='none'?'shaved':'beard';
  }
  profileKey(p){
    // The side-view walk cycle is available for the casual bearded explorer.
    return this.visualName(p)==='beard'?'hero-side-walk':ART[this.visualName(p)];
  }
  expressionKey(p){return this.profileKey(p)}
  characterProfile(p){
    const key=this.profileKey(p);
    return {id:'raster-'+key,imagePrefix:'',sideSheet:key==='hero-side-walk'?key:null,
      poses:{idle:key,walkA:key,walkB:key,crouch:key,reach:key,
        grab:key,sit:key,hold:key,use:key},
      movement:{walkFrameRate:8,walkSpeed:.31}};
  }
  uri(p){return this.base+'assets/hero/'+this.visualName(p)+'.webp'}
  queueTextures(loader){
    if(!loader.scene.textures.exists('hero-side-walk')){
      loader.spritesheet('hero-side-walk',this.base+'assets/hero/side-walk.webp',
        {frameWidth:160,frameHeight:190});
    }
    for(const [filename,key] of Object.entries(ART)){
      if(!loader.scene.textures.exists(key)){
        loader.image(key,this.base+'assets/hero/'+filename+'.webp');
      }
    }
  }
}
