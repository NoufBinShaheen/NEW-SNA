import { Heart, Droplets, Activity, Pill, Scale, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

const conditions = [
  {
    icon: Heart,
    name: "Heart Disease",
    description: "Heart-healthy diets optimized for cardiovascular wellness",
    color: "from-red-500/20 to-pink-500/20",
  },
  {
    icon: Droplets,
    name: "Diabetes",
    description: "Blood sugar management through balanced nutrition",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: Activity,
    name: "Hypertension",
    description: "Low-sodium plans for blood pressure control",
    color: "from-purple-500/20 to-violet-500/20",
  },
  {
    icon: Pill,
    name: "Kidney Disease",
    description: "Renal-friendly nutrition with proper restrictions",
    color: "from-emerald-500/20 to-teal-500/20",
  },
  {
    icon: Scale,
    name: "Obesity",
    description: "Sustainable weight management programs",
    color: "from-orange-500/20 to-amber-500/20",
  },
  {
    icon: Stethoscope,
    name: "General Wellness",
    description: "Optimal nutrition for healthy individuals",
    color: "from-primary/20 to-secondary/20",
  },
];

const ConditionsSection = () => {
  return (
    <section id="conditions" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
              Specialized Support
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Tailored for Your
              <span className="text-gradient"> Health Needs</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Whether you're managing a chronic condition or optimizing your health, 
              our AI creates nutrition plans backed by medical research and personalized 
              to your specific requirements.
            </p>
            <Button size="lg" className="gradient-primary font-semibold shadow-soft">
              Find Your Plan
            </Button>
          </div>

          {/* Conditions Grid */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {conditions.map((condition, index) => (
                <div
                  key={condition.name}
                  className={`group relative bg-card rounded-2xl p-5 border border-border hover:shadow-card transition-all duration-300 overflow-hidden cursor-pointer`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${condition.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-border">
                        <condition.icon className="w-5 h-5 text-foreground" />
                      </div>
                      <h3 className="font-display font-semibold text-foreground">
                        {condition.name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {condition.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConditionsSection;
