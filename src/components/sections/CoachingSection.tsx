import { Button } from "@/components/ui/button";
import { MessageCircle, Video, Mic, Calendar, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const coachingFeatures = [
  "Unlimited AI chat support 24/7",
  
  "Personalized goal setting sessions",
  "Real-time meal feedback and adjustments",
  "Crisis support for health concerns",
  "Progress review and strategy updates",
];

const CoachingSection = () => {
  return (
    <section id="coaching" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Visual Content */}
          <div className="flex-1 w-full">
            <div className="relative max-w-md mx-auto lg:mx-0">
              {/* Main Card */}
              <div className="bg-card rounded-3xl p-8 shadow-card border border-border">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl gradient-secondary flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-xl text-foreground">Personal Coach</h3>
                    <p className="text-muted-foreground">Always here to help</p>
                  </div>
                </div>

                {/* Chat Preview */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full gradient-primary flex-shrink-0" />
                    <div className="bg-muted rounded-2xl rounded-tl-sm p-3 max-w-[80%]">
                      <p className="text-sm text-foreground">How can I reduce my sugar intake without feeling deprived?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full gradient-secondary flex-shrink-0" />
                    <div className="bg-primary/10 rounded-2xl rounded-tr-sm p-3 max-w-[80%]">
                      <p className="text-sm text-foreground">Great question! Let me share 5 strategies that work well for diabetes management...</p>
                    </div>
                  </div>
                </div>

                {/* Communication Options */}
                <div className="flex items-center gap-3">
                  <Link to="/coach" className="flex-1">
                    <Button size="sm" variant="outline" className="w-full gap-2">
                      <Mic className="w-4 h-4" />
                      Voice Chat
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Floating Schedule Card */}
              <div className="absolute -top-6 -right-6 bg-card rounded-2xl p-4 shadow-card border border-border animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Next Session</div>
                    <div className="text-xs text-muted-foreground">Tomorrow, 10:00 AM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary font-medium text-sm mb-4">
              Personal Coaching
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Your Dedicated
              <span className="text-gradient"> Nutrition Coach</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Combine AI-powered guidance with human expertise. Our certified nutritionists 
              work alongside your AI assistant to ensure you achieve your health goals.
            </p>

            <ul className="space-y-3 mb-8">
              {coachingFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 justify-center lg:justify-start">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Link to="/coach">
              <Button size="lg" className="gradient-secondary font-semibold shadow-soft">
                Meet Your Coach
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoachingSection;
