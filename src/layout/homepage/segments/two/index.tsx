import { useTheme } from "@/context/ThemeContext";
import Carousel from "@/components/carousel/Carousel";
import { AnimatedTestimonials } from "@/components/testimonials/AnimatedTestimonials";
import { testimonials } from "@/data/testimonials";
import Profile from "@/components/profile/Profile";
export default function Two() {
 const { theme } = useTheme();
  return (
    <>
      <Profile/>
      <AnimatedTestimonials testimonials={testimonials} autoplay={false} />
      <Carousel />
    </>
  );
}
