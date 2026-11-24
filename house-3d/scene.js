import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { asset, rooms, stations } from './data.js';
const adventurers = 'KayKit_Adventurers_2.0_FREE';
const rig = `${adventurers}/Animations/gltf/Rig_Medium/Rig_Medium_`;
const gltfLoader = new GLTFLoader();
const models = new Map();
const boxGeometry = new THREE.BoxGeometry();
const materials = new Map();
const drawerTravel = 1.03;

function makeHand(camera) {
  const root = group(camera, 0.13, -0.19, -0.48);
  const skin = new THREE.MeshStandardMaterial({ color: 0xd6a37e });
  const sleeve = new THREE.MeshStandardMaterial({ color: 0x166397 });
  const capsule = (radius, length, material, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 3, 7), material);
    mesh.position.set(x, y, z);
    mesh.rotation.x = Math.PI / 2;
    root.add(mesh);
    return mesh;
  };
  capsule(0.048, 0.33, sleeve, 0.02, -0.018, 0.18);
  capsule(0.035, 0.075, skin, 0, 0, -0.035);
  const fingers = [-0.027, -0.01, 0.009, 0.026].map((x, i) =>
    capsule(0.009, 0.037 - Math.abs(i - 1) * 0.004, skin, x, 0, -0.103));
  const thumb = capsule(0.012, 0.034, skin, -0.04, -0.005, -0.056);
  thumb.rotation.z = -0.65;
  root.rotation.y = -0.26;
  root.visible = false;
  return { root, fingers };
}

async function fetchModel(path) {
  if (!path.endsWith('.obj')) return gltfLoader.loadAsync(asset(path));
  const material = await new MTLLoader().loadAsync(asset(path.replace(/\.obj$/, '.mtl')));
  return { scene: await new OBJLoader().setMaterials(material).loadAsync(asset(path)) };
}

function loadModel(path) {
  if (!models.has(path)) {
    models.set(path, fetchModel(path).catch(error => {
      models.delete(path);
      throw error;
    }));
  }
  return models.get(path);
}

function block(parent, x, y, z, width, height, depth, color) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color }));
  const mesh = new THREE.Mesh(boxGeometry, materials.get(color));
  mesh.position.set(x, y, z);
  mesh.scale.set(width, height, depth);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function group(parent, x = 0, y = 0, z = 0) {
  const child = new THREE.Group();
  child.position.set(x, y, z);
  parent.add(child);
  return child;
}

