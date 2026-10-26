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

export const THREE_PARTS_SNIPPET = `import { Quaternion, Vector3 } from 'three';

// Moving parts are separate nodes with their origin at the pivot. Wheels on
// one side are turned to face out, so turn each wheel from its rest pose.
const names = ['wheel_FL', 'wheel_FR', 'wheel_RL', 'wheel_RR'];
const wheels = names.map((name) => gltf.scene.getObjectByName(name));
const rest = wheels.map((wheel) => wheel.quaternion.clone());
const spinQ = new Quaternion();
const steerQ = new Quaternion();
let spin = 0;

// Each frame: distance driven this frame and wheel radius in meters,
// steer in radians (positive turns left, front wheels only).
spin += distance / radius;
wheels.forEach((wheel, i) => {
  spinQ.setFromAxisAngle(new Vector3(1, 0, 0), spin);
  steerQ.setFromAxisAngle(new Vector3(0, 1, 0), i < 2 ? steer : 0);
  wheel.quaternion.copy(steerQ).multiply(spinQ).multiply(rest[i]);
});`;

/** `url` is a person's LOD0, e.g. https://tevy.dev/models/<slug>/v1/lod0.glb */
export function threeAnimationSnippet(url: string): string {
  return `import { AnimationMixer, Timer } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

const gltf = await loader.loadAsync('${url}');
// Skinned models need SkeletonUtils.clone for each extra copy.
const person = clone(gltf.scene);
scene.add(person);

const mixer = new AnimationMixer(person);
const clip = (name) => gltf.animations.find((c) => c.name === name);
const walk = mixer.clipAction(clip('walk'));
walk.play();
const timer = new Timer();

// Each frame. The walk is made for 1.3 m/s, so move the person at that
// speed while it plays; people face +Z.
timer.update();
const dt = timer.getDelta();
mixer.update(dt);
person.position.z += 1.3 * dt;

// To stop: blend into the idle clip over 0.4 s.
// walk.crossFadeTo(mixer.clipAction(clip('idle')).play(), 0.4);`;
}

export const THREE_WIND_SNIPPET = `// _WIND per vertex: r = sway (0 at the trunk base, 1 at the tips),
// g = phase, b = leaf flutter. GLTFLoader names the attribute _wind.
const time = { value: 0 };
gltf.scene.traverse((object) => {
  if (!object.isMesh || !object.geometry.attributes._wind) return;
  object.material.onBeforeCompile = (shader) => {
    shader.uniforms.windTime = time;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', \`#include <common>
attribute vec4 _wind;
uniform float windTime;\`)
      .replace('#include <begin_vertex>', \`#include <begin_vertex>
float phase = _wind.g * 6.2832;
float sway = _wind.r * 0.12 * sin(windTime * 1.4 + phase);
float flutter = _wind.b * 0.02 * sin(windTime * 9.0 + phase * 7.0);
transformed.x += sway + flutter;
transformed.z += 0.6 * sway - flutter;\`);
  };
});

// Each frame: time.value = timer.getElapsed();`;

export function threeSkySnippet(url: string, sky: { exposure?: number; sun?: { direction?: number[]; color?: number[]; illuminance?: number } }): string {
  const sun = sky.sun;
  const light =
    sun?.direction && sun.illuminance
      ? `

// The sun as a light of its own, for shadows (values from the sky's .json file).
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

/** `base` is the version folder, e.g. https://tevy.dev/materials/<slug>/v1 */
export function threeMaterialSnippet(base: string, tileSize: number): string {
  return `import { MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from 'three';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

// Once per app (the same loader the models use).
const ktx2 = new KTX2Loader()
  .setTranscoderPath('${TRANSCODER_URL}')
  .detectSupport(renderer);

const [color, normal, orm] = await Promise.all(
  ['color', 'normal', 'orm'].map((map) => ktx2.loadAsync(\`${base}/\${map}-2k.ktx2\`)),
);
color.colorSpace = SRGBColorSpace;

// One repeat covers ${tileSize} m. Repeat it over a plane of size width x depth in meters.
for (const texture of [color, normal, orm]) {
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(width / ${tileSize}, depth / ${tileSize});
}

const material = new MeshStandardMaterial({
  map: color,
  normalMap: normal,
  aoMap: orm, // occlusion in red
  roughnessMap: orm, // roughness in green
  metalnessMap: orm, // metalness in blue
});`;
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
