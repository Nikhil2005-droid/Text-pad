import { useLocation } from "react-router-dom";
import { useWorkspace } from "../hooks/useWorkspace";
import GrainWave from "./GrainWave.jsx";
import Prism from "./Prism.jsx";

const prismPalette = ["#647587", "#bc7441", "#98aa97", "#f2dfca"];
// Switch between: subtleCorporate | warmPremium | visibleArtistic
const ACTIVE_GRAIN_WAVE_PRESET = "warmPremium";

const grainWavePresets = {
  subtleCorporate: {
    waveLayerOpacity: 0.18,
    waveFilter: "saturate(0.74) contrast(0.96) brightness(0.98)",
    wave: {
      speed: 0.26,
      waveCount: 16,
      waveAmplitude: 0.4,
      waveFrequency: 3.2,
      lineThickness: 0.14,
      grainIntensity: 28,
      startColor: "#b9a992",
      endColor: "#8091a1",
      brightness: 0.82,
      speedVariation: 0.004,
      waveWidth: 3.2,
      scale: 0.58,
      opacity: 1,
      suspendWhenOffscreen: true,
    },
    baseBackground:
      "radial-gradient(circle at 18% 14%, rgba(241, 229, 211, 0.42), rgba(241, 229, 211, 0) 28%), radial-gradient(circle at 84% 12%, rgba(219, 227, 234, 0.34), rgba(219, 227, 234, 0) 30%), radial-gradient(circle at 50% 84%, rgba(216, 223, 218, 0.24), rgba(216, 223, 218, 0) 24%), linear-gradient(160deg, #f5efe6 0%, #f2f3ef 48%, #edf2f5 100%)",
    topOverlay:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0.1) 44%, rgba(255, 255, 255, 0.3) 100%)",
  },
  warmPremium: {
    waveLayerOpacity: 0.3,
    waveFilter: "saturate(0.94) contrast(1.02) brightness(0.99)",
    wave: {
      speed: 0.38,
      waveCount: 22,
      waveAmplitude: 0.68,
      waveFrequency: 3.9,
      lineThickness: 0.2,
      grainIntensity: 42,
      startColor: "#ca9b74",
      endColor: "#76899b",
      brightness: 0.94,
      speedVariation: 0.006,
      waveWidth: 3.8,
      scale: 0.72,
      opacity: 1,
      suspendWhenOffscreen: true,
    },
    baseBackground:
      "radial-gradient(circle at 18% 14%, rgba(244, 228, 205, 0.52), rgba(244, 228, 205, 0) 28%), radial-gradient(circle at 84% 12%, rgba(214, 224, 233, 0.42), rgba(214, 224, 233, 0) 30%), radial-gradient(circle at 50% 86%, rgba(212, 223, 214, 0.3), rgba(212, 223, 214, 0) 24%), linear-gradient(160deg, #f5eee4 0%, #f1f2ee 48%, #ecf1f5 100%)",
    topOverlay:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 40%, rgba(255, 255, 255, 0.24) 100%)",
  },
  visibleArtistic: {
    waveLayerOpacity: 0.42,
    waveFilter: "saturate(1.08) contrast(1.08) brightness(1.02)",
    wave: {
      speed: 0.54,
      waveCount: 28,
      waveAmplitude: 0.96,
      waveFrequency: 4.8,
      lineThickness: 0.24,
      grainIntensity: 52,
      startColor: "#d7905c",
      endColor: "#5d7692",
      brightness: 1.04,
      speedVariation: 0.0075,
      waveWidth: 4.4,
      scale: 0.86,
      opacity: 1,
      suspendWhenOffscreen: true,
    },
    baseBackground:
      "radial-gradient(circle at 15% 12%, rgba(246, 223, 194, 0.6), rgba(246, 223, 194, 0) 30%), radial-gradient(circle at 84% 10%, rgba(203, 220, 233, 0.52), rgba(203, 220, 233, 0) 32%), radial-gradient(circle at 52% 84%, rgba(201, 220, 205, 0.38), rgba(201, 220, 205, 0) 28%), linear-gradient(160deg, #f4eadf 0%, #eef0eb 44%, #e7eef5 100%)",
    topOverlay:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.03) 38%, rgba(255, 255, 255, 0.2) 100%)",
  },
};

const prismMask = {
  WebkitMaskImage:
    "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 24%, rgba(0,0,0,0.68) 50%, rgba(0,0,0,0.28) 72%, transparent 88%)",
  maskImage:
    "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 24%, rgba(0,0,0,0.68) 50%, rgba(0,0,0,0.28) 72%, transparent 88%)",
};

function WorkspaceGateBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="workspace-gate-bg-gradient absolute inset-0" />

      <div
        className="absolute inset-0 opacity-[0.9]"
        style={{
          ...prismMask,
          filter: "saturate(1.08) contrast(1.14) brightness(1.04)",
          transform: "translateZ(0)",
        }}
      >
        <Prism
          animationType="rotate"
          timeScale={0.46}
          height={3.6}
          baseWidth={5.4}
          scale={4.2}
          hueShift={0.04}
          colorFrequency={1}
          noise={0}
          glow={1.12}
          bloom={1.04}
          palette={prismPalette}
          paletteMix={0.9}
          offset={{ x: 0, y: -64 }}
        />
      </div>

      <div className="workspace-gate-bg-overlay absolute inset-0" />
    </div>
  );
}

function AmbientAppBackground() {
  const preset =
    grainWavePresets[ACTIVE_GRAIN_WAVE_PRESET] ?? grainWavePresets.warmPremium;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="ambient-app-bg-gradient absolute inset-0" />

      <div
        className="absolute inset-0"
        style={{
          opacity: preset.waveLayerOpacity,
          filter: preset.waveFilter,
        }}
      >
        <GrainWave {...preset.wave} />
      </div>

      <div className="ambient-app-bg-overlay absolute inset-0" />
    </div>
  );
}

export default function GrainientBackground() {
  const location = useLocation();
  const { workspace } = useWorkspace();
  const isWorkspaceRoute =
    location.pathname === "/" || location.pathname === "/workspace";
  const showWorkspaceGateBackground = isWorkspaceRoute && !workspace;

  return showWorkspaceGateBackground ? (
    <WorkspaceGateBackground />
  ) : (
    <AmbientAppBackground />
  );
}
