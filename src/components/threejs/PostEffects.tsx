import { EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <ToneMapping
        mode={ToneMappingMode.ACES_FILMIC}
        exposure={1.05}
      />
      <Vignette
        offset={0.3}
        darkness={0.6}
        eskil={false}
      />
    </EffectComposer>
  );
}
