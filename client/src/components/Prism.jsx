import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

const IDENTITY_ROTATION = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
const DEFAULT_PALETTE = ["#6c7c8f", "#bc7441", "#9ead98", "#f0dcc2"];

function hexToRgb(hex) {
  const value = (hex || "").replace("#", "").trim();
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : value;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return [1, 1, 1];
  }

  const int = Number.parseInt(normalized, 16);
  return [
    ((int >> 16) & 255) / 255,
    ((int >> 8) & 255) / 255,
    (int & 255) / 255,
  ];
}

function toPalette(palette) {
  const resolved = Array.isArray(palette) ? palette : DEFAULT_PALETTE;
  return DEFAULT_PALETTE.map((fallback, index) =>
    hexToRgb(resolved[index] ?? fallback)
  );
}

export default function Prism({
  height = 3.5,
  baseWidth = 5.5,
  animationType = "rotate",
  glow = 1,
  offset = { x: 0, y: 0 },
  noise = 0.5,
  transparent = true,
  scale = 3.6,
  hueShift = 0,
  colorFrequency = 1,
  hoverStrength = 2,
  inertia = 0.05,
  bloom = 1,
  palette = DEFAULT_PALETTE,
  paletteMix = 0.86,
  suspendWhenOffscreen = false,
  timeScale = 0.5,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const prismHeight = Math.max(0.001, height);
    const prismBaseWidth = Math.max(0.001, baseWidth);
    const baseHalf = prismBaseWidth * 0.5;
    const prismGlow = Math.max(0, glow);
    const prismNoise = Math.max(0, noise);
    const offsetX = offset?.x ?? 0;
    const offsetY = offset?.y ?? 0;
    const saturation = transparent ? 1.5 : 1;
    const prismScale = Math.max(0.001, scale);
    const prismHueShift = hueShift || 0;
    const prismColorFrequency = Math.max(0, colorFrequency || 1);
    const prismBloom = Math.max(0, bloom || 1);
    const prismPaletteMix = Math.max(0, Math.min(1, paletteMix || 0));
    const prismPalette = toPalette(palette);
    const rotationSpeedX = 1;
    const rotationSpeedY = 1;
    const rotationSpeedZ = 1;
    const prismTimeScale = Math.max(0, timeScale || 1);
    const hoverForce = Math.max(0, hoverStrength || 1);
    const easing = Math.max(0, Math.min(1, inertia || 0.12));

    let renderer;

    try {
      renderer = new Renderer({
        dpr: Math.min(2, window.devicePixelRatio || 1),
        alpha: transparent,
        antialias: false,
      });
    } catch {
      return undefined;
    }

    const { gl } = renderer;
    gl.clearColor(0, 0, 0, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);

    Object.assign(gl.canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
    });
    container.appendChild(gl.canvas);

    const vertex = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragment = `
      precision highp float;

      uniform vec2  iResolution;
      uniform float iTime;

      uniform float uHeight;
      uniform float uBaseHalf;
      uniform mat3  uRot;
      uniform int   uUseBaseWobble;
      uniform float uGlow;
      uniform vec2  uOffsetPx;
      uniform float uNoise;
      uniform float uSaturation;
      uniform float uScale;
      uniform float uHueShift;
      uniform float uColorFreq;
      uniform float uBloom;
      uniform vec3  uPalette[4];
      uniform float uPaletteMix;
      uniform float uCenterShift;
      uniform float uInvBaseHalf;
      uniform float uInvHeight;
      uniform float uMinAxis;
      uniform float uPxScale;
      uniform float uTimeScale;

      vec4 tanh4(vec4 x){
        vec4 e2x = exp(2.0*x);
        return (e2x - 1.0) / (e2x + 1.0);
      }

      float rand(vec2 co){
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      float sdOctaAnisoInv(vec3 p){
        vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
        float m = q.x + q.y + q.z - 1.0;
        return m * uMinAxis * 0.5773502691896258;
      }

      float sdPyramidUpInv(vec3 p){
        float oct = sdOctaAnisoInv(p);
        float halfSpace = -p.y;
        return max(oct, halfSpace);
      }

      mat3 hueRotation(float a){
        float c = cos(a), s = sin(a);
        mat3 W = mat3(
          0.299, 0.587, 0.114,
          0.299, 0.587, 0.114,
          0.299, 0.587, 0.114
        );
        mat3 U = mat3(
           0.701, -0.587, -0.114,
          -0.299,  0.413, -0.114,
          -0.300, -0.588,  0.886
        );
        mat3 V = mat3(
           0.168, -0.331,  0.500,
           0.328,  0.035, -0.500,
          -0.497,  0.296,  0.201
        );
        return W + U * c + V * s;
      }

      vec3 paletteRamp(float t){
        vec3 a = mix(uPalette[0], uPalette[1], smoothstep(0.0, 0.34, t));
        vec3 b = mix(uPalette[1], uPalette[2], smoothstep(0.22, 0.7, t));
        vec3 c = mix(uPalette[2], uPalette[3], smoothstep(0.58, 1.0, t));
        vec3 ab = mix(a, b, smoothstep(0.18, 0.64, t));
        return mix(ab, c, smoothstep(0.56, 1.0, t));
      }

      void main(){
        vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy - uOffsetPx) * uPxScale;

        float z = 5.0;
        float d = 0.0;

        vec3 p;
        vec4 o = vec4(0.0);

        float centerShift = uCenterShift;
        float cf = uColorFreq;

        mat2 wob = mat2(1.0);
        if (uUseBaseWobble == 1) {
          float t = iTime * uTimeScale;
          float c0 = cos(t + 0.0);
          float c1 = cos(t + 33.0);
          float c2 = cos(t + 11.0);
          wob = mat2(c0, c1, c2, c0);
        }

        const int STEPS = 100;
        for (int i = 0; i < STEPS; i++) {
          p = vec3(f, z);
          p.xz = p.xz * wob;
          p = uRot * p;
          vec3 q = p;
          q.y += centerShift;
          d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));
          z -= d;
          o += (sin((p.y + z) * cf + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
        }

        o = tanh4(o * o * (uGlow * uBloom) / 1e5);

        vec3 col = o.rgb;
        float n = rand(gl_FragCoord.xy + vec2(iTime));
        col += (n - 0.5) * uNoise;
        col = clamp(col, 0.0, 1.0);

        float luminance = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col = clamp(mix(vec3(luminance), col, uSaturation), 0.0, 1.0);

        if(abs(uHueShift) > 0.0001){
          col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0);
        }

        float verticalTone = gl_FragCoord.y / max(iResolution.y, 1.0);
        float tone = clamp(
          dot(col, vec3(0.24, 0.52, 0.24)) * 0.82 + verticalTone * 0.18,
          0.0,
          1.0
        );
        vec3 paletteColor = paletteRamp(tone);
        col = mix(col, paletteColor, uPaletteMix);

        gl_FragColor = vec4(col, o.a);
      }
    `;

    const geometry = new Triangle(gl);
    const resolutionBuffer = new Float32Array(2);
    const offsetBuffer = new Float32Array(2);
    const rotationBuffer = new Float32Array(IDENTITY_ROTATION);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iResolution: { value: resolutionBuffer },
        iTime: { value: 0 },
        uHeight: { value: prismHeight },
        uBaseHalf: { value: baseHalf },
        uUseBaseWobble: { value: 1 },
        uRot: { value: rotationBuffer },
        uGlow: { value: prismGlow },
        uOffsetPx: { value: offsetBuffer },
        uNoise: { value: prismNoise },
        uSaturation: { value: saturation },
        uScale: { value: prismScale },
        uHueShift: { value: prismHueShift },
        uColorFreq: { value: prismColorFrequency },
        uBloom: { value: prismBloom },
        uPalette: { value: prismPalette },
        uPaletteMix: { value: prismPaletteMix },
        uCenterShift: { value: prismHeight * 0.25 },
        uInvBaseHalf: { value: 1 / baseHalf },
        uInvHeight: { value: 1 / prismHeight },
        uMinAxis: { value: Math.min(baseHalf, prismHeight) },
        uPxScale: {
          value: 1 / ((gl.drawingBufferHeight || 1) * 0.1 * prismScale),
        },
        uTimeScale: { value: prismTimeScale },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const width = container.clientWidth || 1;
      const heightValue = container.clientHeight || 1;
      renderer.setSize(width, heightValue);
      resolutionBuffer[0] = gl.drawingBufferWidth;
      resolutionBuffer[1] = gl.drawingBufferHeight;
      offsetBuffer[0] = offsetX * (Math.min(2, window.devicePixelRatio || 1));
      offsetBuffer[1] = offsetY * (Math.min(2, window.devicePixelRatio || 1));
      program.uniforms.uPxScale.value =
        1 / ((gl.drawingBufferHeight || 1) * 0.1 * prismScale);
    };

    let resizeObserver = null;
    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
    }
    window.addEventListener("resize", resize);
    resize();

    const setMat3FromEuler = (yawY, pitchX, rollZ, out) => {
      const cy = Math.cos(yawY);
      const sy = Math.sin(yawY);
      const cx = Math.cos(pitchX);
      const sx = Math.sin(pitchX);
      const cz = Math.cos(rollZ);
      const sz = Math.sin(rollZ);
      const r00 = cy * cz + sy * sx * sz;
      const r01 = -cy * sz + sy * sx * cz;
      const r02 = sy * cx;

      const r10 = cx * sz;
      const r11 = cx * cz;
      const r12 = -sx;

      const r20 = -sy * cz + cy * sx * sz;
      const r21 = sy * sz + cy * sx * cz;
      const r22 = cy * cx;

      out[0] = r00;
      out[1] = r10;
      out[2] = r20;
      out[3] = r01;
      out[4] = r11;
      out[5] = r21;
      out[6] = r02;
      out[7] = r12;
      out[8] = r22;
      return out;
    };

    const noiseIsZero = prismNoise < 1e-6;
    const randomUnit = () => Math.random();
    const rotationX = (0.3 + randomUnit() * 0.6) * rotationSpeedX;
    const rotationY = (0.2 + randomUnit() * 0.7) * rotationSpeedY;
    const rotationZ = (0.1 + randomUnit() * 0.5) * rotationSpeedZ;
    const phaseX = randomUnit() * Math.PI * 2;
    const phaseZ = randomUnit() * Math.PI * 2;

    let animationFrame = 0;
    let yaw = 0;
    let pitch = 0;
    let roll = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    const startedAt = performance.now();
    const pointer = { x: 0, y: 0, inside: true };

    const lerp = (from, to, amount) => from + (to - from) * amount;

    const onMove = (event) => {
      const windowWidth = Math.max(1, window.innerWidth);
      const windowHeight = Math.max(1, window.innerHeight);
      const centerX = windowWidth * 0.5;
      const centerY = windowHeight * 0.5;
      const normalizedX = (event.clientX - centerX) / (windowWidth * 0.5);
      const normalizedY = (event.clientY - centerY) / (windowHeight * 0.5);
      pointer.x = Math.max(-1, Math.min(1, normalizedX));
      pointer.y = Math.max(-1, Math.min(1, normalizedY));
      pointer.inside = true;
    };

    const onLeave = () => {
      pointer.inside = false;
    };

    const onBlur = () => {
      pointer.inside = false;
    };

    const render = (timeStamp) => {
      const elapsed = (timeStamp - startedAt) * 0.001;
      program.uniforms.iTime.value = elapsed;

      let shouldContinue = true;

      if (animationType === "hover") {
        const maxPitch = 0.6 * hoverForce;
        const maxYaw = 0.6 * hoverForce;
        targetYaw = (pointer.inside ? -pointer.x : 0) * maxYaw;
        targetPitch = (pointer.inside ? pointer.y : 0) * maxPitch;
        yaw = lerp(yaw, targetYaw, easing);
        pitch = lerp(pitch, targetPitch, easing);
        roll = lerp(roll, 0, 0.1);
        program.uniforms.uRot.value = setMat3FromEuler(
          yaw,
          pitch,
          roll,
          rotationBuffer
        );

        if (noiseIsZero) {
          const settled =
            Math.abs(yaw - targetYaw) < 1e-4 &&
            Math.abs(pitch - targetPitch) < 1e-4 &&
            Math.abs(roll) < 1e-4;
          if (settled) shouldContinue = false;
        }
      } else if (animationType === "3drotate") {
        const scaledTime = elapsed * prismTimeScale;
        yaw = scaledTime * rotationY;
        pitch = Math.sin(scaledTime * rotationX + phaseX) * 0.6;
        roll = Math.sin(scaledTime * rotationZ + phaseZ) * 0.5;
        program.uniforms.uRot.value = setMat3FromEuler(
          yaw,
          pitch,
          roll,
          rotationBuffer
        );
        if (prismTimeScale < 1e-6) shouldContinue = false;
      } else {
        rotationBuffer.set(IDENTITY_ROTATION);
        program.uniforms.uRot.value = rotationBuffer;
        if (prismTimeScale < 1e-6) shouldContinue = false;
      }

      renderer.render({ scene: mesh });

      if (shouldContinue) {
        animationFrame = window.requestAnimationFrame(render);
      } else {
        animationFrame = 0;
      }
    };

    const startAnimation = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(render);
    };

    const stopAnimation = () => {
      if (!animationFrame) return;
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };

    let handlePointerMove = null;
    if (animationType === "hover") {
      handlePointerMove = (event) => {
        onMove(event);
        startAnimation();
      };
      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      window.addEventListener("pointerleave", onLeave);
      window.addEventListener("blur", onBlur);
      program.uniforms.uUseBaseWobble.value = 0;
    } else if (animationType === "3drotate") {
      program.uniforms.uUseBaseWobble.value = 0;
    } else {
      program.uniforms.uUseBaseWobble.value = 1;
    }

    let intersectionObserver = null;
    if (
      suspendWhenOffscreen &&
      typeof IntersectionObserver === "function"
    ) {
      intersectionObserver = new IntersectionObserver((entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) {
          startAnimation();
        } else {
          stopAnimation();
        }
      });
      intersectionObserver.observe(container);
    }

    startAnimation();

    return () => {
      stopAnimation();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener("resize", resize);

      if (animationType === "hover") {
        if (handlePointerMove) {
          window.removeEventListener("pointermove", handlePointerMove);
        }
        window.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("blur", onBlur);
      }

      if (gl.canvas.parentElement === container) {
        container.removeChild(gl.canvas);
      }

      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [
    animationType,
    baseWidth,
    bloom,
    colorFrequency,
    glow,
    height,
    hoverStrength,
    hueShift,
    inertia,
    noise,
    offset?.x,
    offset?.y,
    scale,
    suspendWhenOffscreen,
    timeScale,
    transparent,
    palette,
    paletteMix,
  ]);

  return <div ref={containerRef} className="relative h-full w-full" />;
}