function normalize(model, size) {
  const bounds = new THREE.Box3().setFromObject(model);
  const dimensions = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = size / Math.max(dimensions.x, dimensions.y, dimensions.z);
  model.scale.multiplyScalar(scale);
  model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  model.traverse(node => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
}

function makeFurniture(parent, config, id) {
  const { x, z, width: w, height: h, depth: d, base, color, drawer, lid } = config;
  const root = group(parent, x, base, z);
  root.userData.station = id;
  if (drawer || lid) {
    const support = group(root);
    block(support, 0, -base / 2, 0, w + 0.12, base, d + 0.12, lid ? 0x6e5944 : 0x785744);
    if (drawer) block(support, 0, h + 0.1, 0, w + 0.2, 0.17, d + 0.2, 0xeeeecc);
  }
  const contents = group(root);
  const hinge = drawer ? contents : group(root, lid ? 0 : -w / 2, lid ? h : 0, lid ? -d / 2 : d / 2);
  const wood = drawer ? hinge : root;
  const edges = drawer || lid ? h * 0.76 : h;
  block(wood, -w / 2, edges / 2, 0, 0.1, edges, d, color);
  block(wood, w / 2, edges / 2, 0, 0.1, edges, d, color);
  block(wood, 0, edges / 2, -d / 2, w, edges, 0.09, color);
  block(wood, 0, 0.055, 0, w, 0.11, d, color);

  if (drawer) {
    block(hinge, 0, h / 2, d / 2, w + 0.08, h, 0.12, color);
    block(hinge, 0, h / 2, d / 2 + 0.1, 0.38, 0.08, 0.1, 0x393839);
  } else if (lid) {
    block(hinge, 0, 0, d / 2, w + 0.08, 0.1, d + 0.06, color);
    block(hinge, 0, 0.11, d / 2, 0.42, 0.18, 0.14, 0x42372b);
  } else {
    block(root, 0, h - 0.045, 0, w, 0.1, d, color);
    for (let index = 1; index <= config.shelves; index++) {
      block(root, 0, h * index / (config.shelves + 1), 0, w, 0.06, d, 0xfaf2dc);
    }
    block(hinge, w / 2, h / 2, 0, w, h, 0.11, color);
    block(hinge, w - 0.22, h / 2, 0.105, 0.07, 0.3, 0.12, 0xf7e9cf);
    if (id === 'medkit') {
      block(hinge, w / 2, h / 2, 0.06, 0.33, 0.095, 0.025, 0xfff8ec);
      block(hinge, w / 2, h / 2, 0.06, 0.095, 0.33, 0.025, 0xfff8ec);
    }
  }
  return { root, contents, hinge, config };
}

function itemPosition(config, index) {
  const rows = config.shelves ? config.shelves + 1 : 2;
  const columns = Math.ceil(config.items.length / rows);
  const row = Math.floor(index / columns);
  const x = ((index % columns + 0.5) / columns - 0.5) * config.width * 0.84;
  const height = config.shelves
    ? row === 0 ? 0.11 : row * config.height / rows + 0.034
    : config.drawer ? 0.26 : 0.18;
  return new THREE.Vector3(x, height,
    config.shelves ? 0.03 : row ? 0.29 : -0.2);
}

export class HouseScene {
  constructor(viewport, onStation) {
    this.viewport = viewport;
    this.camera = new THREE.OrthographicCamera(-5, 5, 3, -3, 0.1, 65);
    this.camera.position.set(7, 6.4, 10);
    this.camera.lookAt(0, 0.85, -0.35);
    this.world = new THREE.Scene();
    this.detailCamera = new THREE.PerspectiveCamera(52, 1, 0.035, 65);
    this.world.add(this.detailCamera);
    this.hand = makeHand(this.detailCamera);
    this.activeCamera = this.camera;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    viewport.prepend(this.renderer.domElement);
    const light = new THREE.DirectionalLight(0xffefdc, 2.5);
    light.position.set(-3, 8, 5);
    light.castShadow = true;
    Object.assign(light.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.normalBias = 0.025;
    this.world.add(light, new THREE.HemisphereLight(0xfffbec, 0x827d9c, 2));
    this.hero = group(this.world, 0, 0, 1.25);
    this.hero.rotation.y = 0.28;
    this.actions = new Map();
    this.stationViews = new Map();
    this.itemViews = new Map();
    this.pendingTweens = [];
    this.resizeObserver = new ResizeObserver(() => this.resize(viewport));
    this.resizeObserver.observe(viewport);
    this.resize(viewport);
    this.renderer.domElement.addEventListener('click', event => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const point = new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1,
        1 - (event.clientY - rect.top) / rect.height * 2);
      const ray = new THREE.Raycaster();
      ray.setFromCamera(point, this.activeCamera);
      const hit = ray.intersectObjects([...this.stationViews.values()].map(view => view.root))[0];
      for (let node = hit?.object; node; node = node.parent) {
        if (node.userData.station) {
          onStation(node.userData.station);
          break;
        }
      }
    });
    let previous = performance.now();
    this.renderer.setAnimationLoop(now => {
      const dt = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      this.mixer?.update(dt);
      this.partnerMixer?.update(dt);
      this.pendingTweens = this.pendingTweens.filter(tween => {
        const progress = Math.min(1, (tween.elapsed += dt) / tween.seconds);
        tween.update(progress * progress * (3 - 2 * progress));
        if (progress === 1) tween.resolve();
        return progress < 1;
      });
      this.renderer.render(this.world, this.activeCamera);
    });
  }

  resize(viewport) {
    const width = viewport.clientWidth || 360;
    const height = viewport.clientHeight || 340;
    const aspect = width / height;
    const span = this.studio ? Math.max(1.5, 1.8 / aspect) : Math.max(3.25, 5 / aspect);
    Object.assign(this.camera, { left: -span * aspect, right: span * aspect, top: span, bottom: -span });
    this.camera.updateProjectionMatrix();
    this.detailCamera.aspect = aspect;
    this.detailCamera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  async loadCharacter() {
    const [character, general, movement] = await Promise.all([
      loadModel(`${adventurers}/Characters/gltf/Ranger.glb`),
      loadModel(rig + 'General.glb'),
      loadModel(rig + 'MovementBasic.glb'),
    ]);
    const figure = character.scene;
    normalize(figure, 1.68);
    this.hero.add(figure);
    this.mixer = new THREE.AnimationMixer(figure);
    const clips = [...character.animations, ...general.animations, ...movement.animations];
    for (const name of ['Idle_A', 'Walking_A', 'Interact', 'PickUp']) {
      const clip = clips.find(entry => entry.name === name);
      if (!clip) throw new Error(`Falta la animación ${name}`);
      this.actions.set(name, this.mixer.clipAction(clip));
    }
    this.play('Idle_A');
  }

  play(name, loop = true) {
    const action = this.actions.get(name);
    if (!action) return 0.45;
    if (this.activeAction !== action) this.activeAction?.fadeOut(0.14);
    action.reset().setEffectiveWeight(1).setEffectiveTimeScale(1);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = !loop;
    action.fadeIn(0.14).play();
    this.activeAction = action;
    return action.getClip().duration;
  }

  async previewMotion({ pack, clip, start, hold, distance }) {
    this.hidePartner();
    if (!this.mixer) return;
    const path = `KayKit_Character_Animations_1.1/Animations/gltf/Rig_Medium/Rig_Medium_${pack}.glb`;
    const { animations } = await loadModel(path);
    for (const name of [clip, start, hold].filter(Boolean)) {
      if (this.actions.has(name)) continue;
      const animation = animations.find(entry => entry.name === name);
      if (!animation) throw new Error(`Falta la animación ${name}`);
      this.actions.set(name, this.mixer.clipAction(animation));
    }
    const baseZ = this.studio ? 0 : 1.25;
    this.hero.position.set(0, 0, baseZ);
    this.hero.rotation.y = distance ? 0.82 : 0.28;
    if (start && this.activeAction !== this.actions.get(start)) {
      this.play(start);
      await this.tween(0.28, () => {});
    }
    const duration = this.play(clip, false);
    await this.tween(Math.max(0.32, duration), progress => {
      if (!distance) return;
      this.hero.position.x = distance * Math.sin(this.hero.rotation.y) * progress;
      this.hero.position.z = baseZ + distance * Math.cos(this.hero.rotation.y) * progress;
    });
    this.play(hold || 'Idle_A');
  }

  hidePartner() {
    if(this.partner) this.partner.visible=false;
    this.partnerMixer?.stopAllAction();
  }

  async previewGreeting(far=false) {
    if(!this.studio || !this.mixer) throw new Error('Studio not ready');
    if(!this.partner){
      const [character,general,simulation]=await Promise.all([
        loadModel(`${adventurers}/Characters/gltf/Mage.glb`),loadModel(rig+'General.glb'),loadModel(rig+'Simulation.glb')]);
      const figure=character.scene;
      normalize(figure,1.68);
      this.partner=group(this.world);this.partner.add(figure);
      this.partnerMixer=new THREE.AnimationMixer(figure);
      this.partnerIdle=this.partnerMixer.clipAction(general.animations.find(c=>c.name==='Idle_A'));
      this.partnerWave=this.partnerMixer.clipAction(simulation.animations.find(c=>c.name==='Waving'));
    }
    const {animations}=await loadModel(rig+'Simulation.glb');
    if(!this.actions.has('Waving'))this.actions.set('Waving',this.mixer.clipAction(animations.find(c=>c.name==='Waving')));
    const gap=far?2.8:1.25;
    this.hero.position.set(-gap/2,0,0);this.hero.rotation.y=Math.PI/2;
    this.partner.position.set(gap/2,0,0);this.partner.rotation.y=-Math.PI/2;this.partner.visible=true;
    this.partnerMixer.stopAllAction();this.partnerIdle.reset().play();
    const duration=this.play('Waving',false);
    await this.tween(duration,()=>{});this.play('Idle_A');
    this.partnerIdle.stop();this.partnerWave.reset().setLoop(THREE.LoopOnce,1).play();
    await this.tween(this.partnerWave.getClip().duration,()=>{});
    this.partnerWave.stop();this.partnerIdle.reset().play();
  }

  setRoom(id) {
    this.hidePartner();
    this.studio = false;
    this.exitDetail();
    this.camera.position.set(7, 6.4, 10);
    this.camera.lookAt(0, 0.85, -0.35);
    this.resize(this.viewport);
    const room = rooms[id];
    this.clearItems();
    this.room?.removeFromParent();
    const floor = this.room = group(this.world);
    this.world.background = new THREE.Color(room.color).lerp(new THREE.Color(0xf5f4e9), 0.65);
    this.stationViews.clear();
    this.hero.position.set(0, 0, 1.25);
    this.hero.rotation.y = 0.28;
    block(floor, 0, -0.14, 0, 9.2, 0.28, 6, room.floor);
    block(floor, 0, 1.57, -3, 9.2, 3.14, 0.18, room.color);
    block(floor, -4.55, 1.57, -0.64, 0.18, 3.14, 4.72, room.color);
    block(floor, 0, 0.1, -2.88, 9.15, 0.2, 0.07, 0xf6ecdb);
    block(floor, -4.42, 0.1, -0.64, 0.07, 0.2, 4.67, 0xf6ecdb);
    for (let x = -4; x <= 4; x++) block(floor, x, 0.006, 0, 0.012, 0.012, 5.8, 0xd7cbb7);
    for (let z = -2; z <= 2; z++) block(floor, 0, 0.006, z, 9, 0.012, 0.012, 0xd7cbb7);
    const window = group(floor, 0.3, 2.02, -2.88);
    block(window, 0, 0, 0, 1.27, 1.13, 0.08, 0xf8f1dc);
    block(window, -0.28, 0, 0.056, 0.51, 0.91, 0.04, 0x9ac7d7);
    block(window, 0.28, 0, 0.056, 0.51, 0.91, 0.04, 0x9ac7d7);
    for (const key of room.stations) this.stationViews.set(key, makeFurniture(floor, stations[key], key));
    for (const [path, x, z, size] of room.props) {
      loadModel(path).then(gltf => {
        if (this.room !== floor) return;
        const model = gltf.scene.clone();
        normalize(model, size);
        group(floor, x, 0, z).add(model);
      }).catch(console.warn);
    }
  }

  setStudio() {
    this.hidePartner();
    this.studio = true;
    this.exitDetail();
    this.clearItems();
    this.stationViews.clear();
    this.room?.removeFromParent();
    const stage = this.room = group(this.world);
    this.world.background = new THREE.Color(0xdbe8dc);
    block(stage, 0, -0.12, 0, 10, 0.24, 10, 0xc1d2bd);
    block(stage, 0, -0.013, 0, 4.5, 0.025, 3, 0xecdfc8);
    this.camera.position.set(3.1, 2.7, 7.6);
    this.camera.lookAt(0, 0.78, 0);
    this.resize(this.viewport);
    this.hero.position.set(0, 0, 0);
    this.hero.rotation.y = 0.28;
    this.play('Idle_A');
  }

  tween(seconds, update) {
    return new Promise(resolve => this.pendingTweens.push({ seconds, elapsed: 0, update, resolve }));
  }

  async walkTo(id) {
    const { x, z, depth } = stations[id];
    const origin = this.hero.position.clone();
    const target = new THREE.Vector3(x, 0, z + depth / 2 + 0.95);
    const direction = target.clone().sub(origin);
    if (direction.length() > 0.08) {
      this.hero.rotation.y = Math.atan2(direction.x, direction.z);
      this.play('Walking_A');
      await this.tween(Math.min(1.5, Math.max(0.45, direction.length() / 2.65)),
        t => this.hero.position.lerpVectors(origin, target, t));
    }
    this.hero.rotation.y = Math.PI;
    this.play('Idle_A');
  }

  async setOpen(id, open, outside) {
    const view = this.stationViews.get(id);
    if (open) {
      await this.walkTo(id);
      this.createItems(view, outside);
      await this.enterDetail(view.config);
    }
    this.play('Interact', false);
    await this.tween(0.58, t => {
      this.reach(t, true);
      const progress = open ? t : 1 - t;
      if (view.config.drawer) view.hinge.position.z = drawerTravel * progress;
      else if (view.config.lid) view.hinge.rotation.x = -1.63 * progress;
      else view.hinge.rotation.y = -1.75 * progress;
    });
    this.play('Idle_A');
    if (!open) {
      this.clearItems();
      this.exitDetail();
    }
  }

  enterDetail({ x, z, width, depth, base, height, drawer }) {
    const y = base + height * 0.58;
    const origin = this.camera.position.clone();
    const fromLook = new THREE.Vector3(0, 0.85, -0.35);
    const target = new THREE.Vector3(x + 0.17, y + (drawer ? 1.2 : 0.66), z + depth / 2 + Math.max(1.42, height * 0.78));
    const look = new THREE.Vector3(x + (matchMedia('(min-width: 861px)').matches ? width * 0.46 : 0), y, z + 0.12);
    const currentLook = new THREE.Vector3();
    this.hero.visible = false;
    this.activeCamera = this.detailCamera;
    return this.tween(0.64, t => {
      this.detailCamera.position.lerpVectors(origin, target, t);
      this.detailCamera.lookAt(currentLook.lerpVectors(fromLook, look, t));
      this.hand.root.visible = t > 0.85;
    });
  }

  exitDetail() {
    this.activeCamera = this.camera;
    this.hand.root.visible = false;
    this.hero.visible = true;
  }

  reach(progress, grab) {
    const amount = Math.sin(progress * Math.PI);
    this.hand.root.position.set(0.13 - amount * 0.22, -0.19 + amount * 0.09, -0.48 - amount * 0.33);
    this.hand.root.rotation.y = -0.26 - amount * 0.25;
    for (const finger of this.hand.fingers) finger.rotation.x = Math.PI / 2 - (grab ? amount * 1.05 : 0);
  }

  createItems(view, outside) {
    view.config.items.forEach((entry, index) => {
      const parent = group(view.contents);
      const inside = itemPosition(view.config, index);
      const x = (index % 5 - 2) * 0.39;
      const tray = new THREE.Vector3(x, 0.1 - view.config.base,
        view.config.depth / 2 + 1.15 + Math.floor(index / 5) * 0.45 - (view.config.drawer ? drawerTravel : 0));
      parent.position.copy(outside.has(entry.id) ? tray : inside);
      loadModel(entry.model).then(({ scene }) => {
        if (!parent.parent) return;
        const model = scene.clone();
        normalize(model, 0.32);
        parent.add(model);
      }).catch(console.warn);
      this.itemViews.set(entry.id, { parent, inside, tray });
    });
  }

  async thumbnail(path) {
    this.thumbnails ??= new Map();
    if (!this.thumbnails.has(path)) {
      const pending = loadModel(path).then(({ scene }) => {
        if (!this.thumbnailRenderer) {
          this.thumbnailRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
          this.thumbnailRenderer.setSize(144, 144, false);
        }
        const world = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-0.63, 0.63, 0.63, -0.63, 0.1, 10);
        camera.position.set(1.6, 2, 2.6);
        camera.lookAt(0, 0.18, 0);
        const model = scene.clone();
        normalize(model, 0.94);
        const light = new THREE.DirectionalLight(0xfff2df, 2.4);
        light.position.set(-2, 4, 3);
        world.add(model, light, new THREE.HemisphereLight(0xfff9ec, 0x827d9c, 2));
        this.thumbnailRenderer.render(world, camera);
        return this.thumbnailRenderer.domElement.toDataURL();
      }).catch(error => {
        this.thumbnails.delete(path);
        throw error;
      });
      this.thumbnails.set(path, pending);
    }
    return this.thumbnails.get(path);
  }

  clearItems() {
    for (const { parent } of this.itemViews.values()) parent.removeFromParent();
    this.itemViews.clear();
  }

  async moveItem(id, out, clip) {
    const view = this.itemViews.get(id);
    if (!view) return;
    this.hero.rotation.y = Math.PI - 0.32;
    const start = view.parent.position.clone();
    const end = out ? view.tray : view.inside;
    const duration = this.play(clip, false);
    const handTip = new THREE.Vector3();
    await this.tween(Math.max(0.68, duration), progress => {
      this.reach(progress, true);
      handTip.set(0, 0.016, -0.13);
      this.hand.root.localToWorld(handTip);
      view.parent.parent.worldToLocal(handTip);
      if (progress < 0.43) view.parent.position.lerpVectors(start, handTip, progress / 0.43);
      else if (progress < 0.57) view.parent.position.copy(handTip);
      else view.parent.position.lerpVectors(handTip, end, (progress - 0.57) / 0.43);
    });
    this.play('Idle_A');
  }
}
