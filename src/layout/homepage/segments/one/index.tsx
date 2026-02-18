import LevaPanel from "@/components/utility/LevaPanel";
import AnimatedText from "@/components/animations/AnimatedText";
import ModelContainer from "@/components/threejs/ModelContainer";
export default function One() {
  return (
    <>
      <LevaPanel />
      <AnimatedText
        content={[
          "Full-Stack Developer", 
          "Creative Engineer", 
          "3D Graphics Enthusiast",
          "Open Source Contributor",
          "Problem Solver",
          "Innovation Architect"
        ]}
      />
      <ModelContainer />
    </>
  );
}
