import * as THREE from "three";

export class SwordOfFire extends THREE.Group {
  private flameMaterial: THREE.ShaderMaterial;

  constructor() {
    super();

    // === BLADE (animated flame) ===
    const bladeGeometry = new THREE.ConeGeometry(0.3, 3, 32, 64, true);
    bladeGeometry.translate(0, 1.5, 0);

    this.flameMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float time;

        void main() {
          vUv = uv;

          vec3 pos = position;

          // flame flicker distortion
          float noise = sin(pos.y * 10.0 + time * 5.0) * 0.05;
          pos.x += noise;
          pos.z += noise;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;

        void main() {
          float intensity = 1.0 - vUv.y;

          vec3 color = mix(
            vec3(1.0, 0.9, 0.4),   // yellow
            vec3(1.0, 0.2, 0.0),   // orange/red
            vUv.y
          );

          gl_FragColor = vec4(color, intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const blade = new THREE.Mesh(bladeGeometry, this.flameMaterial);
    this.add(blade);

    // === CORE (bright center) ===
    const coreGeometry = new THREE.ConeGeometry(0.15, 2.8, 32);
    coreGeometry.translate(0, 1.5, 0);

    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffcc,
      transparent: true,
      opacity: 0.9
    });

    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.add(core);

    // === CROSSGUARD ===
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.1, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 })
    );
    guard.position.y = 0;
    this.add(guard);

    // === HANDLE ===
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 1.5, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    handle.position.y = -1;
    this.add(handle);

    // === POMMEL ===
    const pommel = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x666666 })
    );
    pommel.position.y = -1.8;
    this.add(pommel);
  }

  update(time: number) {
    this.flameMaterial.uniforms["time"].value = time;
  }
}