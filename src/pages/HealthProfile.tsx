import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check, User, Heart, Utensils, Target, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { toast } from "@/hooks/use-toast";
import { healthProfileSchema, step1Schema, step2Schema, step3Schema, step4Schema } from "@/lib/validations/healthProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const healthConditions = [
  "Diabetes Type 1",
  "Diabetes Type 2",
  "Hypertension",
  "Heart Disease",
  "High Cholesterol",
  "Kidney Disease",
  "Celiac Disease",
  "IBS/IBD",
  "PCOS",
  "Thyroid Disorder",
  "Obesity",
  "Organ Transplant",
  "None"
];

const transplantTypes = [
  "Kidney Transplant",
  "Liver Transplant",
  "Heart Transplant",
  "Lung Transplant",
  "Pancreas Transplant",
  "Bone Marrow Transplant",
  "Cornea Transplant",
  "Other Transplant"
];

const medicationRecommendations: Record<string, string[]> = {
  "Diabetes Type 1": ["Insulin (Humalog, Novolog)", "Metformin", "Pramlintide (Symlin)"],
  "Diabetes Type 2": ["Metformin", "Glipizide", "Sitagliptin (Januvia)", "Empagliflozin (Jardiance)"],
  "Hypertension": ["Lisinopril", "Amlodipine", "Losartan", "Hydrochlorothiazide"],
  "Heart Disease": ["Aspirin", "Beta-blockers (Metoprolol)", "Statins (Atorvastatin)", "ACE inhibitors"],
  "High Cholesterol": ["Atorvastatin (Lipitor)", "Rosuvastatin (Crestor)", "Ezetimibe (Zetia)"],
  "Kidney Disease": ["ACE inhibitors", "ARBs (Losartan)", "Erythropoietin", "Phosphate binders"],
  "Celiac Disease": ["Gluten-free diet (no medication)", "Vitamin supplements", "Dapsone (for dermatitis)"],
  "IBS/IBD": ["Loperamide", "Mesalamine", "Rifaximin", "Probiotics"],
  "PCOS": ["Metformin", "Spironolactone", "Birth control pills", "Clomiphene"],
  "Thyroid Disorder": ["Levothyroxine (Synthroid)", "Methimazole", "Propylthiouracil"],
  "Obesity": ["Orlistat (Xenical)", "Liraglutide (Saxenda)", "Semaglutide (Wegovy)", "Phentermine"],
  "Organ Transplant": ["Tacrolimus (Prograf)", "Cyclosporine (Neoral)", "Mycophenolate (CellCept)", "Prednisone"],
  "Kidney Transplant": ["Tacrolimus", "Mycophenolate", "Prednisone", "Azathioprine"],
  "Liver Transplant": ["Tacrolimus", "Cyclosporine", "Mycophenolate", "Corticosteroids"],
  "Heart Transplant": ["Tacrolimus", "Mycophenolate", "Prednisone", "Sirolimus"],
  "Lung Transplant": ["Tacrolimus", "Azathioprine", "Prednisone", "Mycophenolate"],
  "Pancreas Transplant": ["Tacrolimus", "Mycophenolate", "Prednisone", "Sirolimus"],
  "Bone Marrow Transplant": ["Cyclosporine", "Tacrolimus", "Methotrexate", "Corticosteroids"],
  "Cornea Transplant": ["Prednisolone eye drops", "Cyclosporine eye drops", "Oral steroids (rarely)"],
  "Other Transplant": ["Tacrolimus (Prograf)", "Cyclosporine (Neoral)", "Mycophenolate (CellCept)", "Prednisone"],
};

const dietaryPreferences = [
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Keto",
  "Paleo",
  "Mediterranean",
  "Low-Carb",
  "Low-Fat",
  "Gluten-Free",
  "Dairy-Free",
  "Halal",
  "Kosher",
  "No Preference"
];

const allergies = [
  "Peanuts",
  "Tree Nuts",
  "Milk/Dairy",
  "Eggs",
  "Wheat",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
  "None"
];

const goals = [
  "Lose Weight",
  "Gain Weight",
  "Build Muscle",
  "Maintain Weight",
  "Improve Energy",
  "Better Sleep",
  "Manage Blood Sugar",
  "Lower Cholesterol",
  "Reduce Inflammation",
  "Improve Gut Health"
];

const HealthProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    activityLevel: "",
    healthConditions: [] as string[],
    transplantType: "" as string,
    medications: "",
    dietaryPreferences: [] as string[],
    allergies: [] as string[],
    dislikedFoods: "",
    goals: [] as string[],
    targetWeight: "",
    timeline: "",
    additionalNotes: "",
    calorieDeficit: "" as string
  });

  // Calculate BMI and recommended calorie ranges
  const calculateBMI = () => {
    const height = parseFloat(formData.height) / 100; // cm to m
    const weight = parseFloat(formData.weight);
    if (height > 0 && weight > 0) {
      return weight / (height * height);
    }
    return 0;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  const getCalorieRanges = () => {
    const bmi = calculateBMI();
    const bmiCategory = getBMICategory(bmi);
    
    // Base calorie recommendations based on BMI
    if (bmiCategory === "Obese") {
      return [
        { value: "aggressive", label: "Aggressive (1200-1400 kcal)", description: "Faster weight loss, requires medical supervision" },
        { value: "moderate", label: "Moderate (1400-1600 kcal)", description: "Steady weight loss, sustainable approach" },
        { value: "gradual", label: "Gradual (1600-1800 kcal)", description: "Slow and steady, easiest to maintain" },
      ];
    } else if (bmiCategory === "Overweight") {
      return [
        { value: "moderate", label: "Moderate (1400-1600 kcal)", description: "Recommended for your BMI range" },
        { value: "gradual", label: "Gradual (1600-1800 kcal)", description: "Sustainable approach, minimal hunger" },
        { value: "slow", label: "Slow (1800-2000 kcal)", description: "Very gradual, easiest to maintain" },
      ];
    } else {
      return [
        { value: "gradual", label: "Gradual (1600-1800 kcal)", description: "Safe approach for your BMI" },
        { value: "slow", label: "Slow (1800-2000 kcal)", description: "Recommended for near-normal BMI" },
        { value: "minimal", label: "Minimal (2000-2200 kcal)", description: "Focus on body composition" },
      ];
    }
  };

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create your health profile.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Load profile for name
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", user.id)
          .maybeSingle();

        // Load health profile
        const { data: healthProfile } = await supabase
          .from("health_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile || healthProfile) {
          // Extract transplant type from health conditions if present
          const conditions = healthProfile?.health_conditions || [];
          const transplantType = transplantTypes.find(t => conditions.includes(t)) || "";
          const filteredConditions = conditions.filter((c: string) => !transplantTypes.includes(c));
          
          setFormData(prev => ({
            ...prev,
            firstName: profile?.first_name || "",
            lastName: profile?.last_name || "",
            age: healthProfile?.age?.toString() || "",
            gender: healthProfile?.gender || "",
            height: healthProfile?.height?.toString() || "",
            weight: healthProfile?.weight?.toString() || "",
            activityLevel: healthProfile?.activity_level || "",
            healthConditions: filteredConditions,
            transplantType: transplantType,
            medications: healthProfile?.medications || "",
            dietaryPreferences: healthProfile?.dietary_preferences || [],
            allergies: healthProfile?.allergies || [],
            dislikedFoods: healthProfile?.disliked_foods || "",
            goals: healthProfile?.goals || [],
            targetWeight: healthProfile?.target_weight?.toString() || "",
            timeline: healthProfile?.timeline || "",
            additionalNotes: healthProfile?.additional_notes || ""
          }));
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...(prev[field as keyof typeof prev] as string[]), value]
        : (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    const schemas = {
      1: step1Schema,
      2: step2Schema,
      3: step3Schema,
      4: step4Schema,
    };
    
    const schema = schemas[currentStep as keyof typeof schemas];
    const result = schema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;

    const result = healthProfileSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      // Update profile name
      await supabase
        .from("profiles")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
        })
        .eq("user_id", user.id);

      // Upsert health profile
      const ageValue = formData.age ? parseInt(formData.age, 10) : null;
      const healthData = {
        user_id: user.id,
        age: ageValue && !isNaN(ageValue) ? ageValue : null,
        gender: formData.gender || null,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        activity_level: formData.activityLevel || null,
        health_conditions: formData.transplantType 
          ? [...formData.healthConditions, formData.transplantType] 
          : formData.healthConditions,
        medications: formData.medications || null,
        dietary_preferences: formData.dietaryPreferences,
        allergies: formData.allergies,
        disliked_foods: formData.dislikedFoods || null,
        goals: formData.goals,
        target_weight: formData.targetWeight ? parseFloat(formData.targetWeight) : null,
        timeline: formData.timeline || null,
        additional_notes: formData.additionalNotes || null,
      };

      const { error } = await supabase
        .from("health_profiles")
        .upsert(healthData, { onConflict: "user_id" });

      if (error) throw error;

      toast({
        title: "Profile Saved!",
        description: "Your health profile has been saved. View your personalized dashboard.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 4));
    }
  };
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const steps = [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Health", icon: Heart },
    { number: 3, title: "Diet", icon: Utensils },
    { number: 4, title: "Goals", icon: Target }
  ];

  // Show loading while checking auth
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Create Your Health Profile
            </h1>
            <p className="text-muted-foreground text-lg">
              Tell us about yourself to get personalized nutrition recommendations
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-8 relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10" />
            <div 
              className="absolute top-5 left-0 h-0.5 bg-primary -z-10 transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
            {steps.map((s) => (
              <div key={s.number} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    step >= s.number 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.number ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-2 font-medium ${
                  step >= s.number ? "text-primary" : "text-muted-foreground"
                }`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>

          {/* Form Card */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">
                {step === 1 && "Personal Information"}
                {step === 2 && "Health Conditions"}
                {step === 3 && "Dietary Preferences"}
                {step === 4 && "Your Goals"}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Basic information helps us calculate your nutritional needs"}
                {step === 2 && "Share any health conditions so we can tailor recommendations"}
                {step === 3 && "Tell us about your food preferences and restrictions"}
                {step === 4 && "What would you like to achieve with your nutrition plan?"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Personal Info */}
              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        placeholder="John"
                        maxLength={50}
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        className={errors.firstName ? "border-destructive" : ""}
                      />
                      {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Doe"
                        maxLength={50}
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        className={errors.lastName ? "border-destructive" : ""}
                      />
                      {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input 
                        id="age" 
                        type="number" 
                        placeholder="30"
                        min={1}
                        max={120}
                        value={formData.age}
                        onChange={(e) => handleInputChange("age", e.target.value)}
                        className={errors.age ? "border-destructive" : ""}
                      />
                      {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input 
                        id="height" 
                        type="number" 
                        placeholder="175"
                        min={50}
                        max={300}
                        value={formData.height}
                        onChange={(e) => handleInputChange("height", e.target.value)}
                        className={errors.height ? "border-destructive" : ""}
                      />
                      {errors.height && <p className="text-sm text-destructive">{errors.height}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input 
                        id="weight" 
                        type="number" 
                        placeholder="70"
                        min={20}
                        max={500}
                        value={formData.weight}
                        onChange={(e) => handleInputChange("weight", e.target.value)}
                        className={errors.weight ? "border-destructive" : ""}
                      />
                      {errors.weight && <p className="text-sm text-destructive">{errors.weight}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activityLevel">Activity Level</Label>
                    <Select value={formData.activityLevel} onValueChange={(value) => handleInputChange("activityLevel", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                        <SelectItem value="light">Lightly Active (1-3 days/week)</SelectItem>
                        <SelectItem value="moderate">Moderately Active (3-5 days/week)</SelectItem>
                        <SelectItem value="very">Very Active (6-7 days/week)</SelectItem>
                        <SelectItem value="extra">Extra Active (physical job + exercise)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Step 2: Health Conditions */}
              {step === 2 && (
                <>
                  <div className="space-y-3">
                    <Label>Do you have any health conditions?</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {healthConditions.map((condition) => (
                        <div key={condition} className="flex items-center space-x-2">
                          <Checkbox
                            id={condition}
                            checked={formData.healthConditions.includes(condition)}
                            onCheckedChange={(checked) => {
                              handleCheckboxChange("healthConditions", condition, checked as boolean);
                              // Clear transplant type if unchecking Organ Transplant
                              if (condition === "Organ Transplant" && !checked) {
                                setFormData(prev => ({ ...prev, transplantType: "" }));
                              }
                            }}
                          />
                          <Label htmlFor={condition} className="text-sm font-normal cursor-pointer">
                            {condition}
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    {/* Transplant Type Selector */}
                    {formData.healthConditions.includes("Organ Transplant") && (
                      <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                        <Label className="text-primary font-medium">What type of transplant do you have?</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {transplantTypes.map((type) => (
                            <div 
                              key={type} 
                              onClick={() => setFormData(prev => ({ ...prev, transplantType: type }))}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                formData.transplantType === type 
                                  ? "bg-primary text-primary-foreground border-primary" 
                                  : "bg-background border-border hover:border-primary/50"
                              }`}
                            >
                              <span className="text-sm font-medium">{type}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This helps us tailor your nutrition plan for post-transplant dietary needs.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medications">Current Medications:</Label>
                    
                    {/* Medication Recommendations */}
                    {(formData.healthConditions.filter(c => c !== "None" && medicationRecommendations[c]).length > 0 || 
                      (formData.transplantType && medicationRecommendations[formData.transplantType])) && (
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <p className="text-sm font-medium text-primary">
                          💊 Click to add medications to your list:
                        </p>
                        {formData.healthConditions
                          .filter(c => c !== "None" && c !== "Organ Transplant" && medicationRecommendations[c])
                          .map(condition => (
                            <div key={condition} className="space-y-1">
                              <p className="text-xs font-semibold text-foreground">{condition}:</p>
                              <div className="flex flex-wrap gap-1">
                                {medicationRecommendations[condition].map(med => {
                                  const isSelected = formData.medications.includes(med);
                                  return (
                                    <button 
                                      key={med}
                                      type="button"
                                      onClick={() => {
                                        if (!isSelected) {
                                          const newMeds = formData.medications 
                                            ? `${formData.medications}, ${med}` 
                                            : med;
                                          handleInputChange("medications", newMeds);
                                        }
                                      }}
                                      className={`text-xs px-2 py-1 rounded border transition-all ${
                                        isSelected 
                                          ? "bg-primary text-primary-foreground border-primary cursor-default" 
                                          : "bg-background border-border text-muted-foreground hover:border-primary hover:text-primary cursor-pointer"
                                      }`}
                                    >
                                      {med} {isSelected && "✓"}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        {formData.transplantType && medicationRecommendations[formData.transplantType] && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-foreground">{formData.transplantType}:</p>
                            <div className="flex flex-wrap gap-1">
                              {medicationRecommendations[formData.transplantType].map(med => {
                                const isSelected = formData.medications.includes(med);
                                return (
                                  <button 
                                    key={med}
                                    type="button"
                                    onClick={() => {
                                      if (!isSelected) {
                                        const newMeds = formData.medications 
                                          ? `${formData.medications}, ${med}` 
                                          : med;
                                        handleInputChange("medications", newMeds);
                                      }
                                    }}
                                    className={`text-xs px-2 py-1 rounded border transition-all ${
                                      isSelected 
                                        ? "bg-primary text-primary-foreground border-primary cursor-default" 
                                        : "bg-background border-border text-muted-foreground hover:border-primary hover:text-primary cursor-pointer"
                                    }`}
                                  >
                                    {med} {isSelected && "✓"}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground italic">
                          Note: Always consult your doctor before taking any medication.
                        </p>
                      </div>
                    )}
                    
                    <Textarea
                      id="medications"
                      placeholder="List any medications you're currently taking..."
                      maxLength={1000}
                      value={formData.medications}
                      onChange={(e) => handleInputChange("medications", e.target.value)}
                      className={`min-h-[100px] ${errors.medications ? "border-destructive" : ""}`}
                    />
                    {errors.medications && <p className="text-sm text-destructive">{errors.medications}</p>}
                  </div>
                </>
              )}

              {/* Step 3: Dietary Preferences */}
              {step === 3 && (
                <>
                  <div className="space-y-3">
                    <Label>Dietary Preferences</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {dietaryPreferences.map((pref) => (
                        <div key={pref} className="flex items-center space-x-2">
                          <Checkbox
                            id={pref}
                            checked={formData.dietaryPreferences.includes(pref)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange("dietaryPreferences", pref, checked as boolean)
                            }
                          />
                          <Label htmlFor={pref} className="text-sm font-normal cursor-pointer">
                            {pref}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Food Allergies</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {allergies.map((allergy) => (
                        <div key={allergy} className="flex items-center space-x-2">
                          <Checkbox
                            id={allergy}
                            checked={formData.allergies.includes(allergy)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange("allergies", allergy, checked as boolean)
                            }
                          />
                          <Label htmlFor={allergy} className="text-sm font-normal cursor-pointer">
                            {allergy}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dislikedFoods">Foods You Dislike (optional)</Label>
                    <Textarea
                      id="dislikedFoods"
                      placeholder="List any foods you don't enjoy eating..."
                      maxLength={500}
                      value={formData.dislikedFoods}
                      onChange={(e) => handleInputChange("dislikedFoods", e.target.value)}
                      className={errors.dislikedFoods ? "border-destructive" : ""}
                    />
                    {errors.dislikedFoods && <p className="text-sm text-destructive">{errors.dislikedFoods}</p>}
                  </div>
                </>
              )}

              {/* Step 4: Goals */}
              {step === 4 && (
                <>
                  <div className="space-y-3">
                    <Label>What are your health & nutrition goals?</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {goals.map((goal) => (
                        <div key={goal} className="flex items-center space-x-2">
                          <Checkbox
                            id={goal}
                            checked={formData.goals.includes(goal)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange("goals", goal, checked as boolean)
                            }
                          />
                          <Label htmlFor={goal} className="text-sm font-normal cursor-pointer">
                            {goal}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calorie Range Selector - Shows when Lose Weight is selected */}
                  {formData.goals.includes("Lose Weight") && (
                    <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Choose Your Calorie Target</Label>
                        {formData.height && formData.weight && (
                          <span className="text-sm text-muted-foreground">
                            Your BMI: <span className="font-semibold text-foreground">{calculateBMI().toFixed(1)}</span> ({getBMICategory(calculateBMI())})
                          </span>
                        )}
                      </div>
                      
                      {formData.height && formData.weight ? (
                        <div className="space-y-2">
                          {getCalorieRanges().map((range) => (
                            <div
                              key={range.value}
                              onClick={() => handleInputChange("calorieDeficit", range.value)}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                formData.calorieDeficit === range.value
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  formData.calorieDeficit === range.value ? "border-primary" : "border-muted-foreground"
                                }`}>
                                  {formData.calorieDeficit === range.value && (
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                  )}
                                </div>
                                <span className="font-medium">{range.label}</span>
                              </div>
                              <p className="text-sm text-muted-foreground ml-6 mt-1">{range.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Please enter your height and weight in Step 1 to see personalized calorie recommendations.
                        </p>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetWeight">Target Weight (kg)</Label>
                      <Input 
                        id="targetWeight" 
                        type="number" 
                        placeholder="65"
                        min={20}
                        max={500}
                        value={formData.targetWeight}
                        onChange={(e) => handleInputChange("targetWeight", e.target.value)}
                        className={errors.targetWeight ? "border-destructive" : ""}
                      />
                      {errors.targetWeight && <p className="text-sm text-destructive">{errors.targetWeight}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeline">Timeline</Label>
                      <Select value={formData.timeline} onValueChange={(value) => handleInputChange("timeline", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1month">1 Month</SelectItem>
                          <SelectItem value="3months">3 Months</SelectItem>
                          <SelectItem value="6months">6 Months</SelectItem>
                          <SelectItem value="1year">1 Year</SelectItem>
                          <SelectItem value="ongoing">Ongoing / Lifestyle Change</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="additionalNotes">Additional Notes (optional)</Label>
                    <Textarea
                      id="additionalNotes"
                      placeholder="Anything else you'd like us to know about your health or nutrition needs..."
                      maxLength={2000}
                      value={formData.additionalNotes}
                      onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                      className={`min-h-[100px] ${errors.additionalNotes ? "border-destructive" : ""}`}
                    />
                    {errors.additionalNotes && <p className="text-sm text-destructive">{errors.additionalNotes}</p>}
                  </div>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>
                {step < 4 ? (
                  <Button onClick={nextStep} className="gap-2">
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    className="gap-2 bg-primary hover:bg-primary/90"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {isSaving ? "Saving..." : "Create My Plan"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HealthProfile;
