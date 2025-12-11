import { ClipboardCheck, Cpu, UtensilsCrossed, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Complete Your Profile",
    description: "Share your health goals, dietary preferences, allergies, and any medical conditions for personalized recommendations.",
    link: "/health-profile",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI Analyzes Your Data",
    description: "Our advanced AI processes your information against thousands of nutritional studies and guidelines.",
    link: "/meal-plan",
  },
  {
    number: "03",
    icon: UtensilsCrossed,
    title: "Receive Custom Plans",
    description: "Get personalized meal plans, recipes, and shopping lists tailored specifically to your needs.",
    link: "/meal-plan",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Track & Optimize",
    description: "Monitor your progress and receive adaptive recommendations as your health improves.",
    link: "/tracking",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground font-medium text-sm mb-4">
            Simple Process
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            How <span className="text-gradient">It Works</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Getting started with Smart Nutrition Assistant is easy. 
            Follow these simple steps to transform your health journey.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Link key={step.number} to={step.link} className="relative group">
                <div className="bg-card rounded-2xl p-6 border border-border h-full relative z-10 hover:shadow-card transition-all hover:-translate-y-1 cursor-pointer">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-6 px-3 py-1 gradient-primary rounded-lg">
                    <span className="font-display font-bold text-primary-foreground">{step.number}</span>
                  </div>
                  
                  <div className="pt-4">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                      <step.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
