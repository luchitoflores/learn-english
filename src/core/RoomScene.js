import Phaser from 'phaser';
import { ACTIONS } from '../data/actions.js';
import { speak } from './audio.js';

export class RoomScene extends Phaser.Scene {
  constructor(){ super({key:'RoomScene'}); this.pointerObject=null; }
  init(data){this.controller=data.controller;this.room=this.controller.getRoom(data.roomId);this.roomId=data.roomId;}
  preload(){
    const prefix=import.meta.env.BASE_URL+'assets/';
    for(const key of ['bedroom','living','kitchen'])this.load.image(`room-${key}`,`${prefix}rooms/${key}.png`);
    for(const key of ['lamp','book','backpack','jacket','shoes','phone','pillow','cup','apple','kettle','plate','spoon','towel','remote','plant','keys','trash','picture','ball'])
      this.load.image(`obj-${key}`,`${prefix}objects/${key}.png`);
    for(const key of ['idle','walk1','walk2','crouch','reach','grab','sit','hold','use'])
      this.load.image(`hero-${key}`,`${prefix}hero/${key}.png`);
  }
  create(){
    this.cameras.main.setBackgroundColor('#222c45');
    this.add.image(640,360,`room-${this.room.background}`).setDepth(0);
    const dust=this.add.particles(640,280,'obj-plant',{
       x:{min:-490,max:490},y:{min:-180,max:190},speedX:{min:-6,max:8},speedY:{min:-11,max:-2},
       scale:{start:.006,end:0},alpha:{start:.22,end:0},lifespan:5400,frequency:700,blendMode:'ADD'
    }); dust.setDepth(1);
    this.objects=new Map();this.glows=new Map();
    this.room.objects.forEach(obj=>this.createObject(obj));
    const startX=this.controller.lastHeroX ?? (this.roomId==='bedroom'?513:640);
    this.hero=this.add.sprite(startX,631,'hero-idle').setOrigin(.5,1).setDisplaySize(126,160).setDepth(14);
    this.hero.setInteractive(new Phaser.Geom.Rectangle(50,4,120,194),Phaser.Geom.Rectangle.Contains);
    this.hero.on('pointerdown',()=>this.controller.toast('Toca un objeto para descubrir acciones.'));
    if(!this.anims.exists('hero-walking'))this.anims.create({key:'hero-walking',frames:[{key:'hero-walk1'},{key:'hero-walk2'}],frameRate:7,repeat:-1});
    this.handSprite=this.add.image(startX+29,538,'obj-book').setDisplaySize(42,42).setDepth(16).setVisible(false);
    this.drawDoors();
    this.input.on('pointerdown',(pointer,targets)=>{
      if(targets.length||this.controller.editorActive||this.busy)return;
      if(pointer.y>=590 && pointer.y<690)this.walkTo(Phaser.Math.Clamp(pointer.x,75,1200));
    });
    this.keys=this.input.keyboard.addKeys('A,D,LEFT,RIGHT');
    this.controller.onRoomReady(this);
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
      if(this.busy)return;
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
    this.room.exits.forEach(exit=>{
      const direction=exit.x>640?'→':'←';
      const frame=this.add.rectangle(exit.x,496,48,170,0x1e2339,.6).setStrokeStyle(2,0xe0bea6,.7).setDepth(18);
      const text=this.add.text(exit.x,468,`${direction}\n${exit.label}`,{
        fontSize:'17px',fontFamily:'Arial',fontStyle:'bold',color:'#f9dfaf',align:'center',
        stroke:'#25273c',strokeThickness:4
      }).setOrigin(.5).setDepth(19);
      frame.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.controller.switchRoom(exit.to));
      text.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.controller.switchRoom(exit.to));
    });
  }
  async walkTo(x){
    if(this.busy)return;
    const dist=Math.abs(this.hero.x-x);
    if(dist<8)return;
    this.busy=true;
    this.hero.setFlipX(x<this.hero.x);
    this.hero.play('hero-walking');
    await new Promise(resolve=>this.tweens.add({targets:this.hero,x,duration:Math.max(180,Math.min(2200,dist*2.5)),ease:'Linear',onUpdate:()=>this.updateHand(),onComplete:resolve}));
    this.hero.stop();this.hero.setTexture('hero-idle');this.updateHand();this.busy=false;
  }
  updateHand(){if(this.handSprite){this.handSprite.setPosition(this.hero.x+(this.hero.flipX?-23:28),this.hero.y-86)}}
  async animateAction(obj,phrase,{preview=false}={}){
    if(this.busy)return false;
    const action=ACTIONS[phrase.action];if(!action)return false;
    const goal=Phaser.Math.Clamp(obj.x+(obj.x<this.hero.x?92:-92),80,1200);
    await this.walkTo(goal);
    this.busy=true;
    this.hero.setFlipX(obj.x<this.hero.x);
    const pose=({pickup:'crouch',place:'reach',switch:'use',open:'use',dress:'hold',sit:'sit',look:'use',clean:'crouch',eat:'hold',walk:'walk1'})[action.recipe]||'use';
    this.hero.setTexture(`hero-${pose}`);
    await new Promise(resolve=>this.time.delayedCall(Math.max(380,action.duration*.62),resolve));
    if(!preview){
      if(action.effects.held===true)for(const other of this.room.objects)if(other.id!==obj.id && other.state.held){other.state.held=false;this.updateObject(other)}
      Object.assign(obj.state,action.effects);this.updateObject(obj);
    }
    if(action.recipe==='switch'){this.cameras.main.flash(120,255,210,162,false)}
    this.hero.setTexture(obj.state.held?'hero-hold':'hero-idle');this.updateHand();
    this.busy=false;
    return true;
  }
  async previewAction(obj,phrase){return this.animateAction(obj,phrase,{preview:true})}
  async executeAction(obj,phrase){return this.animateAction(obj,phrase,{preview:false})}
  update(_time,delta){
    if(!this.hero||this.busy||this.controller.editorActive)return;
    const left=this.keys.A.isDown||this.keys.LEFT.isDown||this.controller.movement<0;
    const right=this.keys.D.isDown||this.keys.RIGHT.isDown||this.controller.movement>0;
    if(left||right){
      const sign=right?1:-1;
      this.hero.x=Phaser.Math.Clamp(this.hero.x+sign*(delta*.31),60,1210);
      this.hero.setFlipX(sign<0);
      if(!this.hero.anims.isPlaying)this.hero.play('hero-walking');
      this.updateHand();
    }else if(this.hero.anims.isPlaying){this.hero.stop();this.hero.setTexture('hero-idle')}
  }
}
