import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

export default function createThreeHeader() {
  const mount = document.getElementById('three-header') as HTMLElement;
  if (!mount) return;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const width = mount.clientWidth;
  const height = Math.max(220, mount.clientHeight);

  renderer.setSize(width, height);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x071020, 0.06);

  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
  camera.position.set(0, 0, 6);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);
  scene.add(new THREE.AmbientLight(0x3a3f50, 0.6));

  // placeholder shape
  const geom = new THREE.IcosahedronGeometry(1.6, 4);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x00c2a8,
    roughness: 0.35,
    metalness: 0.3,
  });
  const placeholder = new THREE.Mesh(geom, mat);
  scene.add(placeholder);

  // optional model
  const loader = new GLTFLoader();
  loader.load(
    '/assets/models/scene.glb',
    (gltf: GLTF) => {
      try {
        scene.remove(placeholder);
        gltf.scene.scale.setScalar(0.9);
        gltf.scene.position.set(0, -0.2, 0);
        scene.add(gltf.scene);
      } catch {}
    },
    undefined,
    () => {}
  );

  let pointerX = 0;
  let pointerY = 0;

  function onPointerMove(e: PointerEvent) {
    const rect = mount.getBoundingClientRect();
    pointerX = (e.clientX - rect.left) / rect.width - 0.5;
    pointerY = (e.clientY - rect.top) / rect.height - 0.5;
  }
  mount.addEventListener('pointermove', onPointerMove);

  function resize() {
    const w = mount.clientWidth;
    const h = Math.max(220, mount.clientHeight);

    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  function animate(t: number) {
    t *= 0.001;
    scene.rotation.y += 0.003 + pointerX * 0.1;
    scene.rotation.x += 0.001 + pointerY * 0.1;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  return () => {
    mount.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', resize);
    renderer.dispose();
  };
}
