import { z } from "zod";

export const healthProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters"),
  age: z
    .string()
    .refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 120), {
      message: "Age must be between 1 and 120",
    }),
  gender: z.string().optional(),
  height: z
    .string()
    .refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 50 && Number(val) <= 300), {
      message: "Height must be between 50 and 300 cm",
    }),
  weight: z
    .string()
    .refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 20 && Number(val) <= 500), {
      message: "Weight must be between 20 and 500 kg",
    }),
  activityLevel: z.string().optional(),
  healthConditions: z.array(z.string()).max(12, "Too many conditions selected"),
  medications: z
    .string()
    .trim()
    .max(1000, "Medications text must be less than 1000 characters"),
  dietaryPreferences: z.array(z.string()).max(13, "Too many preferences selected"),
  allergies: z.array(z.string()).max(10, "Too many allergies selected"),
  dislikedFoods: z
    .string()
    .trim()
    .max(500, "Disliked foods text must be less than 500 characters"),
  goals: z.array(z.string()).max(10, "Too many goals selected"),
  targetWeight: z
    .string()
    .refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 20 && Number(val) <= 500), {
      message: "Target weight must be between 20 and 500 kg",
    }),
  timeline: z.string().optional(),
  additionalNotes: z
    .string()
    .trim()
    .max(2000, "Additional notes must be less than 2000 characters"),
});

export type HealthProfileFormData = z.infer<typeof healthProfileSchema>;

// Validation for each step
export const step1Schema = healthProfileSchema.pick({
  firstName: true,
  lastName: true,
  age: true,
  gender: true,
  height: true,
  weight: true,
  activityLevel: true,
});

export const step2Schema = healthProfileSchema.pick({
  healthConditions: true,
  medications: true,
});

export const step3Schema = healthProfileSchema.pick({
  dietaryPreferences: true,
  allergies: true,
  dislikedFoods: true,
});

export const step4Schema = healthProfileSchema.pick({
  goals: true,
  targetWeight: true,
  timeline: true,
  additionalNotes: true,
});
