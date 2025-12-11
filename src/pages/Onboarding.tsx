import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, Target, Activity, MessageCircle, ClipboardList, User, LayoutDashboard, LogOut, Leaf } from "lucide-react";
import { toast } from "sonner";

const options = [
  {
    id: "health-profile",
    title: "Set Up Health Profile",
    description: "Tell us about yourself, your goals, and any health conditions",
    icon: ClipboardList,
    path: "/health-profile",
    recommended: true,
  },
  {
    id: "meal-plan",
    title: "Get AI Meal Plan",
    description: "Receive personalized meal recommendations based on your needs",
    icon: Utensils,
    path: "/meal-plan",
  },
  {
    id: "tracking",
    title: "Track Your Food",
    description: "Log meals and monitor your daily nutrition intake",
    icon: Target,
    path: "/tracking",
  },
  {
    id: "coach",
    title: "Talk to AI Coach",
    description: "Get personalized nutrition advice and guidance",
    icon: MessageCircle,
    path: "/coach",
  },
  {
    id: "dashboard",
    title: "View Dashboard",
    description: "See your progress, stats, and nutrition insights",
    icon: Activity,
    path: "/dashboard",
  },
];

export default function Onboarding() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const firstName = user?.user_metadata?.first_name || "there";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-6">
          {/* Logo and Dashboard */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                Smart<span className="text-primary">NutritionAssistant</span>
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>

          {/* Account and Sign Out */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/account")}>
              <User className="w-4 h-4 mr-2" />
              Account
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 text-foreground">
            Welcome, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto">
            What would you like to do today?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {options.map((option) => (
            <Card
              key={option.id}
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50"
              onClick={() => navigate(option.path)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <option.icon className="h-5 w-5" />
                  </div>
                  {option.recommended && (
                    <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                <CardTitle className="text-lg mt-2">{option.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{option.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
