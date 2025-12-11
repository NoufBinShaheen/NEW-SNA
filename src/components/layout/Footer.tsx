import { Leaf } from "lucide-react";

const Footer = () => {
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
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-background">
                Smart<span className="text-primary">NutritionAssistant</span>
              </span>
            </a>
            <p className="text-background/60 max-w-sm mb-6">
              AI-powered nutrition guidance for healthy living and chronic disease management. 
              Transform your health with personalized plans and expert coaching.
            </p>
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-background/10 rounded-full text-sm text-background/80">
                🏆 #1 Nutrition App
              </div>
              <div className="px-3 py-1 bg-background/10 rounded-full text-sm text-background/80">
                ⭐ 4.9 Rating
              </div>
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
                        className="text-background/60 hover:text-background transition-colors"
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
            <a href="#" className="text-background/60 hover:text-background text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-background/60 hover:text-background text-sm transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-background/60 hover:text-background text-sm transition-colors">
              Cookie Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
