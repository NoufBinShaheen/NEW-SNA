import { useState } from "react";
import { Leaf, Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const Footer = () => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        description: "Click on the stars to rate your experience.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      toast({
        title: "Thank you for your feedback!",
        description: "Your rating and comments help us improve.",
      });
      setRating(0);
      setFeedback("");
      setIsSubmitting(false);
    }, 1000);
  };

  const footerLinks = {
    Product: ["Features", "Pricing", "Integrations", "API"],
    Company: ["About Us", "Careers", "Blog", "Press"],
    Resources: ["Help Center", "Contact", "Privacy", "Terms"],
    Connect: ["Twitter", "LinkedIn", "Instagram", "YouTube"],
  };

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-background">
                Smart<span className="text-primary">NutritionAssistant</span>
              </span>
            </div>
            <p className="text-background/60 max-w-sm mb-6">
              AI-powered nutrition guidance for healthy living and chronic disease management. 
              Transform your health with personalized plans and expert coaching.
            </p>
            
            {/* Feedback & Rating Section */}
            <div className="bg-background/10 rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-background text-sm">Rate Your Experience</h4>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-background/40"
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-xs text-background/60 ml-2">
                    {rating === 5 ? "Excellent!" : rating === 4 ? "Great!" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
                  </span>
                )}
              </div>
              <Textarea
                placeholder="Share your feedback (optional)..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="bg-background/10 border-background/20 text-background placeholder:text-background/40 text-sm min-h-[60px] resize-none"
                maxLength={500}
              />
              <Button
                size="sm"
                onClick={handleSubmitFeedback}
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-display font-semibold text-background mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    {link === "About Us" ? (
                      <span className="text-background/60 cursor-default">
                        {link}
                      </span>
                    ) : (
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-background/60 hover:text-background transition-colors cursor-pointer"
                      >
                        {link}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/60 text-sm">
            © 2025 Smart Nutrition Assistant. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" onClick={(e) => e.preventDefault()} className="text-background/60 hover:text-background text-sm transition-colors cursor-pointer">
              Privacy Policy
            </a>
            <a href="#" onClick={(e) => e.preventDefault()} className="text-background/60 hover:text-background text-sm transition-colors cursor-pointer">
              Terms of Service
            </a>
            <a href="#" onClick={(e) => e.preventDefault()} className="text-background/60 hover:text-background text-sm transition-colors cursor-pointer">
              Cookie Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
