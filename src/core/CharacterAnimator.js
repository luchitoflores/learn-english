import { CHARACTER_PROFILE, ANIMATION_RECIPES, FACIAL_PRESETS } from '../data/character.js';

// Lightweight, license-free animation adapter for Phaser 3.
// Phase 1 uses the PNG poses already available. A future character profile may
// attach transparent face/body/garment images without rewriting room gameplay.
export class CharacterAnimator {
  constructor(scene, sprite, profile = CHARACTER_PROFILE) {
    this.scene = scene;
    this.sprite = sprite;
    this.profile = profile;
    this.layers = new Map();
    this.expression = 'neutral';
    this.animationToken = 0;
    this.disposed = false;
    this.delays = new Set();
    this.ensureWalk();
    scene.events.once('shutdown', () => this.dispose());
  }
  ensureWalk(){
    if(!this.scene.anims.exists(this.walkKey)){
      this.scene.anims.create({key:this.walkKey,frames:[
        {key:this.keyFor('walkA')},{key:this.keyFor('walkB')}
      ],frameRate:this.profile.movement.walkFrameRate||7,repeat:-1});
    }
  }
  setSkin(profile){
    if(!profile||this.disposed)return;
    this.sprite.stop();
    this.profile=profile;
    this.ensureWalk();
    this.rest();
  }
  get walkKey() { return `${this.profile.id}-walk`; }
  keyFor(pose) {
    return `${this.profile.imagePrefix}${this.profile.poses[pose] || this.profile.poses.idle}`;
  }
  setPose(pose) {
    if (this.disposed || !this.sprite?.active) return;
    this.sprite.stop();
    const key=this.keyFor(pose);
    if(this.scene.textures.exists(key))this.sprite.setTexture(key);
    this.sprite.setAngle(pose==='reach'?-7:pose==='use'?6:pose==='crouch'?2:0);
  }
  walk() {
    if (this.disposed || !this.sprite?.active) return;
    if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim?.key !== this.walkKey) {
      this.sprite.play(this.walkKey);
    }
  }
  rest(held = false) { this.setPose(held ? 'hold' : 'idle'); }
  turn(left) {
    if (this.disposed) return;
    this.sprite.setFlipX(Boolean(left));
    this.syncLayers();
  }
  // Optional art layers: provide PNG texture keys and offsets measured in
  // the original 126x160 character frame, not stage/world coordinates.
  attachLayer(slot, textureKey, {dx=0,dy=0,width,height,depth=1,frame}={}) {
    this.removeLayer(slot);
    if (!textureKey || !this.scene.textures.exists(textureKey)) return false;
    const image = this.scene.add.image(this.sprite.x,this.sprite.y,textureKey,frame);
    image.setDepth(this.sprite.depth+depth);
    if (width && height) image.setDisplaySize(width,height);
    this.layers.set(slot,{image,dx,dy,textureKey});
    this.syncLayers();
    return true;
  }
  removeLayer(slot) {
    const previous=this.layers.get(slot);
    if (previous) previous.image.destroy();
    this.layers.delete(slot);
  }
  syncLayers() {
    if (this.disposed || !this.sprite?.active) return;
    const factor=this.sprite.flipX?-1:1;
    for(const {image,dx,dy} of this.layers.values()){
      image.setPosition(this.sprite.x+dx*factor,this.sprite.y+dy);
      image.setFlipX(this.sprite.flipX);
      image.setVisible(this.sprite.visible);
    }
  }
  setExpression(name) {
    // State is retained even if the current flattened sprite has no face slots.
    if (!FACIAL_PRESETS[name]) return false;
    this.expression=name;
    const preset=FACIAL_PRESETS[name];
    for(const slot of ['eyes','mouth','eyebrows']){
      const layer=this.layers.get(slot);
      const desired=preset[slot];
      if(layer && desired && this.scene.textures.exists(`${layer.textureKey}-${desired}`)){
        layer.image.setTexture(`${layer.textureKey}-${desired}`);
      }
    }
    this.syncLayers();
    return true;
  }
  wait(ms) {
    return new Promise(resolve => {
      if(this.disposed || !this.scene.sys.isActive()) return resolve(false);
      const event=this.scene.time.delayedCall(ms,()=>{this.delays.delete(event);resolve(true)});
      this.delays.add(event);
    });
  }
  async playRecipe(recipe, duration=900, {afterFrame}={}) {
    if(this.disposed) return false;
    const frames=ANIMATION_RECIPES[recipe] || ANIMATION_RECIPES.look;
    const token=++this.animationToken;
    const total=Math.max(320,duration);
    for(let i=0;i<frames.length;i++){
      if(this.disposed || token!==this.animationToken) return false;
      const frame=frames[i];
      this.setPose(frame.pose);
      if(afterFrame) afterFrame(i,frame);
      const ok=await this.wait(Math.max(70,total*frame.weight));
      if(!ok || this.disposed || token!==this.animationToken)return false;
    }
    return true;
  }
  stop(held=false) {
    this.animationToken++;
    this.rest(held);
  }
  dispose() {
    this.disposed=true;
    this.animationToken++;
    for(const slot of [...this.layers.keys()])this.removeLayer(slot);
    this.delays?.clear();
  }
}
