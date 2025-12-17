// src/main.ts
import { webglAvailable } from './three-header';
import createThreeHeader from './three-header';

const mount = document.getElementById('three-header');
let cleanupThree: (() => void) | undefined;

if (mount) {
  if (!webglAvailable()) {
    mount.innerHTML = '<img src="./assets/images/three-fallback.jpg" alt="Decorative 3D preview" style="width:100%;height:100%;object-fit:cover">';
  } else {
    cleanupThree = createThreeHeader();
  }
}

// Optional: Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (cleanupThree) cleanupThree();
});