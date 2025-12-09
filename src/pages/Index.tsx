import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import ConditionsSection from "@/components/sections/ConditionsSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import CoachingSection from "@/components/sections/CoachingSection";
import CTASection from "@/components/sections/CTASection";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ConditionsSection />
        <HowItWorksSection />
        <CoachingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
