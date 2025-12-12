// src/main.ts
import { webglAvailable } from './three-header';
import createThreeHeader from './three-header';


// If WebGL is available mount header, otherwise show fallback image.
const mount = document.getElementById('three-header');
if (mount) {
  if (!webglAvailable()) {
    mount.innerHTML = '<img src="/assets/images/three-fallback.jpg" alt="Decorative 3D preview" style="width:100%;height:100%;object-fit:cover">';
  } else {
    createThreeHeader();
  }
}
