# tevy

Free, high-quality 3D models for the web: cars, trees, rocks and more, sized for the browser.

**Browse and download at [tevy.dev](https://tevy.dev).**

- glTF (GLB) files that work in three.js, Babylon.js, Godot, Unity, Unreal and Blender
- Several levels of detail per model; download only what you need
- Free for any use, including commercial: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)

## Using a model in three.js

Models use meshopt geometry and KTX2 textures, so register both decoders:

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const ktx2 = new KTX2Loader()
  .setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/libs/basis/')
  .detectSupport(renderer);

const loader = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
const gltf = await loader.loadAsync('https://tevy.dev/models/norway-spruce/norway-spruce_lod0.glb');
scene.add(gltf.scene);
```

## This repository

The source of the tevy.dev website. Models are not stored in git; `npm run models` downloads the
published catalog from tevy.dev (sha256-verified) so the site runs locally with every model.

```sh
npm install
npm run models
npm run dev
```

## License

Models: CC0 1.0. Website code: MIT.
