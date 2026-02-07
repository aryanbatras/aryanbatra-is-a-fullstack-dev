import { EffectComposer, Bloom, DepthOfField, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { EffectsProps } from "@/types";
import { EFFECTS_DEFAULTS } from "@/constants";

export default function Effects({
  bloomEnabled = EFFECTS_DEFAULTS.bloomIntensity > 0,
  bloomIntensity = EFFECTS_DEFAULTS.bloomIntensity,
  bloomLuminanceThreshold = EFFECTS_DEFAULTS.bloomLuminanceThreshold,
  bloomRadius = EFFECTS_DEFAULTS.bloomRadius,
  depthOfFieldEnabled = true,
  depthOfFieldFocusDistance = EFFECTS_DEFAULTS.depthOfFieldFocusDistance,
  depthOfFieldFocalLength = EFFECTS_DEFAULTS.depthOfFieldFocalLength,
  depthOfFieldBokehScale = EFFECTS_DEFAULTS.depthOfFieldBokehScale,
  vignetteEnabled = true,
  vignetteOffset = EFFECTS_DEFAULTS.vignetteOffset,
  vignetteDarkness = EFFECTS_DEFAULTS.vignetteDarkness,
  chromaticAberrationEnabled = false,
  chromaticAberrationOffset = EFFECTS_DEFAULTS.chromaticAberrationOffset
}: EffectsProps) {
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
