import Phaser from 'phaser';
import { ACTIONS } from '../data/actions.js';
import { speak } from './audio.js';
import { CharacterAnimator } from './CharacterAnimator.js';

export class RoomScene extends Phaser.Scene {
  constructor(){ super({key:'RoomScene'}); this.pointerObject=null; }
  init(data){this.controller=data.controller;this.room=this.controller.getRoom(data.roomId);this.roomId=data.roomId;this.busy=false;this.isLeaving=false;}
  preload(){
    const prefix=import.meta.env.BASE_URL+'assets/';
    for(const key of ['bedroom','living','kitchen'])this.load.image(`room-${key}`,`${prefix}rooms/${key}.png`);
    for(const key of ['lamp','book','backpack','jacket','shoes','phone','pillow','cup','apple','kettle','plate','spoon','towel','remote','plant','keys','trash','picture','ball'])
      this.load.image(`obj-${key}`,`${prefix}objects/${key}.png`);
    for(const key of ['idle','walk1','walk2','crouch','reach','grab','sit','hold','use'])
      this.load.image(`hero-${key}`,`${prefix}hero/${key}.png`);
    this.controller.avatarFactory?.queueTextures(this.load,this.controller.avatar);
  }
  create(){
    this.cameras.main.setBackgroundColor('#222c45');
    this.backgroundArt=this.add.image(640,360,`room-${this.room.background}`).setDepth(0);
    const dust=this.add.particles(640,280,'obj-plant',{
       x:{min:-490,max:490},y:{min:-180,max:190},speedX:{min:-6,max:8},speedY:{min:-11,max:-2},
       scale:{start:.006,end:0},alpha:{start:.22,end:0},lifespan:5400,frequency:700,blendMode:'ADD'
    }); dust.setDepth(1);
    this.objects=new Map();this.glows=new Map();
    this.room.objects.forEach(obj=>this.createObject(obj));
    this.stationArt=[];this.drawStations();
    const startX=this.controller.entryX ?? (this.roomId==='bedroom'?513:640);
    this.controller.entryX=null;
    const desiredKey=this.controller.avatarFactory?.profileKey(this.controller.avatar)||'hero-idle';
    const avatarKey=this.textures.exists(desiredKey)?desiredKey:'hero-idle';
    this.hero=this.add.sprite(startX,631,avatarKey).setOrigin(.5,1)
      .setDisplaySize(avatarKey==='hero-idle'?126:95,avatarKey==='hero-idle'?160:205).setDepth(14);
    this.hero.setInteractive({useHandCursor:true});
    this.hero.on('pointerdown',()=>this.controller.toast('Toca un objeto para descubrir acciones.'));
    this.character=new CharacterAnimator(this,this.hero,this.controller.makeAvatarProfile()||undefined);
    this.handSprite=this.add.image(startX+29,538,'obj-book').setDisplaySize(42,42).setDepth(16).setVisible(false);
    this.updateHand();
    this.drawDoors();
    this.input.on('pointerdown',(pointer,targets)=>{
      if(targets.length||this.controller.editorActive||this.busy||this.isLeaving)return;
      // Touch coordinates are viewport pixels, not world coordinates, when
      // the mobile camera zooms and follows the character.
      const ground=this.cameras.main.getWorldPoint(pointer.x,pointer.y);
      if(ground.y>=530 && ground.y<=719)this.walkTo(Phaser.Math.Clamp(ground.x,75,1200));
    });
    this.keys=this.input.keyboard.addKeys('A,D,LEFT,RIGHT');
    this.configureCamera(true);
    this.scale.on('resize',this.configureCamera,this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      this.scale.off('resize',this.configureCamera,this);
    });
    this.controller.onRoomReady(this);
  }
  configureCamera(immediate=true){
    if(!this.hero?.active)return;
    const camera=this.cameras.main;
    const width=this.scale.width||this.game.canvas.width;
    const height=this.scale.height||this.game.canvas.height;
    const mobile=window.matchMedia('(max-width: 760px)').matches;
    const portrait=window.matchMedia('(orientation: portrait)').matches;
    // Desktop: see the complete scene. Mobile: show an enlarged slice so
    // hands, objects and movement remain legible and the camera pans with the hero.
    const zoom=mobile
      ? (portrait?Math.max(width/690,height/540):Math.max(width/1100,height/660))
      : Math.min(width/1280,height/720);
    camera.setSize(width,height);
    camera.setZoom(Phaser.Math.Clamp(zoom,.30,2.5));
    camera.setBounds(0,0,1280,720);
    this.followCharacter(immediate);
  }
  followCharacter(immediate=false){
    if(!this.hero?.active)return;
    const camera=this.cameras.main;
    const viewW=camera.width/camera.zoom;
    const viewH=camera.height/camera.zoom;
    const x=Phaser.Math.Clamp(this.hero.x-viewW/2,0,Math.max(0,1280-viewW));
    // Keep the floor, accessible furniture and doors in the mobile viewport.
    const y=Phaser.Math.Clamp(505-viewH/2,0,Math.max(0,720-viewH));
    if(immediate)camera.setScroll(x,y);
    else camera.setScroll(Phaser.Math.Linear(camera.scrollX,x,.22),Phaser.Math.Linear(camera.scrollY,y,.22));
  }
  drawStations(){
    if(this.roomId!=='bedroom')return;
    // Keep the art illustrated: no flat vector mirror or frame overlays.
    const label=this.add.text(950,280,'MIRROR · ESPEJO',{
      fontFamily:'Arial',fontSize:'16px',fontStyle:'bold',
      color:'#fff0d1',backgroundColor:'#232b40dd',
      padding:{x:10,y:7}
    }).setOrigin(.5).setDepth(20);
    label.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
      const mirror=this.room.objects.find(o=>o.id==='mirror');
      if(mirror)this.controller.selectObject(mirror);
    });
    this.stationArt.push(label);
  }
  refreshAvatar(){
    if(!this.hero?.active||!this.controller.avatarFactory)return;
    const key=this.controller.avatarFactory.profileKey(this.controller.avatar);
    if(!this.textures.exists(key))return;
    this.character.setSkin(this.controller.makeAvatarProfile());
    this.hero.setDisplaySize(95,205);
    this.character.rest(this.room.objects.some(o=>o.state.held));
    this.updateHand();
  }
  createObject(obj){
    let sprite;
    if(obj.passive){
      // Existing architecture is part of the painted background. Hitboxes remain interactive.
      sprite=this.add.zone(obj.x,obj.y,obj.size*1.45,obj.size*1.2).setInteractive();
    }else{
      sprite=this.add.image(obj.x,obj.y,`obj-${obj.kind}`).setOrigin(.5,1).setDisplaySize(obj.size,obj.size);
      sprite.setInteractive({pixelPerfect:false,useHandCursor:true});
      sprite.setDepth((obj.y>570?13:8));
    }
    const ring=this.add.ellipse(obj.x,obj.y-(obj.passive?10:obj.size*.2),obj.size*.82,obj.size*.40,0xf7d2a4,.12)
      .setStrokeStyle(2,0xf6d5ab,.45).setDepth(obj.y>570?12:7).setVisible(false);
    const label=this.add.text(obj.x,obj.y-obj.size*.84-15,obj.name.toUpperCase(),{
      fontFamily:'Arial, sans-serif',fontSize:'17px',fontStyle:'bold',color:'#fff6d8',
      backgroundColor:'#22263ecc',padding:{x:10,y:6},align:'center'
    }).setOrigin(.5).setDepth(25).setVisible(false);
    const over=()=>{ring.setVisible(true);label.setVisible(true)};
    const out=()=>{ring.setVisible(false);label.setVisible(false)};
    sprite.on('pointerover',over);sprite.on('pointerout',out);
    sprite.on('pointerdown',()=>{
      if(this.controller.editorActive){this.controller.toast(`${obj.id}: arrastra para mover`);return;}
      if(this.busy||this.isLeaving)return;
      speak(obj.name);
      this.controller.selectObject(obj);
    });
    sprite.on('drag',(_pointer,x,y)=>{
      if(!this.controller.editorActive)return;
      obj.x=Phaser.Math.Clamp(x,30,1250);obj.y=Phaser.Math.Clamp(y,50,620);
      sprite.setPosition(obj.x,obj.y);ring.setPosition(obj.x,obj.y-(obj.passive?10:obj.size*.2));label.setPosition(obj.x,obj.y-obj.size*.84-15);
    });
    this.input.setDraggable(sprite);
    this.objects.set(obj.id,{sprite,label});this.glows.set(obj.id,ring);
    this.updateObject(obj);
  }
  updateObject(obj){
    const node=this.objects.get(obj.id);if(!node)return;
    if(!obj.passive){
      const hidden=obj.state.held||obj.state.stored||obj.state.worn||obj.state.discarded;
      node.sprite.setVisible(!hidden);
      if(obj.state.on)node.sprite.setTint(0xffd8a0);else node.sprite.clearTint();
      if(obj.state.cut)node.sprite.setAngle(-15);else node.sprite.setAngle(0);
      if(obj.state.clean||obj.state.made)node.sprite.setAlpha(.9);
    }
    const currentlyHeld=this.room.objects.find(o=>o.state.held);
    this.handSprite?.setTexture(`obj-${currentlyHeld?.kind || 'book'}`)?.setVisible(!!currentlyHeld);
  }
  drawDoors(){
    this.doorGraphics=[];
    this.room.exits.forEach(exit=>{
      const direction=exit.x>640?'→':'←';
      const frame=this.add.rectangle(exit.x,496,48,170,0x1e2339,.6).setStrokeStyle(2,0xe0bea6,.7).setDepth(18);
      const text=this.add.text(exit.x,468,`${direction}\n${exit.label}`,{
        fontSize:'17px',fontFamily:'Arial',fontStyle:'bold',color:'#f9dfaf',align:'center',
        stroke:'#25273c',strokeThickness:4
      }).setOrigin(.5).setDepth(19);
      const leave=()=>this.goThroughDoor(exit);
      frame.setInteractive({useHandCursor:true}).on('pointerdown',leave);
      text.setInteractive({useHandCursor:true}).on('pointerdown',leave);
      this.doorGraphics.push(frame,text);
    });
  }
  // Change the visible room IN PLACE. This prevents Phaser scene-restart races
  // where the room label changes but old background and clickable objects stay.
  changeRoom(roomId,entryX=640){
    if(!this.sys.isActive()||this.busy)return false;
    const next=this.controller.getRoom(roomId);
    if(!next)return false;
    for(const {sprite,label} of this.objects.values()){
      sprite.destroy();label.destroy();
    }
    for(const ring of this.glows.values())ring.destroy();
    for(const display of this.doorGraphics||[])display.destroy();
    for(const display of this.stationArt||[])display.destroy();
    this.objects.clear();
    this.glows.clear();
    this.doorGraphics=[];
    this.room=next;
    this.roomId=roomId;
    this.backgroundArt.setTexture(`room-${next.background}`);
    this.hero.setPosition(Phaser.Math.Clamp(entryX,75,1200),631);
    this.character.stop(false);
    this.handSprite.setTexture('obj-book').setVisible(false);
    next.objects.forEach(obj=>this.createObject(obj));
    this.stationArt=[];this.drawStations();
    this.drawDoors();
    this.isLeaving=false;
    this.updateHand();
    this.configureCamera(true);
    return true;
  }
  async goThroughDoor(exit){
    if(this.isLeaving)return;
    if(this.busy){this.controller.toast('Termina primero la acción actual.');return;}
    this.isLeaving=true;
    const arrived=await this.walkTo(exit.x<640?105:1175);
    if(arrived&&this.scene.isActive('RoomScene')){
      this.controller.switchRoom(exit.to,{fromRoom:this.roomId,throughDoor:true});
    }else{
      this.isLeaving=false;
    }
  }
  async walkTo(x){
    if(this.busy)return false;
    const dist=Math.abs(this.hero.x-x);
    if(dist<8)return true;
    this.busy=true;
    this.character.turn(x<this.hero.x);
    this.character.walk();
    await new Promise(resolve=>this.tweens.add({targets:this.hero,x,duration:Math.max(180,Math.min(2200,dist*2.5)),ease:'Linear',onUpdate:()=>this.updateHand(),onComplete:resolve}));
    if(!this.scene.isActive('RoomScene'))return false;
    this.character.rest(this.room.objects.some(o=>o.state.held));this.updateHand();this.busy=false;
    return true;
  }
  updateHand(){
    this.character?.syncLayers();
    if(this.handSprite){this.handSprite.setPosition(this.hero.x+(this.hero.flipX?-23:28),this.hero.y-86)}
  }
  async animateAction(obj,phrase,{preview=false}={}){
    if(this.busy)return false;
    const action=ACTIONS[phrase.action];if(!action)return false;
    const goal=Phaser.Math.Clamp(obj.x+(obj.x<this.hero.x?92:-92),80,1200);
    const arrived=await this.walkTo(goal);
    if(!arrived||!this.scene.isActive('RoomScene'))return false;
    this.busy=true;
    this.character.turn(obj.x<this.hero.x);
    const finished=await this.character.playRecipe(action.recipe,Math.max(380,action.duration*.62));
    if(!finished||!this.scene.isActive('RoomScene'))return false;
    if(!preview){
      const changes={
        shave_face:{beard:'none'},put_on_shirt:{outfit:'casual'},
        put_on_suit:{outfit:'formal'},take_off_shirt:{outfit:'home'},
        put_on_pajamas:{outfit:'pajamas'}
      }[phrase.action];
      if(changes)this.controller.updateAvatarAppearance(changes);
      if(action.effects.held===true)for(const other of this.room.objects)if(other.id!==obj.id && other.state.held){other.state.held=false;this.updateObject(other)}
      Object.assign(obj.state,action.effects);this.updateObject(obj);
    }
    if(action.recipe==='switch'){this.cameras.main.flash(120,255,210,162,false)}
    this.character.rest(this.room.objects.some(o=>o.state.held));this.updateHand();
    const facial={shave_face:'shave',brush_teeth:'brush',smile_face:'smile',
      cry_face:'cry',blink_eyes:'blink',shout_face:'shout'}[phrase.action];
    // Facial states need real PNG expressions; never switch to missing textures.
    // Shaving and clothing are implemented as persistent raster variant changes.
    if(facial && this.hero?.active){
      const originalAngle=this.hero.angle;
      this.hero.setAngle(facial==='cry'?-4:facial==='shout'?5:0);
      this.time.delayedCall(500,()=>{
        if(this.sys.isActive()&&this.hero?.active)this.hero.setAngle(originalAngle);
      });
    }
    this.busy=false;
    return true;
  }
  async previewAction(obj,phrase){return this.animateAction(obj,phrase,{preview:true})}
  async executeAction(obj,phrase){return this.animateAction(obj,phrase,{preview:false})}
  update(_time,delta){
    if(!this.hero)return;
    // Gentle body tilt makes the raster character respond to movement
    // until we have individually animated limb assets.
    if(this.hero.anims.isPlaying)this.hero.setAngle(Math.sin(_time*.013)*2);
    else if(!this.busy)this.hero.setAngle(0);
    this.followCharacter();
    if(this.busy||this.isLeaving||this.controller.editorActive)return;
    const left=this.keys.A.isDown||this.keys.LEFT.isDown||this.controller.movement<0;
    const right=this.keys.D.isDown||this.keys.RIGHT.isDown||this.controller.movement>0;
    if(left||right){
      const sign=right?1:-1;
      this.hero.x=Phaser.Math.Clamp(this.hero.x+sign*(delta*.31),60,1210);
      this.character.turn(sign<0);
      this.character.walk();
      this.updateHand();
    }else if(this.hero.anims.isPlaying){this.character.rest(this.room.objects.some(o=>o.state.held))}
  }
}
