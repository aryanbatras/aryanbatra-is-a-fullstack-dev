import LevaPanel from "@/components/utility/LevaPanel";
import AnimatedText from "@/components/animations/AnimatedText";
import ModelContainer from "@/components/threejs/ModelContainer";
export default function One() {
  return (
    <>
      <LevaPanel />
      <AnimatedText
        content={["Frontend Engineer", "Systems Engineer", "Architect"]}
      />
      <ModelContainer />
    </>
  );
}
