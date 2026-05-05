import * as THREE from "three";

type Uniforms = {
  time: { value: number };
};

export class BladeOfIce extends THREE.Group {
  private uniforms: Uniforms;

  constructor() {
    super();

    this.uniforms = {
      time: { value: 0 }
    };

    this.createBlade();
    this.createCore();
    this.createHilt();
    this.createMist();
    this.createFogLayers();
  }

  // ======================
  // ❄️ BLADE (crack shader)
  // ======================
  private createBlade() {
    const geo = new THREE.ConeGeometry(0.25, 3, 32, 64, true);
    geo.translate(0, 1.5, 0);

    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float time;

        float crack(vec2 uv) {
          float lines = abs(sin(uv.y * 40.0 + sin(uv.x * 10.0) * 5.0));
          return smoothstep(0.95, 1.0, lines);
        }

        void main() {
          float c = crack(vUv + time * 0.05);

          vec3 base = mix(
            vec3(0.7, 0.9, 1.0),
            vec3(0.2, 0.6, 1.0),
            vUv.y
          );

          vec3 crackGlow = vec3(0.8, 1.0, 1.0) * c * 2.0;

          gl_FragColor = vec4(base + crackGlow, 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const blade = new THREE.Mesh(geo, mat);
    this.add(blade);
  }

  // ======================
  // 💎 CORE
  // ======================
  private createCore() {
    const geo = new THREE.ConeGeometry(0.12, 2.8, 32);
    geo.translate(0, 1.5, 0);

    const mat = new THREE.MeshStandardMaterial({
      color: 0xaeefff,
      emissive: 0x66ccff,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.2
    });

    this.add(new THREE.Mesh(geo, mat));
  }

  // ======================
  // ⚔️ HILT
  // ======================
  private createHilt() {
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.1, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x99ccff, metalness: 0.8 })
    );
    this.add(guard);

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 1.5, 16),
      new THREE.MeshStandardMaterial({ color: 0x223344 })
    );
    handle.position.y = -1;
    this.add(handle);

    const pommel = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0x88ddff,
        emissive: 0x3399ff,
        emissiveIntensity: 1.2
      })
    );
    pommel.position.y = -1.8;
    this.add(pommel);
  }

  // ======================
  // 🌫️ PARTICLE MIST
  // ======================
  private createMist() {
    const count = 200;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = Math.random() * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      speeds[i] = 0.2 + Math.random() * 0.5;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("speed", new THREE.BufferAttribute(speeds, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        attribute float speed;
        uniform float time;

        void main() {
          vec3 pos = position;
          pos.y += mod(time * speed + position.y, 3.0);

          gl_PointSize = 3.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          gl_FragColor = vec4(0.7, 0.9, 1.0, 0.3);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.add(new THREE.Points(geo, mat));
  }

  // ======================
  // 🌫️ VOLUMETRIC FOG (layered)
  // ======================
  private createFogLayers() {
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.CylinderGeometry(0.8, 0.8, 3.2, 32, 1, true);

      const mat = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: `
          varying vec3 vPos;
          varying vec2 vUv;

          void main() {
            vUv = uv;
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vPos;
          varying vec2 vUv;
          uniform float time;

          float noise(vec3 p) {
            return sin(p.x * 3.0 + time) *
                   sin(p.y * 4.0 + time * 1.5) *
                   sin(p.z * 3.0 - time);
          }

          void main() {
            float n = noise(vPos * 0.8);

            float heightFade = smoothstep(0.0, 0.4, vUv.y) * (1.0 - vUv.y);
            float radialFade = 1.0 - length(vPos.xz) * 0.8;

            float density = n * heightFade * radialFade;

            vec3 color = vec3(0.7, 0.9, 1.0);

            gl_FragColor = vec4(color, density * 0.3);
          }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });

      const fog = new THREE.Mesh(geo, mat);
      fog.position.y = 1.5 + i * 0.1;
      fog.scale.setScalar(1 + i * 0.2);

      this.add(fog);
    }
  }

  // ======================
  // 🔄 UPDATE
  // ======================
  update(time: number) {
    this.uniforms.time.value = time;

    // subtle rotation for life
    this.rotation.y += 0.002;
  }
}