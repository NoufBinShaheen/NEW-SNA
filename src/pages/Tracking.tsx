import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, Plus, Flame, Droplets, Apple, Utensils, 
  TrendingUp, Calendar, Check, X 
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

const Tracking = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [healthProfile, setHealthProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [newFood, setNewFood] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterToAdd, setWaterToAdd] = useState("");
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
        // Load health profile and daily tracking in parallel
        const [profileResult, trackingResult] = await Promise.all([
          supabase
            .from("health_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("daily_tracking")
            .select("*")
            .eq("user_id", user.id)
            .eq("date", today)
            .maybeSingle()
        ]);
        
        setHealthProfile(profileResult.data);
        
        if (trackingResult.data) {
          setFoodEntries(trackingResult.data.food_entries as unknown as FoodEntry[]);
          setWaterIntake(trackingResult.data.water_intake);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, today]);

  // Save tracking data whenever it changes
  useEffect(() => {
    const saveTracking = async () => {
      if (!user || isLoading) return;
      
      try {
        await supabase
          .from("daily_tracking")
          .upsert(
            {
              user_id: user.id,
              date: today,
              food_entries: JSON.parse(JSON.stringify(foodEntries)),
              water_intake: waterIntake
            }, 
            { onConflict: 'user_id,date' }
          );
      } catch (error) {
        console.error("Error saving tracking:", error);
      }
    };

    saveTracking();
  }, [user, foodEntries, waterIntake, today, isLoading]);

  const calculateDailyCalories = () => {
    if (!healthProfile?.height || !healthProfile?.weight || !healthProfile?.age || !healthProfile?.gender) return 2000;
    
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

    return Math.round(bmr * (activityMultipliers[healthProfile.activity_level || "sedentary"] || 1.2));
  };

  const dailyTarget = calculateDailyCalories();
  const totalCalories = foodEntries.reduce((sum, entry) => sum + entry.calories, 0);
  const totalProtein = foodEntries.reduce((sum, entry) => sum + entry.protein, 0);
  const totalCarbs = foodEntries.reduce((sum, entry) => sum + entry.carbs, 0);
  const totalFat = foodEntries.reduce((sum, entry) => sum + entry.fat, 0);

  const addFoodEntry = () => {
    if (!newFood.name || !newFood.calories) {
      toast({
        title: "Missing Information",
        description: "Please enter at least food name and calories.",
        variant: "destructive",
      });
      return;
    }

    const entry: FoodEntry = {
      id: Date.now().toString(),
      name: newFood.name,
      calories: parseInt(newFood.calories) || 0,
      protein: parseInt(newFood.protein) || 0,
      carbs: parseInt(newFood.carbs) || 0,
      fat: parseInt(newFood.fat) || 0,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setFoodEntries([...foodEntries, entry]);
    setNewFood({ name: "", calories: "", protein: "", carbs: "", fat: "" });
    
    toast({
      title: "Food Added",
      description: `${entry.name} has been logged.`,
    });
  };

  const removeEntry = (id: string) => {
    setFoodEntries(foodEntries.filter(e => e.id !== id));
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Daily Tracking
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Calories</span>
                </div>
                <div className="text-2xl font-bold text-foreground mb-2">
                  {totalCalories} / {dailyTarget}
                </div>
                <Progress value={(totalCalories / dailyTarget) * 100} className="h-2" />
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🥩</span>
                  <span className="text-sm text-muted-foreground">Protein</span>
                </div>
                <div className="text-2xl font-bold text-foreground mb-2">
                  {totalProtein}g / {Math.round(dailyTarget * 0.25 / 4)}g
                </div>
                <Progress value={(totalProtein / (dailyTarget * 0.25 / 4)) * 100} className="h-2" />
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🍞</span>
                  <span className="text-sm text-muted-foreground">Carbs</span>
                </div>
                <div className="text-2xl font-bold text-foreground mb-2">
                  {totalCarbs}g / {Math.round(dailyTarget * 0.45 / 4)}g
                </div>
                <Progress value={(totalCarbs / (dailyTarget * 0.45 / 4)) * 100} className="h-2" />
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-5 h-5 text-secondary" />
                  <span className="text-sm text-muted-foreground">Water</span>
                </div>
                <div className="text-2xl font-bold text-foreground mb-2">
                  {waterIntake} / 2000 ml
                </div>
                <Progress value={(waterIntake / 2000) * 100} className="h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Water Tracker */}
          <Card className="border-border/50 shadow-lg mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplets className="w-5 h-5 text-secondary" />
                Water Intake
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 flex-wrap">
                <Input
                  placeholder="Amount (ml)"
                  type="number"
                  value={waterToAdd}
                  onChange={(e) => setWaterToAdd(e.target.value)}
                  className="w-32"
                />
                <Button 
                  onClick={() => {
                    if (waterToAdd) {
                      setWaterIntake(waterIntake + parseInt(waterToAdd));
                      setWaterToAdd("");
                    }
                  }}
                  variant="secondary"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
                <div className="flex gap-2 ml-auto">
                  {[250, 500].map((ml) => (
                    <Button
                      key={ml}
                      variant="outline"
                      size="sm"
                      onClick={() => setWaterIntake(waterIntake + ml)}
                    >
                      +{ml}ml
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Food */}
          <Card className="border-border/50 shadow-lg mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Log Food
              </CardTitle>
              <CardDescription>Track what you eat throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                <Input
                  placeholder="Food name"
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  className="col-span-2"
                />
                <Input
                  placeholder="Calories"
                  type="number"
                  value={newFood.calories}
                  onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })}
                />
                <Input
                  placeholder="Protein (g)"
                  type="number"
                  value={newFood.protein}
                  onChange={(e) => setNewFood({ ...newFood, protein: e.target.value })}
                />
                <Input
                  placeholder="Carbs (g)"
                  type="number"
                  value={newFood.carbs}
                  onChange={(e) => setNewFood({ ...newFood, carbs: e.target.value })}
                />
                <Input
                  placeholder="Fat (g)"
                  type="number"
                  value={newFood.fat}
                  onChange={(e) => setNewFood({ ...newFood, fat: e.target.value })}
                />
                <Button onClick={addFoodEntry} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Food Log */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                Today's Food Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {foodEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Apple className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No food logged yet. Start tracking your meals!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {foodEntries.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Utensils className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{entry.name}</p>
                          <p className="text-sm text-muted-foreground">{entry.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{entry.calories} kcal</p>
                          <p className="text-xs text-muted-foreground">
                            P: {entry.protein}g | C: {entry.carbs}g | F: {entry.fat}g
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEntry(entry.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Tracking;
