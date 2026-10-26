import {
  AgXToneMapping,
  Box3,
  CanvasTexture,
  Color,
  DataUtils,
  DirectionalLight,
  DoubleSide,
  EquirectangularReflectionMapping,
  Fog,
  Group,
  HalfFloatType,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  Timer,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { UltraHDRLoader } from 'three/addons/loaders/UltraHDRLoader.js';

// A stretch of forest road, built from tevy models, so a sky can be judged by how it lights a real
// scene: paint reflections on the car, the sun's colour and direction in the shadows.
// The road runs along Z; the car faces +Z in the right-hand lane.
const ROAD_WIDTH = 7;
const CAR_X = 1.75;
const MODELS = {
  car: '/models/electric-gt/v1/lod1.glb',
  spruce: '/models/norway-spruce/v1/lod1.glb',
  birch: '/models/silver-birch/v1/lod1.glb',
  boulder: '/models/granite-boulder/v1/lod1.glb',
  post: '/models/delineator-post/v1/lod1.glb',
  grass: '/models/grass-clump/v1/lod1.glb',
  parsley: '/models/cow-parsley/v1/lod1.glb',
};
// Small deterministic noise so the generated textures look the same on every load.
function rng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// [model, x, z, scale, turn in degrees]. Trees stand back from the road so the sky stays in view.
const PLACEMENTS = [
  ['spruce', -16, -18, 1, 20],
  ['spruce', -19, 9, 0.85, 140],
  ['spruce', -26, -38, 1.1, 75],
  ['spruce', -15, -60, 0.9, 200],
  ['spruce', -32, 22, 1.05, 300],
  ['spruce', -18, 44, 0.95, 45],
  ['spruce', 17, -28, 1, 250],
  ['spruce', 22, -6, 0.9, 110],
  ['spruce', 30, -50, 1.15, 10],
  ['spruce', 16, 36, 0.8, 330],
  ['spruce', 34, 14, 1, 180],
  ['spruce', 24, 60, 1.1, 90],
  ['birch', -14, 24, 0.9, 60],
  ['birch', 14, 14, 0.8, 210],
  ['birch', 14, -46, 0.95, 320],
  ['birch', -22, -26, 0.85, 150],
  ['boulder', -6.5, 5, 0.9, 30],
  ['boulder', 7, -12, 0.7, 120],
  ['boulder', 7.5, 19, 1.1, 260],
];
for (let z = -120; z <= 120; z += 24) {
  PLACEMENTS.push(['post', -ROAD_WIDTH / 2 - 0.7, z, 1, 0], ['post', ROAD_WIDTH / 2 + 0.7, z + 12, 1, 180]);
}
// Grass and flowers on both verges, thinning out away from the road. Drawn instanced.
const VERGE = [];
{
  const random = rng(3);
  for (let i = 0; i < 450; i++) {
    const side = random() < 0.5 ? -1 : 1;
    const x = side * (ROAD_WIDTH / 2 + 0.8 + random() ** 1.8 * 18);
    const parsley = random() < 0.08;
    VERGE.push([parsley ? 'parsley' : 'grass', x, -60 + random() * 120, (parsley ? 0.8 : 1.2) + random() * 0.8, random() * 360]);
  }
}

function speckle(ctx, size, count, colors, max, random) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[Math.floor(random() * colors.length)];
    const s = 1 + random() * max;
    ctx.fillRect(random() * size, random() * size, s, s);
  }
}

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'));
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  return tex;
}

