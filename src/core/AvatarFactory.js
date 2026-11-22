// Word Quest raster characters. The supplied original PNG sheets are the source.
// The default standing state is FRONT; profile walking/action use SIDE frames.
export const AVATAR_KEY='wq-avatar-profile-v1';
export const AVATAR_DEFAULT=Object.freeze({actor:'he',beard:'full',outfit:'casual',hair:'short',hairColor:'silver',skin:'medium',shirtColor:'brick'});
const ART={
  beard:'hero-front-beard',
  shaved:'hero-front-shaved',
  suit:'hero-front-suit'
};
const FILES={beard:'front-beard.png',shaved:'front-shaved.png',suit:'front-suit.png'};
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
  profileKey(p){return ART[this.visualName(p)]}
  expressionKey(p){return this.profileKey(p)}
  characterProfile(p){
    const frontKey=this.profileKey(p);
    const sideSheet='hero-side-walk-clean';
    return {
      id:'raster-'+frontKey,
      imagePrefix:'',
      frontKey,
      sideSheet,
      poses:{idle:frontKey,walkA:sideSheet,walkB:sideSheet,
        crouch:sideSheet,reach:sideSheet,grab:sideSheet,
        sit:sideSheet,hold:sideSheet,use:sideSheet},
      movement:{walkFrameRate:8,walkSpeed:.31}
    };
  }
  uri(p){return this.base+'assets/hero/'+FILES[this.visualName(p)]}
  queueTextures(loader){
    if(!loader.scene.textures.exists('hero-side-walk-clean')){
      loader.spritesheet('hero-side-walk-clean',
        this.base+'assets/hero/side-walk-clean.png',{frameWidth:192,frameHeight:256});
    }
    for(const [name,key] of Object.entries(ART)){
      if(!loader.scene.textures.exists(key)){
        loader.image(key,this.base+'assets/hero/'+FILES[name]);
      }
    }
  }
}