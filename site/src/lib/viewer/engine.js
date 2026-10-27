import {
  AnimationMixer,
  Box3,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  Timer,
  Sphere,
  Vector3,
  WebGLRenderer,
  WireframeGeometry,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { makeMoves, PAIRS } from './moves.js';

// Camera direction for the initial view: front three-quarter (assets face +Z), slightly above.
const VIEW_DIR = new Vector3(0.62, 0.36, 1).normalize();
// Sun direction: high, from the front left so the default view shows form and a readable shadow.
const SUN_DIR = new Vector3(-0.55, 1, 0.45).normalize();

function textureSlots(material) {
  const out = [];
  for (const key of Object.keys(material)) {
    const value = material[key];
    if (value && value.isTexture) out.push(value);
  }
  return out;
}

function materialsOf(mesh) {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function makeContactTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(42,21,8,0.6)');
  g.addColorStop(0.45, 'rgba(42,21,8,0.24)');
  g.addColorStop(1, 'rgba(42,21,8,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

// Very short loops, such as a bat's wingbeat, are a blur at real speed; the preview stretches each
// loop to at least this long. The files keep the real timing.
const MIN_LOOP_SECONDS = 0.6;

/** How long one loop of a clip lasts in the preview. */
function loopSeconds(clip) {
  return Math.max(clip.duration, MIN_LOOP_SECONDS);
}

export class Viewer {
  constructor(container, { onStatus } = {}) {
    this.container = container;
    this.onStatus = onStatus ?? (() => {});
    this.model = null;
    this.wireframe = false;
    this.dirty = true;
    this.visible = true;
    this.loadToken = 0;

    const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = 'viewer-canvas';
    container.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new Scene();
    const pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    scene.environment = pmrem.fromScene(room, 0.035).texture;
    scene.environmentIntensity = 0.45;
    room.dispose();
    pmrem.dispose();
    this.scene = scene;

    // A faint sky/ground bounce keeps shadowed sides from going flat grey.
    const hemi = new HemisphereLight(0xdfe9ff, 0x3a3226, 0.2);
    scene.add(hemi);

    const sun = new DirectionalLight(0xfff3e2, 2.8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 9;
    scene.add(sun, sun.target);
    this.sun = sun;

    const ground = new Mesh(new PlaneGeometry(1, 1), new ShadowMaterial({ color: 0x2a1508, opacity: 0.5 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    this.ground = ground;

    const contact = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({ map: makeContactTexture(), transparent: true, depthWrite: false, toneMapped: false }),
    );
    contact.rotation.x = -Math.PI / 2;
    contact.renderOrder = -1;
    scene.add(contact);
    this.contact = contact;

    this.camera = new PerspectiveCamera(32, 1, 0.01, 1000);
    const controls = new OrbitControls(this.camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.9;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.addEventListener('change', () => (this.dirty = true));
    this.controls = controls;

    const ktx2 = new KTX2Loader().detectSupport(renderer);
    this.loader = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
    this.ktx2 = ktx2;
    this.maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    this.timer = new Timer();
    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.intersection = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.updateLoop();
    });
    this.intersection.observe(container);
    this.updateLoop();
  }

  updateLoop() {
    if (this.visible && !this.disposed) {
      this.timer.reset();
      this.renderer.setAnimationLoop((time) => this.tick(time));
    } else {
      this.renderer.setAnimationLoop(null);
    }
  }

  tick(time) {
    this.timer.update(time);
    const dt = Math.min(this.timer.getDelta(), 0.1);
    const moved = this.controls.update(dt);
    if (this.action) {
      if (this.shuffling && (this.shuffleLeft -= dt) <= 0) this.playNext();
      this.mixer.update(dt);
      this.partner?.mixer.update(dt);
      this.dirty = true;
    }
    if (moved || this.dirty) {
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
    }
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.fit) this.frame(false);
    this.dirty = true;
  }

  async load(url, { onProgress } = {}) {
    const token = ++this.loadToken;
    this.onStatus({ state: 'loading', progress: 0 });
    let gltf;
    try {
      gltf = await this.loader.loadAsync(url, (e) => {
        if (token !== this.loadToken) return;
        const progress = e.lengthComputable && e.total ? e.loaded / e.total : null;
        onProgress?.(progress);
        this.onStatus({ state: 'loading', progress });
      });
    } catch (err) {
      if (token === this.loadToken) this.onStatus({ state: 'error', error: err });
      throw err;
    }
    if (token !== this.loadToken) {
      this.disposeObject(gltf.scene);
      return;
    }
    const keepView = Boolean(this.model);
    this.setModel(gltf.scene, keepView, gltf.animations);
    this.onStatus({ state: 'ready' });
  }

  setModel(object, keepView, animations = []) {
    if (this.model) {
      this.scene.remove(this.model);
      this.disposeObject(this.model);
    }
    this.model = object;
    this.shuffling = false;
    this.setPartner(null);
    this.mixer?.stopAllAction();
    this.mixer = null;
    this.action = null;
    this.clips = new Map();
    object.traverse((o) => {
      // A pose can take a limb past the bind pose's bounds; keep skinned meshes from being culled.
      if (o.isSkinnedMesh) o.frustumCulled = false;
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      for (const m of materialsOf(o)) {
        // Alpha-cutout foliage: render both sides and smooth the cut edges with MSAA coverage.
        if (m.alphaTest > 0) {
          m.side = DoubleSide;
          m.alphaToCoverage = true;
        }
        // Glass throws a hard black shadow in a shadow map; light passes through it instead.
        if (m.transmission > 0) o.castShadow = false;
        for (const t of textureSlots(m)) t.anisotropy = this.maxAnisotropy;
        m.needsUpdate = true;
      }
    });
    this.scene.add(object);
    if (this.wireframe) this.applyWireframe(true);

    object.updateMatrixWorld(true);
    const box = new Box3().setFromObject(object);
    // People get the shipped clips plus moves made in code; a jump or raised arms need headroom.
    const moves = animations.length ? makeMoves(object) : [];
    for (const clip of [...animations, ...moves]) this.clips.set(clip.name, clip);
    let fitBox = box;
    if (this.clips.size) {
      this.mixer = new AnimationMixer(object);
      if (moves.length) box.max.y += box.getSize(new Vector3()).y * 0.3;
      // Frame room for the partner of a pair move up front, so the camera holds still when one joins.
      // The room is kept on both sides so the view stays centered on the person.
      fitBox = box.clone();
      const center = box.getCenter(new Vector3()).setY(0);
      for (const name of Object.keys(PAIRS)) {
        if (!this.clips.has(name)) continue;
        const { object: partner } = this.makePartner(this.clips.get(name), PAIRS[name]);
        for (const side of [1, -1]) {
          partner.position.sub(center).multiplyScalar(side).add(center);
          partner.updateMatrixWorld(true);
          fitBox.union(box.clone().applyMatrix4(partner.matrixWorld));
        }
      }
    }
    this.fitTo(fitBox, !keepView, box);
  }

  /** Frames the camera, ground and sun shadow on a box, and the contact shadow on the model's own box. */
  fitTo(box, resetView, modelBox = box) {
    const sphere = box.getBoundingSphere(new Sphere());
    this.fit = { box, sphere };

    const r = sphere.radius || 1;
    const floorY = box.min.y;
    const size = modelBox.getSize(new Vector3());
    const middle = modelBox.getCenter(new Vector3());
    this.ground.position.set(sphere.center.x, floorY, sphere.center.z);
    this.ground.scale.setScalar(r * 30);
    this.contact.position.set(middle.x, floorY + r * 0.002, middle.z);
    const pad = modelBox.getBoundingSphere(new Sphere()).radius * 0.2;
    this.contact.scale.set(size.x * 1.35 + pad, size.z * 1.35 + pad, 1);

    const sun = this.sun;
    sun.target.position.copy(sphere.center);
    sun.position.copy(sphere.center).addScaledVector(SUN_DIR, r * 4);
    const cam = sun.shadow.camera;
    cam.left = cam.bottom = -r * 1.6;
    cam.right = cam.top = r * 1.6;
    cam.near = r * 0.5;
    cam.far = r * 8;
    cam.updateProjectionMatrix();
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = r * 0.004;

    this.frame(resetView);
    this.dirty = true;
  }

  /** Fit the camera to the model. With reset=false only distance limits are updated. */
  frame(reset = true) {
    if (!this.fit) return;
    const { box, sphere } = this.fit;
    const r = sphere.radius || 1;
    const center = box.getCenter(new Vector3());
    const dist = this.fitDistance(box, center);
    this.controls.minDistance = r * 0.6;
    this.controls.maxDistance = Math.max(dist * 4, r * 6);
    this.camera.near = Math.max(dist / 200, 0.005);
    this.camera.far = dist * 50;
    this.camera.updateProjectionMatrix();
    if (reset) {
      this.controls.target.copy(center);
      this.camera.position.copy(center).addScaledVector(VIEW_DIR, dist);
      this.controls.update();
    }
    this.dirty = true;
  }

  /**
   * Smallest camera distance along VIEW_DIR that keeps the whole bounding box in frame while the
   * model turns on the turntable: box corners are tested at several rotations about the Y axis.
   */
  fitDistance(box, center) {
    const tanV = Math.tan((this.camera.fov * Math.PI) / 360);
    const tanH = tanV * this.camera.aspect;
    const forward = VIEW_DIR.clone();
    const right = new Vector3(0, 1, 0).cross(forward).normalize();
    const up = forward.clone().cross(right).normalize();
    const v = new Vector3();
    let dist = 0;
    for (let step = 0; step < 8; step++) {
      const a = (step / 8) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      for (let i = 0; i < 8; i++) {
        const x = (i & 1 ? box.max.x : box.min.x) - center.x;
        const y = (i & 2 ? box.max.y : box.min.y) - center.y;
        const z = (i & 4 ? box.max.z : box.min.z) - center.z;
        v.set(x * cos - z * sin, y, x * sin + z * cos);
        const toward = v.dot(forward);
        dist = Math.max(dist, toward + Math.abs(v.dot(up)) / tanV, toward + Math.abs(v.dot(right)) / tanH);
      }
    }
    return dist * 1.06 || 1;
  }

  /** Names of the clips this model can play, shipped ones first. */
  clipNames() {
    return [...this.clips.keys()];
  }

  /** Keeps playing clips in a random order, a few seconds each, starting with idle when there is one. */
  shuffle() {
    if (!this.mixer) return;
    this.shuffling = true;
    this.playNext(this.clips.has('idle') ? 'idle' : null);
  }

  playNext(name) {
    const names = this.clipNames().filter((n) => n !== this.action?.getClip().name);
    const next = name ?? names[Math.floor(Math.random() * names.length)];
    const duration = loopSeconds(this.clips.get(next));
    // Whole loops, about four seconds in all.
    this.shuffleLeft = Math.max(1, Math.round(4 / duration)) * duration;
    this.play(next);
  }

  /** Plays a clip by name on a loop, blending from the one playing; null returns to the bind pose. */
  play(name) {
    if (!this.mixer) return;
    const clip = name ? this.clips.get(name) : null;
    const next = clip ? this.mixer.clipAction(clip) : null;
    if (next === this.action) return;
    const prev = this.action;
    this.setPartner(clip && name in PAIRS ? this.makePartner(clip, PAIRS[name]) : null);
    if (next) {
      next.reset().setEffectiveTimeScale(clip.duration / loopSeconds(clip)).play();
      if (prev) next.crossFadeFrom(prev, 0.35, false);
    } else {
      this.mixer.stopAllAction();
      this.model.traverse((o) => o.isSkinnedMesh && o.skeleton.pose());
    }
    this.action = next;
    this.dirty = true;
  }

  /**
   * A second person for a pair move: a copy turned to face the model, placed so both right hands
   * meet at the given time of the clip.
   */
  makePartner(clip, meetAt) {
    const probe = new AnimationMixer(this.model);
    probe.clipAction(clip).play();
    probe.update(meetAt);
    this.model.updateMatrixWorld(true);
    const hand = this.model.getObjectByName('hand_R');
    const palm = hand.getWorldPosition(new Vector3());
    const finger = this.model.getObjectByName('middle_01_R');
    if (finger) palm.lerp(finger.getWorldPosition(new Vector3()), 0.6);
    probe.stopAllAction();
    probe.uncacheRoot(this.model);

    const object = cloneSkinned(this.model);
    object.traverse((o) => {
      if (o.isSkinnedMesh) o.frustumCulled = false;
      delete o.userData.tevyWire;
    });
    object.children.forEach(function strip(o) {
      for (const c of [...o.children]) c.userData.tevyOverlay ? o.remove(c) : strip(c);
    });
    // A half turn about the vertical line through the meeting point puts the partner's right hand there too.
    object.rotation.y = Math.PI;
    object.position.set(2 * palm.x, 0, 2 * palm.z);
    const mixer = new AnimationMixer(object);
    return { object, mixer, clip };
  }

  setPartner(partner) {
    if (!partner && !this.partner) return;
    if (this.partner) {
      this.partner.mixer.stopAllAction();
      // The copy shares geometry and materials with the model, so it is removed, not disposed.
      this.scene.remove(this.partner.object);
    }
    this.partner = partner;
    if (partner) {
      this.scene.add(partner.object);
      // Starts in step with the model's clip, which restarts at the same time.
      partner.mixer.clipAction(partner.clip).play();
    }
  }

  setAutoRotate(on) {
    this.controls.autoRotate = on;
    this.dirty = true;
  }

  setWireframe(on) {
    this.wireframe = on;
    this.applyWireframe(on);
    this.dirty = true;
  }

  applyWireframe(on) {
    if (!this.model) return;
    const overlays = [];
    this.model.traverse((o) => {
      if (!o.isMesh || o.userData.tevyOverlay) return;
      for (const m of materialsOf(o)) {
        // Push the shaded surface back a little so the overlay lines do not z-fight with it.
        m.polygonOffset = on;
        m.polygonOffsetFactor = on ? 1 : 0;
        m.polygonOffsetUnits = on ? 1 : 0;
      }
      if (on && !o.userData.tevyWire) overlays.push(o);
      if (o.userData.tevyWire) o.userData.tevyWire.visible = on;
    });
    if (!on) return;
    if (!this.wireMaterial) {
      this.wireMaterial = new LineBasicMaterial({ color: new Color(0xffd27a), transparent: true, opacity: 0.45, toneMapped: false });
    }
    for (const o of overlays) {
      const lines = new LineSegments(new WireframeGeometry(o.geometry), this.wireMaterial);
      lines.userData.tevyOverlay = true;
      lines.raycast = () => {};
      o.userData.tevyWire = lines;
      o.add(lines);
    }
  }

  disposeObject(object) {
    object.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (!o.material || o.material === this.wireMaterial) return;
      for (const m of materialsOf(o)) {
        for (const t of textureSlots(m)) t.dispose();
        m.dispose();
      }
    });
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.intersection.disconnect();
    if (this.model) this.disposeObject(this.model);
    this.wireMaterial?.dispose();
    this.controls.dispose();
    this.ktx2.dispose();
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }
}
