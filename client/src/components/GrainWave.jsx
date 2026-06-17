import { useEffect, useRef } from "react";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

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
    return { r: 255, g: 255, b: 255 };
  }

  const int = Number.parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function mixColor(start, end, progress) {
  return {
    r: Math.round(start.r + (end.r - start.r) * progress),
    g: Math.round(start.g + (end.g - start.g) * progress),
    b: Math.round(start.b + (end.b - start.b) * progress),
  };
}

function toRgba(color, alpha) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function createNoisePattern(grainIntensity) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const image = context.createImageData(canvas.width, canvas.height);
  const alphaBase = clamp(grainIntensity / 100, 0, 1) * 46;

  for (let i = 0; i < image.data.length; i += 4) {
    const shade = 220 + Math.floor(Math.random() * 35);
    const alpha = Math.floor(Math.random() * alphaBase);
    image.data[i] = shade;
    image.data[i + 1] = shade;
    image.data[i + 2] = shade;
    image.data[i + 3] = alpha;
  }

  context.putImageData(image, 0, 0);
  return context.createPattern(canvas, "repeat");
}

export default function GrainWave({
  speed = 0.5,
  waveCount = 25,
  waveAmplitude = 0.85,
  waveFrequency = 4,
  lineThickness = 0.2,
  grainIntensity = 50,
  startColor = "#ff6666",
  endColor = "#6666ff",
  brightness = 1,
  speedVariation = 0.006,
  waveWidth = 3.5,
  scale = 0.6,
  opacity = 1,
  suspendWhenOffscreen = false,
}) {
  const canvasRef = useRef(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return undefined;

    const startRgb = hexToRgb(startColor);
    const endRgb = hexToRgb(endColor);
    let noisePattern = createNoisePattern(grainIntensity);
    let width = 0;
    let height = 0;
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    let animationFrame = 0;
    let resizeObserver = null;
    let intersectionObserver = null;

    const resize = () => {
      const nextWidth = canvas.clientWidth || 1;
      const nextHeight = canvas.clientHeight || 1;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(nextWidth * dpr);
      canvas.height = Math.floor(nextHeight * dpr);
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      width = nextWidth;
      height = nextHeight;
      noisePattern = createNoisePattern(grainIntensity);
    };

    const draw = (time) => {
      const elapsed = time * 0.001 * speed;
      context.clearRect(0, 0, width, height);

      const lines = Math.max(8, Math.round(waveCount));
      const spacing = height / (lines + 1);
      const amplitudeBase =
        spacing * clamp(waveAmplitude, 0, 2.5) * (0.7 + scale * 0.9);
      const envelopeWidth = clamp(0.16 + waveWidth * 0.035, 0.16, 0.42);
      const xStep = Math.max(6, width / 120);
      const thickness = Math.max(
        0.65,
        lineThickness * (2.6 + scale * 1.8)
      );

      context.lineCap = "round";
      context.lineJoin = "round";

      for (let index = 0; index < lines; index += 1) {
        const progress = lines === 1 ? 0 : index / (lines - 1);
        const color = mixColor(startRgb, endRgb, progress);
        const baseY = spacing * (index + 1);
        const phase = elapsed * (0.9 + index * speedVariation * 36);
        const intensity = 0.45 + 0.55 * (1 - Math.abs(progress - 0.5) * 1.4);
        const alpha =
          clamp((0.1 + intensity * 0.18) * brightness * opacity, 0, 0.42);

        context.beginPath();
        context.lineWidth = thickness * 2.3;
        context.strokeStyle = toRgba(color, alpha * 0.22);

        for (let x = 0; x <= width + xStep; x += xStep) {
          const xProgress = width <= 0 ? 0 : x / width;
          const envelope =
            0.26 +
            0.74 *
              Math.exp(
                -Math.pow((xProgress - 0.5) / envelopeWidth, 2)
              );
          const drift =
            Math.sin(xProgress * Math.PI * 2 * waveFrequency + phase) *
              amplitudeBase *
              envelope *
              intensity +
            Math.cos(xProgress * Math.PI * waveFrequency * 0.5 + phase * 0.7) *
              amplitudeBase *
              0.16;
          const y = baseY + drift;

          if (x === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        context.stroke();

        context.beginPath();
        context.lineWidth = thickness;
        context.strokeStyle = toRgba(color, alpha);
        for (let x = 0; x <= width + xStep; x += xStep) {
          const xProgress = width <= 0 ? 0 : x / width;
          const envelope =
            0.26 +
            0.74 *
              Math.exp(
                -Math.pow((xProgress - 0.5) / envelopeWidth, 2)
              );
          const drift =
            Math.sin(xProgress * Math.PI * 2 * waveFrequency + phase) *
              amplitudeBase *
              envelope *
              intensity +
            Math.cos(xProgress * Math.PI * waveFrequency * 0.5 + phase * 0.7) *
              amplitudeBase *
              0.16;
          const y = baseY + drift;

          if (x === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        context.stroke();
      }

      if (noisePattern) {
        context.save();
        context.globalAlpha = clamp((grainIntensity / 100) * 0.18, 0, 0.18);
        context.fillStyle = noisePattern;
        context.fillRect(0, 0, width, height);
        context.restore();
      }

      if (!suspendWhenOffscreen || visibleRef.current) {
        animationFrame = window.requestAnimationFrame(draw);
      } else {
        animationFrame = 0;
      }
    };

    resize();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    window.addEventListener("resize", resize);

    if (
      suspendWhenOffscreen &&
      typeof IntersectionObserver === "function"
    ) {
      intersectionObserver = new IntersectionObserver((entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        visibleRef.current = isVisible;
        if (isVisible && !animationFrame) {
          animationFrame = window.requestAnimationFrame(draw);
        }
      });
      intersectionObserver.observe(canvas);
    }

    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [
    brightness,
    endColor,
    grainIntensity,
    lineThickness,
    opacity,
    speed,
    speedVariation,
    startColor,
    suspendWhenOffscreen,
    waveAmplitude,
    waveCount,
    waveFrequency,
    waveWidth,
    scale,
  ]);

  return <canvas ref={canvasRef} className="block h-full w-full" />;
}