// One 6 m tile of meadow: soft patches of greener and drier grass under fine speckle.
function grassTexture() {
  const random = rng(7);
  return canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = '#4a5b27';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 40; i++) {
      const x = random() * 512;
      const y = random() * 512;
      const r = 30 + random() * 90;
      const color = ['74 92 36', '92 94 44', '60 76 30', '84 74 44'][Math.floor(random() * 4)];
      // Drawn on all four sides of the tile too, so the patches wrap without seams.
      for (const [dx, dy] of [[0, 0], [512, 0], [-512, 0], [0, 512], [0, -512]]) {
        const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        g.addColorStop(0, `rgb(${color} / 0.55)`);
        g.addColorStop(1, `rgb(${color} / 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
      }
    }
    speckle(ctx, 512, 16000, ['#5d7030', '#3d4c20', '#6b6c38', '#55682c', '#463d24'], 2.5, random);
  });
}

const placementMatrix = ([, x, z, scale, turn]) =>
  new Matrix4().compose(
    new Vector3(x, 0, z),
    new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), (turn * Math.PI) / 180),
    new Vector3(scale, scale, scale),
  );

/** Every mesh of the model as one InstancedMesh with an instance per placement. */
function instanced(model, placements) {
  const group = new Group();
  model.updateMatrixWorld(true);
  model.traverse((o) => {
    if (!o.isMesh) return;
    const mesh = new InstancedMesh(o.geometry, o.material, placements.length);
    placements.forEach((p, i) => mesh.setMatrixAt(i, placementMatrix(p).multiply(o.matrixWorld)));
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    group.add(mesh);
  });
  return group;
}

// One 8 m stretch of road: worn asphalt, solid edge lines and a dashed centre line.
function roadTexture() {
  const random = rng(11);
  return canvasTexture(256, 512, (ctx) => {
    ctx.fillStyle = '#3b3a38';
    ctx.fillRect(0, 0, 256, 512);
    speckle(ctx, 512, 9000, ['#454441', '#323130', '#4d4b48', '#2c2b2a'], 2, random);
    ctx.fillStyle = '#d8d6cf';
    const line = 256 * (0.12 / ROAD_WIDTH);
    ctx.fillRect(256 * (0.25 / ROAD_WIDTH), 0, line, 512);
    ctx.fillRect(256 - 256 * (0.25 / ROAD_WIDTH) - line, 0, line, 512);
    ctx.fillRect(128 - line / 2, 0, line, 192);
  });
}

/** Mean colour of the sky just above the horizon, so the ground can fade into it. */
export function horizonColor(texture) {
  const { data, width, height } = texture.image;
  const read = texture.type === HalfFloatType ? DataUtils.fromHalfFloat : (v) => v;
  const row = (y) => {
    const c = [0, 0, 0];
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      for (let k = 0; k < 3; k++) c[k] += read(data[i + k]) / width;
    }
    return c;
  };
  // Row order depends on the decoder; the brighter of the two rows next to the horizon is the sky.
  const offset = Math.round(height * 0.015);
  const a = row(Math.floor(height / 2) - offset);
  const b = row(Math.floor(height / 2) + offset);
  const [r, g, bl] = a[0] + a[1] + a[2] > b[0] + b[1] + b[2] ? a : b;
  return new Color(r, g, bl);
}

/**
 * Shows a sky panorama as background and image-based lighting of a small roadside scene. Dragging
 * orbits around the car, which turns the view around the whole sky.
 */
export class SkyViewer {
  constructor(container, { onStatus } = {}) {
    this.container = container;
    this.onStatus = onStatus ?? (() => {});
    this.dirty = true;
    this.visible = true;
    this.loadToken = 0;
    this.sunDir = new Vector3(0.4, 0.6, 0.7).normalize();

    const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = AgXToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    renderer.domElement.className = 'viewer-canvas';
    container.appendChild(renderer.domElement);
    this.renderer = renderer;
    this.maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    this.scene = new Scene();
    this.scene.fog = new Fog(0xffffff, 30, 420);
    this.world = new Group();
    this.scene.add(this.world);
    this.buildGround();

    const sun = new DirectionalLight(0xffffff, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const cam = sun.shadow.camera;
    cam.left = cam.bottom = -16;
    cam.right = cam.top = 16;
    cam.near = 1;
    cam.far = 120;
    sun.shadow.radius = 4;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.03;
    sun.target.position.set(CAR_X, 0, 0);
    this.world.add(sun, sun.target);
    this.sun = sun;

    this.camera = new PerspectiveCamera(42, 1, 0.1, 3000);
    const controls = new OrbitControls(this.camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 22;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.autoRotateSpeed = 0.4;
    controls.addEventListener('change', () => (this.dirty = true));
    this.controls = controls;

    this.loader = new UltraHDRLoader();
    const ktx2 = new KTX2Loader().detectSupport(renderer);
    this.gltf = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
    this.ktx2 = ktx2;

    this.reset();
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
    this.loadModels();
  }

  buildGround() {
    const grass = grassTexture();
    grass.repeat.set(1000, 1000);
    grass.anisotropy = this.maxAnisotropy;
    const ground = new Mesh(new PlaneGeometry(6000, 6000), new MeshStandardMaterial({ map: grass, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.world.add(ground);

    const asphalt = roadTexture();
    asphalt.repeat.set(1, 3000 / 8);
    asphalt.anisotropy = this.maxAnisotropy;
    const road = new Mesh(new PlaneGeometry(ROAD_WIDTH, 3000), new MeshStandardMaterial({ map: asphalt, roughness: 0.9 }));
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01;
    road.receiveShadow = true;
    this.world.add(road);
  }

  /** Loads the scene's models after the sky; a model that fails to load is left out. */
  async loadModels() {
    const entries = await Promise.all(
      Object.entries(MODELS).map(([name, url]) =>
        this.gltf.loadAsync(url).then(
          (g) => [name, g.scene],
          (err) => {
            console.error(err);
            return [name, null];
          },
        ),
      ),
    );
    if (this.disposed) return;
    const models = Object.fromEntries(entries);
    for (const object of Object.values(models)) {
      object?.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = o.receiveShadow = true;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          if (m.alphaTest > 0) {
            m.side = DoubleSide;
            m.alphaToCoverage = true;
          }
          if (m.transmission > 0) o.castShadow = false;
        }
      });
    }
    if (models.car) {
      const box = new Box3().setFromObject(models.car);
      models.car.position.set(CAR_X, -box.min.y, 0);
      this.world.add(models.car);
    }
    for (const placement of PLACEMENTS) {
      if (!models[placement[0]]) continue;
      const object = models[placement[0]].clone();
      placementMatrix(placement).decompose(object.position, object.quaternion, object.scale);
      this.world.add(object);
    }
    for (const name of new Set(VERGE.map((p) => p[0]))) {
      if (models[name]) this.world.add(instanced(models[name], VERGE.filter((p) => p[0] === name)));
    }
    this.dirty = true;
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
    const moved = this.controls.update(Math.min(this.timer.getDelta(), 0.1));
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
    this.dirty = true;
  }

  /** A low three-quarter view of the car, turned toward the sun so its side of the sky is in view. */
  reset() {
    const flat = new Vector3(this.sunDir.x, 0, this.sunDir.z);
    if (flat.lengthSq() < 1e-6) flat.set(0, 0, -1);
    flat.normalize().applyAxisAngle(new Vector3(0, 1, 0), (35 * Math.PI) / 180);
    this.controls.target.set(CAR_X, 0.9, 0);
    this.camera.position.set(CAR_X, 1.7, 0).addScaledVector(flat, -9);
    this.controls.update();
    this.dirty = true;
  }

  async load(url, { exposure = 1, sun } = {}) {
    const token = ++this.loadToken;
    this.onStatus({ state: 'loading', progress: null });
    let texture;
    try {
      texture = await this.loader.loadAsync(url, (e) => {
        if (token !== this.loadToken) return;
        this.onStatus({ state: 'loading', progress: e.lengthComputable && e.total ? e.loaded / e.total : null });
      });
    } catch (err) {
      if (token === this.loadToken) this.onStatus({ state: 'error', error: err });
      throw err;
    }
    if (token !== this.loadToken) {
      texture.dispose();
      return;
    }
    texture.mapping = EquirectangularReflectionMapping;
    this.scene.fog.color.copy(horizonColor(texture));
    this.scene.background?.dispose();
    this.scene.background = texture;
    this.scene.environment = texture;
    this.renderer.toneMappingExposure = exposure;

    // The sun as a light of its own, for shadows: the panorama alone cannot cast them.
    if (sun?.direction) {
      const firstLoad = !this.sunSet;
      this.sunSet = true;
      this.sunDir.fromArray(sun.direction).normalize();
      this.sun.color.fromArray(sun.color ?? [1, 1, 1]);
      this.sun.intensity = sun.illuminance ?? 0;
      this.sun.position.copy(this.sun.target.position).addScaledVector(this.sunDir, 60);
      if (firstLoad) this.reset();
    }
    this.dirty = true;
    this.onStatus({ state: 'ready' });
  }

  setScene(on) {
    this.world.visible = on;
    this.dirty = true;
  }

  setAutoRotate(on) {
    this.controls.autoRotate = on;
    this.dirty = true;
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.intersection.disconnect();
    this.scene.background?.dispose();
    this.world.traverse((o) => {
      o.geometry?.dispose();
      for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
        for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
        m.dispose();
      }
    });
    this.controls.dispose();
    this.ktx2.dispose();
    this.renderer.dispose();
  }
}
