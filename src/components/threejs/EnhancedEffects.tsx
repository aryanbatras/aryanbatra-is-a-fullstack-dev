import { EffectComposer, Bloom, DepthOfField, Vignette, ChromaticAberration } from "@react-three/postprocessing";

interface EnhancedEffectsProps {
  bloomEnabled: boolean
  bloomIntensity: number
  bloomLuminanceThreshold: number
  bloomRadius: number
  depthOfFieldEnabled: boolean
  depthOfFieldFocusDistance: number
  depthOfFieldFocalLength: number
  depthOfFieldBokehScale: number
  vignetteEnabled: boolean
  vignetteOffset: number
  vignetteDarkness: number
  chromaticAberrationEnabled: boolean
  chromaticAberrationOffset: [number, number]
}

export default function EnhancedEffects({
  bloomEnabled,
  bloomIntensity,
  bloomLuminanceThreshold,
  bloomRadius,
  depthOfFieldEnabled,
  depthOfFieldFocusDistance,
  depthOfFieldFocalLength,
  depthOfFieldBokehScale,
  vignetteEnabled,
  vignetteOffset,
  vignetteDarkness,
  chromaticAberrationEnabled,
  chromaticAberrationOffset
}: EnhancedEffectsProps) {
  const effects = [];
  
  if (bloomEnabled) {
    effects.push(
      <Bloom
        key="bloom"
        intensity={bloomIntensity}
        luminanceThreshold={bloomLuminanceThreshold}
        luminanceSmoothing={0.9}
        radius={bloomRadius}
      />
    );
  }
  
  if (depthOfFieldEnabled) {
    effects.push(
      <DepthOfField
        key="dof"
        focusDistance={depthOfFieldFocusDistance}
        focalLength={depthOfFieldFocalLength}
        bokehScale={depthOfFieldBokehScale}
        height={640}
      />
    );
  }
  
  if (vignetteEnabled) {
    effects.push(
      <Vignette
        key="vignette"
        eskil={false}
        offset={vignetteOffset}
        darkness={vignetteDarkness}
      />
    );
  }
  
  if (chromaticAberrationEnabled) {
    effects.push(
      <ChromaticAberration
        key="ca"
        offset={chromaticAberrationOffset}
        radialModulation={true}
        modulationOffset={0.5}
      />
    );
  }

  return <EffectComposer>{effects}</EffectComposer>;
}
