// Code examples for the docs page and llms.txt. Each takes the URLs of a real published item, so
// every example can be pasted and run as it is.
import { TRANSCODER_URL } from './models';

export function threeModelSnippet(url: string): string {
  return `import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// Once per app. renderer and scene: your THREE.WebGLRenderer and THREE.Scene
const ktx2 = new KTX2Loader()
  .setTranscoderPath('${TRANSCODER_URL}')
  .detectSupport(renderer);
const loader = new GLTFLoader()
  .setKTX2Loader(ktx2)
  .setMeshoptDecoder(MeshoptDecoder);

const gltf = await loader.loadAsync('${url}');
scene.add(gltf.scene);`;
}

/** `base` is the version folder, e.g. https://tevy.dev/models/<slug>/v1 */
export function threeLodSnippet(base: string, levels: number): string {
  const distances = [0, 25, 60, 120].slice(0, levels);
  return `import { LOD } from 'three';

// Distances in meters at which each level takes over; tune them to your camera.
const distances = [${distances.join(', ')}];
const lod = new LOD();
for (const [level, distance] of distances.entries()) {
  const gltf = await loader.loadAsync(\`${base}/lod\${level}.glb\`);
  lod.addLevel(gltf.scene, distance);
}
scene.add(lod);`;
}

export const THREE_PARTS_SNIPPET = `// Moving parts are separate nodes with their origin at the pivot.
const wheel = gltf.scene.getObjectByName('wheel_FL');

// Each frame: roll the wheel by the distance driven (wheel radius in meters).
wheel.rotation.x += distance / radius;`;

export function threeSkySnippet(url: string, sky: { exposure?: number; sun?: { direction?: number[]; color?: number[]; illuminance?: number } }): string {
  const sun = sky.sun;
  const light =
    sun?.direction && sun.illuminance
      ? `

// The sun as a light of its own, for shadows (values from sky.json).
const sun = new DirectionalLight(new Color(${(sun.color ?? [1, 1, 1]).join(', ')}), ${sun.illuminance});
sun.position.set(${sun.direction.join(', ')}).multiplyScalar(100);
sun.castShadow = true;
scene.add(sun);`
      : '';
  const imports = light ? 'AgXToneMapping, Color, DirectionalLight, EquirectangularReflectionMapping' : 'AgXToneMapping, EquirectangularReflectionMapping';
  return `import { ${imports} } from 'three';
import { UltraHDRLoader } from 'three/addons/loaders/UltraHDRLoader.js';

const sky = await new UltraHDRLoader().loadAsync('${url}');
sky.mapping = EquirectangularReflectionMapping;
scene.background = sky; // what you see
scene.environment = sky; // how everything is lit
renderer.toneMapping = AgXToneMapping;
renderer.toneMappingExposure = ${sky.exposure ?? 1};${light}`;
}

export function modelViewerSnippet(url: string): string {
  return `<script type="module" src="https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js"></script>

<model-viewer src="${url}" camera-controls auto-rotate shadow-intensity="1"></model-viewer>`;
}

export function r3fSnippet(url: string): string {
  return `import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

const ktx2 = new KTX2Loader().setTranscoderPath('${TRANSCODER_URL}');

export function Model() {
  const gl = useThree((state) => state.gl);
  // drei decodes meshopt itself; KTX2 textures need the loader above.
  const { scene } = useGLTF('${url}', false, true, (loader) => {
    loader.setKTX2Loader(ktx2.detectSupport(gl));
  });
  return <primitive object={scene} />;
}`;
}

export function babylonSnippet(url: string): string {
  return `import { ImportMeshAsync } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

// Babylon decodes meshopt and KTX2 itself.
const result = await ImportMeshAsync('${url}', scene);`;
}
