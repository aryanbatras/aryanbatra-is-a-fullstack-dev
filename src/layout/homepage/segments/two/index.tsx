import { useTheme } from "@/context/ThemeContext";
import Carousel from "@/components/carousel/Carousel";
import { AnimatedTestimonials } from "@/components/testimonials/AnimatedTestimonials";
import { testimonials } from "@/data/testimonials";

export default function Two() {
 const { theme } = useTheme();
  return (
    <>
      <Carousel />
      <AnimatedTestimonials testimonials={testimonials} autoplay={false} />
    </>
  );
}
