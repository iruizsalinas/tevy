import {
  AgXToneMapping,
  EquirectangularReflectionMapping,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Timer,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { UltraHDRLoader } from 'three/addons/loaders/UltraHDRLoader.js';

// Looking at the horizon a little from above, toward the sun's side of the sky by default.
const VIEW_DIR = new Vector3(0, 0.12, 1).normalize();

/**
 * Shows a sky panorama as the scene background and lights two probe spheres with it: a mirror
 * sphere shows the reflections, a matte one the diffuse light. Dragging orbits around the spheres,
 * which turns the view around the whole sky.
 */
export class SkyViewer {
  constructor(container, { onStatus } = {}) {
    this.container = container;
    this.onStatus = onStatus ?? (() => {});
    this.dirty = true;
    this.visible = true;
    this.loadToken = 0;

    const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = AgXToneMapping;
    renderer.domElement.className = 'viewer-canvas';
    container.appendChild(renderer.domElement);
    this.renderer = renderer;

    this.scene = new Scene();
    const geometry = new SphereGeometry(0.5, 64, 32);
    this.mirror = new Mesh(geometry, new MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.04 }));
    this.matte = new Mesh(geometry, new MeshStandardMaterial({ color: 0xb8b8b8, metalness: 0, roughness: 0.85 }));
    this.mirror.position.set(-0.62, 0, 0);
    this.matte.position.set(0.62, 0, 0);
    this.scene.add(this.mirror, this.matte);

    this.camera = new PerspectiveCamera(50, 1, 0.05, 100);
    const controls = new OrbitControls(this.camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 2.2;
    controls.maxDistance = 6;
    controls.autoRotateSpeed = 0.5;
    controls.addEventListener('change', () => (this.dirty = true));
    this.controls = controls;
    this.reset();

    this.loader = new UltraHDRLoader();
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

  reset() {
    this.controls.target.set(0, 0, 0);
    this.camera.position.copy(VIEW_DIR).multiplyScalar(3.2);
    this.controls.update();
    this.dirty = true;
  }

  async load(url, { exposure = 1 } = {}) {
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
    this.scene.background?.dispose();
    this.scene.background = texture;
    this.scene.environment = texture;
    this.renderer.toneMappingExposure = exposure;
    this.dirty = true;
    this.onStatus({ state: 'ready' });
  }

  setSpheres(on) {
    this.mirror.visible = this.matte.visible = on;
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
    this.mirror.geometry.dispose();
    this.mirror.material.dispose();
    this.matte.material.dispose();
    this.controls.dispose();
    this.renderer.dispose();
  }
}
