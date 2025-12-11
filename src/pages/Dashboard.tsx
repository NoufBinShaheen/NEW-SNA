import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, Heart, Utensils, Target, Activity, Scale, Ruler, 
  Calendar, Edit, Sparkles, Apple, Droplets, Flame, Loader2
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface HealthProfile {
  age: number | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  activity_level: string | null;
  health_conditions: string[] | null;
  medications: string | null;
  dietary_preferences: string[] | null;
  allergies: string[] | null;
  disliked_foods: string | null;
  goals: string[] | null;
  target_weight: number | null;
  timeline: string | null;
  additional_notes: string | null;
}

interface Profile {
  first_name: string | null;
  last_name: string | null;
}

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

interface DailyTracking {
  food_entries: FoodEntry[];
  water_intake: number;
}

const activityLevelLabels: Record<string, string> = {
  sedentary: "Sedentary",
  light: "Lightly Active",
  moderate: "Moderately Active",
  very: "Very Active",
  extra: "Extra Active"
};

const timelineLabels: Record<string, string> = {
  "1month": "1 Month",
  "3months": "3 Months",
  "6months": "6 Months",
  "1year": "1 Year",
  "ongoing": "Ongoing"
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [dailyTracking, setDailyTracking] = useState<DailyTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        const [profileRes, healthRes, trackingRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("health_profiles").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("daily_tracking").select("*").eq("user_id", user.id).eq("date", today).maybeSingle()
        ]);

        setProfile(profileRes.data);
        setHealthProfile(healthRes.data);
        
        if (trackingRes.data) {
          setDailyTracking({
            food_entries: trackingRes.data.food_entries as unknown as FoodEntry[],
            water_intake: trackingRes.data.water_intake
          });
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, today]);

  // Calculate BMI
  const calculateBMI = () => {
    if (!healthProfile?.height || !healthProfile?.weight) return null;
    const heightInMeters = healthProfile.height / 100;
    return (healthProfile.weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  // Calculate daily calorie needs (simplified Harris-Benedict)
  const calculateCalories = () => {
    if (!healthProfile?.height || !healthProfile?.weight || !healthProfile?.age || !healthProfile?.gender) return null;
    
    let bmr: number;
    if (healthProfile.gender === "male") {
      bmr = 88.362 + (13.397 * healthProfile.weight) + (4.799 * healthProfile.height) - (5.677 * healthProfile.age);
    } else {
      bmr = 447.593 + (9.247 * healthProfile.weight) + (3.098 * healthProfile.height) - (4.330 * healthProfile.age);
    }

    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very: 1.725,
      extra: 1.9
    };

    const multiplier = activityMultipliers[healthProfile.activity_level || "sedentary"] || 1.2;
    return Math.round(bmr * multiplier);
  };

  const bmi = calculateBMI();
  const dailyCalories = calculateCalories();
  
  // Calculate consumed totals from today's tracking
  const consumedCalories = dailyTracking?.food_entries?.reduce((sum, e) => sum + e.calories, 0) || 0;
  const consumedProtein = dailyTracking?.food_entries?.reduce((sum, e) => sum + e.protein, 0) || 0;
  const consumedCarbs = dailyTracking?.food_entries?.reduce((sum, e) => sum + e.carbs, 0) || 0;
  const consumedFat = dailyTracking?.food_entries?.reduce((sum, e) => sum + e.fat, 0) || 0;
  const waterIntake = dailyTracking?.water_intake || 0;
  
  // Target macros (default to 2000 calories if not calculated)
  const effectiveCalories = dailyCalories || 2000;
  const targetProtein = Math.round(effectiveCalories * 0.25 / 4);
  const targetCarbs = Math.round(effectiveCalories * 0.45 / 4);
  const targetFat = Math.round(effectiveCalories * 0.30 / 9);

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
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Your personalized nutrition dashboard
              </p>
            </div>
            <Link to="/health-profile">
              <Button className="gap-2">
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            </Link>
          </div>

          {!hasProfile ? (
            /* No Profile State */
            <Card className="border-border/50 shadow-lg text-center py-12">
              <CardContent>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Complete Your Health Profile
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  To get personalized nutrition recommendations, please complete your health profile first.
                </p>
                <Link to="/health-profile">
                  <Button size="lg" className="gap-2">
                    <Sparkles className="w-5 h-5" />
                    Create Health Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Scale className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className="text-lg font-semibold text-foreground">
                        {healthProfile?.weight ? `${healthProfile.weight} kg` : "—"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Ruler className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Height</p>
                      <p className="text-lg font-semibold text-foreground">
                        {healthProfile?.height ? `${healthProfile.height} cm` : "—"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">BMI</p>
                      <p className="text-lg font-semibold text-foreground">
                        {bmi || "—"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <Flame className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Daily Calories</p>
                      <p className="text-lg font-semibold text-foreground">
                        {dailyCalories || 2000} kcal
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Progress */}
              <Card className="border-border/50 shadow-lg mb-8">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">Today's Progress</CardTitle>
                    </div>
                    <Link to="/tracking">
                      <Button variant="ghost" size="sm" className="text-primary">
                        View Details
                      </Button>
                    </Link>
                  </div>
                  <CardDescription>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Calories */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Calories</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {consumedCalories} <span className="text-sm font-normal text-muted-foreground">/ {effectiveCalories}</span>
                      </p>
                      <Progress value={(consumedCalories / effectiveCalories) * 100} className="h-2" />
                    </div>
                    
                    {/* Protein */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🥩</span>
                        <span className="text-sm text-muted-foreground">Protein</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {consumedProtein}g <span className="text-sm font-normal text-muted-foreground">/ {targetProtein}g</span>
                      </p>
                      <Progress value={(consumedProtein / targetProtein) * 100} className="h-2" />
                    </div>
                    
                    {/* Carbs */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🍞</span>
                        <span className="text-sm text-muted-foreground">Carbs</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {consumedCarbs}g <span className="text-sm font-normal text-muted-foreground">/ {targetCarbs}g</span>
                      </p>
                      <Progress value={(consumedCarbs / targetCarbs) * 100} className="h-2" />
                    </div>
                    
                    {/* Fat */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🥑</span>
                        <span className="text-sm text-muted-foreground">Fat</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {consumedFat}g <span className="text-sm font-normal text-muted-foreground">/ {targetFat}g</span>
                      </p>
                      <Progress value={(consumedFat / targetFat) * 100} className="h-2" />
                    </div>
                    
                    {/* Water */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-secondary" />
                        <span className="text-sm text-muted-foreground">Water</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {waterIntake} <span className="text-sm font-normal text-muted-foreground">/ 2000 ml</span>
                      </p>
                      <Progress value={(waterIntake / 2000) * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Health Conditions */}
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">Health Conditions</CardTitle>
                    </div>
                    <CardDescription>
                      Your nutrition plan is optimized for these conditions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {healthProfile?.health_conditions?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {healthProfile.health_conditions.map((condition) => (
                          <Badge key={condition} variant="secondary" className="text-sm">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No conditions specified</p>
                    )}
                  </CardContent>
                </Card>

                {/* Dietary Preferences */}
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-secondary" />
                      <CardTitle className="text-lg">Dietary Preferences</CardTitle>
                    </div>
                    <CardDescription>
                      Your preferred eating style
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {healthProfile?.dietary_preferences?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {healthProfile.dietary_preferences.map((pref) => (
                          <Badge key={pref} variant="outline" className="text-sm">
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No preferences specified</p>
                    )}
                  </CardContent>
                </Card>

                {/* Goals */}
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-accent" />
                      <CardTitle className="text-lg">Your Goals</CardTitle>
                    </div>
                    <CardDescription>
                      What you're working towards
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {healthProfile?.goals?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {healthProfile.goals.map((goal) => (
                          <Badge key={goal} className="text-sm bg-primary/10 text-primary hover:bg-primary/20">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No goals specified</p>
                    )}
                    
                    {healthProfile?.target_weight && (
                      <div className="pt-2 border-t border-border">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Target Weight</span>
                          <span className="font-medium text-foreground">{healthProfile.target_weight} kg</span>
                        </div>
                        {healthProfile.weight && (
                          <Progress 
                            value={Math.min(100, (healthProfile.target_weight / healthProfile.weight) * 100)} 
                            className="h-2"
                          />
                        )}
                      </div>
                    )}

                    {healthProfile?.timeline && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Timeline:</span>
                        <span className="font-medium text-foreground">
                          {timelineLabels[healthProfile.timeline] || healthProfile.timeline}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Allergies & Restrictions */}
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Apple className="w-5 h-5 text-destructive" />
                      <CardTitle className="text-lg">Allergies & Restrictions</CardTitle>
                    </div>
                    <CardDescription>
                      Foods to avoid in your meal plans
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {healthProfile?.allergies?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {healthProfile.allergies.map((allergy) => (
                          <Badge key={allergy} variant="destructive" className="text-sm">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No allergies specified</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Daily Recommendations Preview */}
              <Card className="border-border/50 shadow-lg mt-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <CardTitle>Daily Nutrition Targets</CardTitle>
                  </div>
                  <CardDescription>
                    Based on your profile and goals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <Flame className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">{dailyCalories || 2000}</p>
                      <p className="text-sm text-muted-foreground">Calories</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-2">
                        <span className="text-xl">🥩</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {targetProtein || Math.round(2000 * 0.25 / 4)}g
                      </p>
                      <p className="text-sm text-muted-foreground">Protein</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
                        <span className="text-xl">🍞</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {targetCarbs || Math.round(2000 * 0.45 / 4)}g
                      </p>
                      <p className="text-sm text-muted-foreground">Carbs</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
                        <Droplets className="w-6 h-6 text-destructive" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {targetFat || Math.round(2000 * 0.30 / 9)}g
                      </p>
                      <p className="text-sm text-muted-foreground">Fat</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-border/50 shadow-lg mt-6">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Jump to key features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to="/meal-plan">
                      <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                        <Utensils className="w-6 h-6 text-primary" />
                        <span>Generate Meal Plan</span>
                      </Button>
                    </Link>
                    <Link to="/tracking">
                      <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                        <Activity className="w-6 h-6 text-secondary" />
                        <span>Track Today's Food</span>
                      </Button>
                    </Link>
                    <Link to="/coach">
                      <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                        <Sparkles className="w-6 h-6 text-accent-foreground" />
                        <span>Chat with AI Coach</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
