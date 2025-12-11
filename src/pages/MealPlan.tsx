import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, RefreshCw, UtensilsCrossed, Clock, Flame } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const MealPlan = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [healthProfile, setHealthProfile] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from("health_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        
        setHealthProfile(data);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const generateMealPlan = async () => {
    if (!healthProfile) {
      toast({
        title: "Profile Required",
        description: "Please complete your health profile first.",
        variant: "destructive",
      });
      navigate("/health-profile");
      return;
    }

    setIsGenerating(true);
    setMealPlan("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-meal-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ healthProfile, type: "meal-plan" }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate meal plan");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              setMealPlan((prev) => prev + content);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error: any) {
      console.error("Error generating meal plan:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate meal plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const hasProfile = healthProfile && (healthProfile.age || healthProfile.goals?.length);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered Meal Planning
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Your Personalized Meal Plan
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get custom meal recommendations tailored to your health profile, dietary preferences, and goals.
            </p>
          </div>

          {!hasProfile ? (
            <Card className="border-border/50 shadow-lg text-center py-12">
              <CardContent>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <UtensilsCrossed className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Complete Your Profile First
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We need your health information to create personalized meal plans that work for you.
                </p>
                <Button onClick={() => navigate("/health-profile")} size="lg" className="gap-2">
                  <Sparkles className="w-5 h-5" />
                  Create Health Profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <Card className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Flame className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Daily Target</p>
                      <p className="text-lg font-semibold text-foreground">
                        {healthProfile?.weight && healthProfile?.height
                          ? `~${Math.round(healthProfile.weight * 30)} kcal`
                          : "Set profile"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <UtensilsCrossed className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Diet Type</p>
                      <p className="text-lg font-semibold text-foreground">
                        {healthProfile?.dietary_preferences?.[0] || "Standard"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Meals/Day</p>
                      <p className="text-lg font-semibold text-foreground">5 meals</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Generate Button */}
              <div className="text-center mb-8">
                <Button
                  onClick={generateMealPlan}
                  disabled={isGenerating}
                  size="lg"
                  className="gap-2 gradient-primary shadow-soft hover:shadow-glow transition-shadow"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Your Plan...
                    </>
                  ) : mealPlan ? (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Regenerate Meal Plan
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate My Meal Plan
                    </>
                  )}
                </Button>
              </div>

              {/* Meal Plan Display */}
              {(mealPlan || isGenerating) && (
                <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UtensilsCrossed className="w-5 h-5 text-primary" />
                      Your Custom Meal Plan
                    </CardTitle>
                    <CardDescription>
                      Personalized based on your health profile and goals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                        {mealPlan || (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            AI is crafting your personalized meal plan...
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MealPlan;
