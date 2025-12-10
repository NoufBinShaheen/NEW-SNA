import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check, User, Heart, Utensils, Target } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { toast } from "@/hooks/use-toast";
import { healthProfileSchema, step1Schema, step2Schema, step3Schema, step4Schema } from "@/lib/validations/healthProfile";

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
  "None"
];

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
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    activityLevel: "",
    healthConditions: [] as string[],
    medications: "",
    dietaryPreferences: [] as string[],
    allergies: [] as string[],
    dislikedFoods: "",
    goals: [] as string[],
    targetWeight: "",
    timeline: "",
    additionalNotes: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
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

  const handleSubmit = () => {
    // Final validation of entire form
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
    
    toast({
      title: "Profile Created!",
      description: "Your health profile has been saved. We'll create your personalized nutrition plan.",
    });
    navigate("/");
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
                            onCheckedChange={(checked) => 
                              handleCheckboxChange("healthConditions", condition, checked as boolean)
                            }
                          />
                          <Label htmlFor={condition} className="text-sm font-normal cursor-pointer">
                            {condition}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medications">Current Medications (optional)</Label>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetWeight">Target Weight (kg, optional)</Label>
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
                  <Button onClick={handleSubmit} className="gap-2 bg-primary hover:bg-primary/90">
                    <Check className="w-4 h-4" />
                    Create My Plan
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
