import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain, Heart } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen gradient-hero pt-24 pb-16 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              AI-Powered Nutrition Technology
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-in-up">
              Your Personal
              <span className="text-gradient block">Smart Nutrition</span>
              Assistant
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              AI-powered nutrition guidance tailored for healthy living and chronic disease management. 
              Get personalized meal plans, real-time coaching, and expert support.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <Button size="lg" className="gradient-primary font-semibold shadow-soft hover:shadow-glow transition-all group px-8" asChild>
                <Link to="/health-profile">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="font-semibold border-2"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="flex-1 relative animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative w-full max-w-lg mx-auto">
              {/* Main Card */}
              <div className="bg-card rounded-3xl p-8 shadow-card border border-border">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
                    <Brain className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">AI Analysis Active</h3>
                    <p className="text-sm text-muted-foreground">Personalized for you</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Daily Nutrition Score</span>
                      <span className="text-sm font-bold text-primary">92/100</span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full w-[92%] gradient-primary rounded-full" />
                    </div>
                  </div>

                  <div className="bg-muted rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Meal Plan Progress</span>
                      <span className="text-sm font-bold text-secondary">3/4 meals</span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full w-[75%] gradient-secondary rounded-full" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-primary/10 rounded-xl p-4">
                    <Heart className="w-5 h-5 text-primary" />
                    <span className="text-sm text-foreground">Heart-healthy diet recommendations active</span>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 bg-card rounded-2xl p-4 shadow-card border border-border animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                    <span className="text-lg">🥗</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Next Meal</div>
                    <div className="text-xs text-muted-foreground">In 2 hours</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-12 -left-16 bg-card rounded-2xl p-4 shadow-card border border-border animate-float" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">AI Tip</div>
                    <div className="text-xs text-muted-foreground">Add more fiber today</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
