import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, RefreshCw, UtensilsCrossed, Clock, Flame, AlertTriangle, Coffee, Sun, Sunset, Moon, Apple } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const MealPlan = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
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
            Authorization: `Bearer ${session?.access_token}`,
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
                        {healthProfile?.custom_calories
                          ? `${healthProfile.custom_calories} kcal`
                          : healthProfile?.weight
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
                      <p className="text-lg font-semibold text-foreground">
                        {healthProfile?.meals_per_day || 3} meals
                      </p>
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
                <Card className="border-border/50 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <UtensilsCrossed className="w-5 h-5 text-primary" />
                      </div>
                      Your Custom Meal Plan
                    </CardTitle>
                    <CardDescription>
                      Personalized based on your health profile and goals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {mealPlan ? (
                      <div className="space-y-4">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-2xl font-bold text-foreground mt-6 mb-4 pb-2 border-b border-border/50 flex items-center gap-2">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <div className="mt-8 mb-4">
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-3 bg-gradient-to-r from-primary/10 to-transparent p-3 rounded-lg">
                                  <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <UtensilsCrossed className="w-4 h-4 text-primary" />
                                  </span>
                                  {children}
                                </h2>
                              </div>
                            ),
                            h3: ({ children }) => {
                              const text = String(children);
                              let icon = <Coffee className="w-4 h-4" />;
                              let bgColor = "bg-amber-500/10";
                              let textColor = "text-amber-600 dark:text-amber-400";
                              
                              if (text.toLowerCase().includes("breakfast")) {
                                icon = <Coffee className="w-4 h-4" />;
                                bgColor = "bg-amber-500/10";
                                textColor = "text-amber-600 dark:text-amber-400";
                              } else if (text.toLowerCase().includes("lunch")) {
                                icon = <Sun className="w-4 h-4" />;
                                bgColor = "bg-orange-500/10";
                                textColor = "text-orange-600 dark:text-orange-400";
                              } else if (text.toLowerCase().includes("dinner")) {
                                icon = <Moon className="w-4 h-4" />;
                                bgColor = "bg-indigo-500/10";
                                textColor = "text-indigo-600 dark:text-indigo-400";
                              } else if (text.toLowerCase().includes("snack")) {
                                icon = <Apple className="w-4 h-4" />;
                                bgColor = "bg-green-500/10";
                                textColor = "text-green-600 dark:text-green-400";
                              }
                              
                              return (
                                <Card className="mt-4 border-border/30 shadow-sm overflow-hidden">
                                  <CardHeader className={`py-3 px-4 ${bgColor}`}>
                                    <h3 className={`text-base font-semibold flex items-center gap-2 ${textColor}`}>
                                      {icon}
                                      {children}
                                    </h3>
                                  </CardHeader>
                                </Card>
                              );
                            },
                            p: ({ children }) => {
                              const text = String(children);
                              if (text.includes("IMPORTANT") || text.includes("🚨")) {
                                return (
                                  <Card className="my-4 border-amber-500/30 bg-amber-500/5">
                                    <CardContent className="p-4 flex gap-3">
                                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                      <p className="text-sm text-foreground/90 leading-relaxed">{children}</p>
                                    </CardContent>
                                  </Card>
                                );
                              }
                              return <p className="text-foreground/80 leading-relaxed my-3">{children}</p>;
                            },
                            ul: ({ children }) => (
                              <ul className="space-y-2 my-3 ml-1">{children}</ul>
                            ),
                            li: ({ children }) => (
                              <li className="flex items-start gap-3 text-foreground/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <span className="leading-relaxed">{children}</span>
                              </li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-foreground">{children}</strong>
                            ),
                            em: ({ children }) => (
                              <em className="text-muted-foreground italic">{children}</em>
                            ),
                            hr: () => (
                              <hr className="my-6 border-border/50" />
                            ),
                          }}
                        >
                          {mealPlan}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span>AI is crafting your personalized meal plan...</span>
                      </div>
                    )}
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
