import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Loader2, Plus, Flame, Droplets, Apple, Utensils, 
  CalendarIcon, Check, X, CheckCircle2 
} from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

interface DayTrackingData {
  date: string;
  food_entries: FoodEntry[];
  water_intake: number;
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [monthTrackingData, setMonthTrackingData] = useState<DayTrackingData[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const isToday = isSameDay(selectedDate, new Date());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Load month tracking data for calendar indicators
  useEffect(() => {
    const loadMonthData = async () => {
      if (!user) return;
      
      const monthStart = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
      
      const { data } = await supabase
        .from("daily_tracking")
        .select("date, food_entries, water_intake")
        .eq("user_id", user.id)
        .gte("date", monthStart)
        .lte("date", monthEnd);
      
      if (data) {
        setMonthTrackingData(data as unknown as DayTrackingData[]);
      }
    };
    
    loadMonthData();
  }, [user, selectedDate]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
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
            .eq("date", formattedDate)
            .maybeSingle()
        ]);
        
        setHealthProfile(profileResult.data);
        
        if (trackingResult.data) {
          setFoodEntries(trackingResult.data.food_entries as unknown as FoodEntry[]);
          setWaterIntake(trackingResult.data.water_intake);
        } else {
          setFoodEntries([]);
          setWaterIntake(0);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, formattedDate]);

  // Save tracking data whenever it changes (only for today)
  useEffect(() => {
    const saveTracking = async () => {
      if (!user || isLoading || !isToday) return;
      
      try {
        await supabase
          .from("daily_tracking")
          .upsert(
            {
              user_id: user.id,
              date: formattedDate,
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
  }, [user, foodEntries, waterIntake, formattedDate, isLoading, isToday]);

  // Helper to check if a day has logs and completion status
  const getDayStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = monthTrackingData.find(d => d.date === dateStr);
    if (!dayData) return null;
    
    const hasLogs = dayData.food_entries.length > 0 || dayData.water_intake > 0;
    const totalCalories = dayData.food_entries.reduce((sum, e) => sum + e.calories, 0);
    const isComplete = totalCalories >= dailyTarget * 0.8; // 80% of target = complete
    
    return { hasLogs, isComplete };
  };

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
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="mt-2 gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    {!isToday && <span className="text-xs text-muted-foreground">(viewing history)</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setIsLoading(true);
                        setCalendarOpen(false);
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    className="pointer-events-auto"
                    modifiers={{
                      logged: monthTrackingData
                        .filter(d => d.food_entries.length > 0 || d.water_intake > 0)
                        .map(d => new Date(d.date + 'T00:00:00')),
                      complete: monthTrackingData
                        .filter(d => {
                          const totalCal = d.food_entries.reduce((sum, e) => sum + e.calories, 0);
                          return totalCal >= dailyTarget * 0.8;
                        })
                        .map(d => new Date(d.date + 'T00:00:00')),
                    }}
                    modifiersStyles={{
                      logged: { 
                        backgroundColor: 'hsl(var(--primary) / 0.2)',
                        borderRadius: '50%'
                      },
                      complete: { 
                        backgroundColor: 'hsl(142.1 76.2% 36.3% / 0.3)',
                        borderRadius: '50%'
                      },
                    }}
                  />
                  <div className="p-3 border-t border-border text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-primary/20" />
                      <span>Has logged entries</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500/30" />
                      <span>Completed (≥80% calories)</span>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {!isToday && (
              <Button onClick={() => setSelectedDate(new Date())} variant="secondary">
                Back to Today
              </Button>
            )}
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
              {isToday ? (
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
              ) : (
                <p className="text-muted-foreground">Water intake: {waterIntake} ml</p>
              )}
            </CardContent>
          </Card>

          {/* Add Food - Only show for today */}
          {isToday && (
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
          )}

          {/* Food Log */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                {isToday ? "Today's Food Log" : `Food Log - ${format(selectedDate, 'MMM d, yyyy')}`}
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
                        {isToday && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEntry(entry.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
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
