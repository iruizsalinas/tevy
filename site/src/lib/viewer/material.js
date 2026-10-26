import {
  AgXToneMapping,
  DirectionalLight,
  EquirectangularReflectionMapping,
  Fog,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  Timer,
  Vector3,
  WebGLRenderer,
} from 'three';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { UltraHDRLoader } from 'three/addons/loaders/UltraHDRLoader.js';
import { horizonColor } from './sky.js';

// Ground this wide, so the material repeats out into the fog, which hides the repeat in the distance.
const GROUND = 240;

/**
 * Shows a tiling material on the ground at its real size, under a sky panorama that lights it.
 * Dragging orbits around a point on the ground; the view starts at a standing eye height.
 */
export class MaterialViewer {
  constructor(container, { onStatus } = {}) {
    this.container = container;
    this.onStatus = onStatus ?? (() => {});
    this.dirty = true;
    this.visible = true;
    this.loadToken = 0;
    this.textures = [];

    const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = AgXToneMapping;
    renderer.domElement.className = 'viewer-canvas';
    container.appendChild(renderer.domElement);
    this.renderer = renderer;
    this.maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 16);

    this.scene = new Scene();
    this.scene.fog = new Fog(0xc8ccd0, 12, 90);
    this.material = new MeshStandardMaterial({ color: 0x808080, roughness: 1 });
    const ground = new Mesh(new PlaneGeometry(GROUND, GROUND), this.material);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // The panorama lights the ground; the sun as a light of its own gives the normal map a direction.
    this.sun = new DirectionalLight(0xffffff, 0);
    this.sun.position.set(30, 40, 20);
    this.scene.add(this.sun);

    this.camera = new PerspectiveCamera(50, 1, 0.05, 1000);
    const controls = new OrbitControls(this.camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 0.6;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.autoRotateSpeed = 0.35;
    controls.addEventListener('change', () => (this.dirty = true));
    this.controls = controls;

    this.sky = new UltraHDRLoader();
    this.ktx2 = new KTX2Loader().detectSupport(renderer);

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

  /** Standing on the ground, looking at a spot a few meters ahead. */
  reset() {
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(0, 1.6, 4.5);
    this.controls.update();
    this.dirty = true;
  }

  /** Loads the sky that lights the scene: { path, exposure, sun } from a sky's metadata. */
  async loadSky({ path, exposure = 1, sun }) {
    const texture = await this.sky.loadAsync(path);
    if (this.disposed) return texture.dispose();
    texture.mapping = EquirectangularReflectionMapping;
    this.scene.fog.color.copy(horizonColor(texture));
    this.scene.background = texture;
    this.scene.environment = texture;
    this.renderer.toneMappingExposure = exposure;
    if (sun?.direction) {
      this.sun.color.fromArray(sun.color ?? [1, 1, 1]);
      this.sun.intensity = sun.illuminance ?? 0;
      this.sun.position.copy(new Vector3().fromArray(sun.direction).normalize().multiplyScalar(60));
    }
    this.dirty = true;
  }

  /** Loads one texture set: { color, normal, orm } URLs, and the meters covered by one repeat. */
  async load(maps, tileSize) {
    const token = ++this.loadToken;
    this.onStatus({ state: 'loading' });
    let textures;
    try {
      textures = await Promise.all(['color', 'normal', 'orm'].map((map) => this.ktx2.loadAsync(maps[map])));
    } catch (err) {
      if (token === this.loadToken) this.onStatus({ state: 'error', error: err });
      throw err;
    }
    if (token !== this.loadToken || this.disposed) {
      for (const t of textures) t.dispose();
      return;
    }
    for (const t of textures) {
      t.wrapS = t.wrapT = RepeatWrapping;
      t.repeat.set(GROUND / tileSize, GROUND / tileSize);
      t.anisotropy = this.maxAnisotropy;
    }
    const [color, normal, orm] = textures;
    color.colorSpace = SRGBColorSpace;
    for (const t of this.textures) t.dispose();
    this.textures = textures;
    Object.assign(this.material, { map: color, normalMap: normal, aoMap: orm, roughnessMap: orm, metalnessMap: orm });
    this.material.color.set(0xffffff);
    this.material.needsUpdate = true;
    this.dirty = true;
    this.onStatus({ state: 'ready' });
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
    for (const t of this.textures) t.dispose();
    this.material.dispose();
    this.controls.dispose();
    this.ktx2.dispose();
    this.renderer.dispose();
  }
}
