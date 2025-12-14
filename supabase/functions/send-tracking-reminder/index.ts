import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get meal type from request body (breakfast, lunch, dinner, or snack)
    let mealType = "general";
    try {
      const body = await req.json();
      mealType = body.mealType || "general";
    } catch {
      // Default to general if no body
    }

    console.log(`Starting ${mealType} food tracking reminder job...`);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Get users who have email_notifications and meal_reminders enabled
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, first_name, email_notifications, meal_reminders")
      .eq("email_notifications", true)
      .eq("meal_reminders", true);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} users with reminders enabled`);

    const emailsSent: string[] = [];
    const skipped: string[] = [];

    for (const profile of profiles || []) {
      // Get user's health profile for meal preferences
      const { data: healthProfile } = await supabase
        .from("health_profiles")
        .select("weight, activity_level, meals_per_day, snacks_per_day, custom_calories")
        .eq("user_id", profile.user_id)
        .maybeSingle();

      // Get meal preferences (default 3 meals, 2 snacks)
      const mealsPerDay = healthProfile?.meals_per_day || 3;
      const snacksPerDay = healthProfile?.snacks_per_day || 2;

      // Skip if user doesn't have this meal type in their plan
      if (mealType === "breakfast" && mealsPerDay < 1) continue;
      if (mealType === "lunch" && mealsPerDay < 2) continue;
      if (mealType === "dinner" && mealsPerDay < 3) continue;
      if (mealType === "snack" && snacksPerDay < 1) continue;

      // Calculate daily calorie target
      let dailyCalorieTarget = healthProfile?.custom_calories || 2000;
      if (!healthProfile?.custom_calories && healthProfile?.weight && healthProfile?.activity_level) {
        const weight = Number(healthProfile.weight);
        const activityMultipliers: Record<string, number> = {
          sedentary: 1.2,
          light: 1.375,
          moderate: 1.55,
          active: 1.725,
          extra: 1.9,
        };
        const multiplier = activityMultipliers[healthProfile.activity_level] || 1.55;
        dailyCalorieTarget = Math.round(weight * 22 * multiplier);
      }

      // Check if user has already logged food today
      const { data: todayTracking, error: trackingError } = await supabase
        .from("daily_tracking")
        .select("food_entries")
        .eq("user_id", profile.user_id)
        .eq("date", today)
        .maybeSingle();

      if (trackingError) {
        console.error(`Error checking tracking for user ${profile.user_id}:`, trackingError);
        continue;
      }

      // Calculate consumed calories
      const foodEntries = todayTracking?.food_entries || [];
      let consumedCalories = 0;
      if (Array.isArray(foodEntries)) {
        consumedCalories = foodEntries.reduce((sum: number, entry: any) => {
          return sum + (Number(entry.calories) || 0);
        }, 0);
      }

      // Skip if user has reached ≥80% of their calorie goal
      const completionPercentage = (consumedCalories / dailyCalorieTarget) * 100;
      if (completionPercentage >= 80) {
        console.log(`Skipping user ${profile.user_id} - completed ${completionPercentage.toFixed(0)}% of daily goal`);
        skipped.push(profile.user_id);
        continue;
      }

      // Get user email from auth
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.user_id);
      
      if (authError || !authUser?.user?.email) {
        console.error(`Error fetching auth user ${profile.user_id}:`, authError);
        continue;
      }

      const userEmail = authUser.user.email;
      const userName = profile.first_name || "there";

      // Build meal-specific content
      let mealEmoji = "🍽️";
      let mealName = "meals";
      let mealTip = "Logging your meals helps you stay on track with your nutrition goals!";
      let subject = "Don't forget to log your meals! 🍽️";

      switch (mealType) {
        case "breakfast":
          mealEmoji = "🍳";
          mealName = "breakfast";
          mealTip = "A healthy breakfast kickstarts your metabolism and gives you energy for the day!";
          subject = "Time to log your breakfast! 🍳";
          break;
        case "lunch":
          mealEmoji = "🥗";
          mealName = "lunch";
          mealTip = "A balanced lunch keeps your energy levels stable throughout the afternoon!";
          subject = "Don't forget to log your lunch! 🥗";
          break;
        case "dinner":
          mealEmoji = "🍽️";
          mealName = "dinner";
          mealTip = "Tracking your dinner helps you understand your daily eating patterns!";
          subject = "Time to log your dinner! 🍽️";
          break;
        case "snack":
          mealEmoji = "🍎";
          mealName = "snacks";
          mealTip = "Healthy snacks between meals can help you maintain steady energy levels!";
          subject = "Remember to log your snacks! 🍎";
          break;
        default:
          // General reminder with full meal list
          const mealList: string[] = [];
          if (mealsPerDay >= 1) mealList.push("🍳 Breakfast");
          if (mealsPerDay >= 2) mealList.push("🥗 Lunch");
          if (mealsPerDay >= 3) mealList.push("🍽️ Dinner");
          for (let i = 1; i <= snacksPerDay; i++) {
            mealList.push(`🍎 Snack ${i}`);
          }
          mealTip = `Your daily plan includes: ${mealList.join(", ")}`;
      }

      console.log(`Sending ${mealType} reminder to ${userEmail}`);

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "SmartNutritionAssistant <onboarding@resend.dev>",
            to: [userEmail],
            subject: subject,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #10b981; margin-bottom: 20px;">Hey ${userName}! ${mealEmoji}</h1>
                
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                  It's time to log your <strong>${mealName}</strong>! Tracking what you eat helps you reach your nutrition goals faster.
                </p>
                
                <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #166534; margin-top: 0;">💡 Tip</h3>
                  <p style="color: #166534; font-size: 14px; margin-bottom: 0;">
                    ${mealTip}
                  </p>
                </div>
                
                <div style="margin: 30px 0;">
                  <a href="https://smartnutriassistant.lovable.app/tracking" 
                     style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    Log ${mealName.charAt(0).toUpperCase() + mealName.slice(1)} Now
                  </a>
                </div>
                
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="font-size: 14px; color: #666; margin: 0;">
                    <strong>Today's progress:</strong><br/>
                    Calories: ${Math.round(consumedCalories)} / ${dailyCalorieTarget} kcal (${Math.round(completionPercentage)}%)
                  </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                
                <p style="font-size: 12px; color: #999;">
                  You're receiving this email because you enabled meal reminders in SmartNutritionAssistant.
                  <a href="https://smartnutriassistant.lovable.app/account" style="color: #10b981;">Manage preferences</a>
                </p>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error(`Error sending email to ${userEmail}:`, errorData);
        } else {
          emailsSent.push(userEmail);
          console.log(`Successfully sent ${mealType} reminder to ${userEmail}`);
        }
      } catch (sendError) {
        console.error(`Failed to send email to ${userEmail}:`, sendError);
      }
    }

    console.log(`Completed. Sent ${emailsSent.length} ${mealType} reminder emails. Skipped ${skipped.length}.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        mealType,
        emailsSent: emailsSent.length,
        skipped: skipped.length,
        recipients: emailsSent 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error in send-tracking-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
