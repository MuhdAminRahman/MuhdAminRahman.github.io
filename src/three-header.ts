import * as THREE from 'three';

export function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export default function createThreeHeader() {
  const mount = document.getElementById('three-header') as HTMLElement;
  if (!mount) return;

  // ─────────────────────────────────────────────
  // Renderer
  // ─────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, Math.max(220, mount.clientHeight));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  mount.appendChild(renderer.domElement);

  // ─────────────────────────────────────────────
  // Scene & Camera
  // ─────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x071020, 0.06);

  const camera = new THREE.PerspectiveCamera(
    35,
    mount.clientWidth / Math.max(220, mount.clientHeight),
    0.1,
    100
  );
  camera.position.set(0, 0, 6);

  // ─────────────────────────────────────────────
  // Lighting (cheap but good)
  // ─────────────────────────────────────────────
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(0, 0, 5);
  scene.add(sun);

  scene.add(new THREE.AmbientLight(0x404050, 0.6));

  // ─────────────────────────────────────────────
  // Textures
  // ─────────────────────────────────────────────
  const loader = new THREE.TextureLoader();

  const dayMap = loader.load('./assets/images/earth_day_4096.jpg');
  const nightMap = loader.load('./assets/images/earth_night_4096.jpg');
  const cloudsMap = loader.load('./assets/images/earth_bump_roughness_clouds_4096.jpg');

  dayMap.colorSpace = THREE.SRGBColorSpace;
  nightMap.colorSpace = THREE.SRGBColorSpace;

  dayMap.anisotropy = 8;
  nightMap.anisotropy = 8;
  cloudsMap.anisotropy = 8;

  // ─────────────────────────────────────────────
  // Geometry
  // ─────────────────────────────────────────────
  const geometry = new THREE.SphereGeometry(1.6, 48, 48);

  // ─────────────────────────────────────────────
  // Earth material (day/night mix – FAST)
  // ─────────────────────────────────────────────
  const earthMaterial = new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: dayMap },
      nightMap: { value: nightMap },
      lightDir: { value: new THREE.Vector3(0, 0, 1) }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D dayMap;
      uniform sampler2D nightMap;
      uniform vec3 lightDir;

      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        float light = dot(vNormal, normalize(lightDir));
        float mixValue = smoothstep(-0.25, 0.4, light);

        vec3 dayColor = texture2D(dayMap, vUv).rgb;
        vec3 nightColor = texture2D(nightMap, vUv).rgb;

        vec3 color = mix(nightColor, dayColor, mixValue);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });

  const earth = new THREE.Mesh(geometry, earthMaterial);
  scene.add(earth);


  // ─────────────────────────────────────────────
  // Clouds
  // ─────────────────────────────────────────────
  const cloudsMaterial = new THREE.MeshStandardMaterial({
    map: cloudsMap,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  const clouds = new THREE.Mesh(geometry, cloudsMaterial);
  clouds.scale.setScalar(1.01);
  scene.add(clouds);

  // ─────────────────────────────────────────────
  // Atmosphere (cheap Fresnel glow)
  // ─────────────────────────────────────────────
  const atmosphereMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    uniforms: {
      color: { value: new THREE.Color('#4db2ff') },
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        gl_FragColor = vec4(color, intensity);
      }
    `,
  });

  const atmosphere = new THREE.Mesh(geometry, atmosphereMaterial);
  atmosphere.scale.setScalar(1.04);
  scene.add(atmosphere);

  // ─────────────────────────────────────────────
  // Pointer interaction
  // ─────────────────────────────────────────────
  let pointerX = 0;
  let pointerY = 0;

  function onPointerMove(e: PointerEvent) {
    const rect = mount.getBoundingClientRect();
    pointerX = (e.clientX - rect.left) / rect.width - 0.5;
    pointerY = (e.clientY - rect.top) / rect.height - 0.5;
  }

  mount.addEventListener('pointermove', onPointerMove);

  // ─────────────────────────────────────────────
  // Resize
  // ─────────────────────────────────────────────
  function resize() {
    const w = mount.clientWidth;
    const h = Math.max(220, mount.clientHeight);

    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize', resize);

  // ─────────────────────────────────────────────
  // Animation loop
  // ─────────────────────────────────────────────
  function animate() {
    earth.rotation.y += 0.0008;
    clouds.rotation.y += 0.0012;

    scene.rotation.y += 0.001 + pointerX * 0.08;
    scene.rotation.x += 0.0005 + pointerY * 0.08;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

  // ─────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────
  return () => {
    mount.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', resize);
    renderer.dispose();
  };
}
