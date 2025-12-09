import { Brain, Utensils, LineChart, MessageSquare, Calendar, Shield } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Advanced machine learning analyzes your health data to create personalized nutrition recommendations.",
    color: "primary",
  },
  {
    icon: Utensils,
    title: "Smart Meal Planning",
    description: "Get customized meal plans that adapt to your preferences, allergies, and health goals.",
    color: "secondary",
  },
  {
    icon: LineChart,
    title: "Progress Tracking",
    description: "Monitor your nutrition journey with detailed analytics and visual progress reports.",
    color: "accent",
  },
  {
    icon: MessageSquare,
    title: "24/7 AI Coach",
    description: "Chat with your AI nutrition assistant anytime for instant guidance and support.",
    color: "primary",
  },
  {
    icon: Calendar,
    title: "Adaptive Scheduling",
    description: "Meal plans that fit your lifestyle with flexible timing and easy adjustments.",
    color: "secondary",
  },
  {
    icon: Shield,
    title: "Medical Integration",
    description: "Safely integrates with your health conditions for medically-informed recommendations.",
    color: "accent",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary font-medium text-sm mb-4">
            Powerful Features
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need for
            <span className="text-gradient"> Optimal Nutrition</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Our comprehensive platform combines cutting-edge AI technology with nutritional science 
            to deliver personalized guidance that works for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-card rounded-2xl p-6 border border-border hover:shadow-card transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                  feature.color === "primary"
                    ? "bg-primary/10"
                    : feature.color === "secondary"
                    ? "bg-secondary/10"
                    : "bg-accent/20"
                }`}
              >
                <feature.icon
                  className={`w-7 h-7 ${
                    feature.color === "primary"
                      ? "text-primary"
                      : feature.color === "secondary"
                      ? "text-secondary"
                      : "text-accent-foreground"
                  }`}
                />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
