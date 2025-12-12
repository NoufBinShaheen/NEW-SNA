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

    console.log("Starting daily food tracking reminder job...");

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

      // Skip if user has already logged food today
      const foodEntries = todayTracking?.food_entries || [];
      if (Array.isArray(foodEntries) && foodEntries.length > 0) {
        console.log(`Skipping user ${profile.user_id} - already logged ${foodEntries.length} entries today`);
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

      console.log(`Sending food tracking reminder to ${userEmail}`);

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
            subject: "Don't forget to log your meals today! 🍽️",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #10b981; margin-bottom: 20px;">Hey ${userName}! 👋</h1>
                
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                  We noticed you haven't logged any meals today yet. Tracking your food intake is the key to reaching your nutrition goals!
                </p>
                
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                  It only takes a few seconds to log what you've eaten. Let's keep your streak going! 💪
                </p>
                
                <div style="margin: 30px 0;">
                  <a href="https://smartnutriassistant.lovable.app/tracking" 
                     style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    Log My Meals
                  </a>
                </div>
                
                <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #166534; margin-top: 0;">Quick Tip 💡</h3>
                  <p style="color: #166534; font-size: 14px; margin-bottom: 0;">
                    Logging your meals right after eating helps you remember everything and keeps your nutrition data accurate!
                  </p>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  Benefits of tracking your food:
                </p>
                <ul style="font-size: 14px; color: #666; line-height: 1.8;">
                  <li>Stay aware of your calorie intake</li>
                  <li>Meet your protein and nutrition goals</li>
                  <li>Identify eating patterns</li>
                  <li>Stay hydrated by tracking water too</li>
                </ul>
                
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
          console.log(`Successfully sent tracking reminder to ${userEmail}`);
        }
      } catch (sendError) {
        console.error(`Failed to send email to ${userEmail}:`, sendError);
      }
    }

    console.log(`Completed. Sent ${emailsSent.length} reminder emails. Skipped ${skipped.length} (already logged).`);

    return new Response(
      JSON.stringify({ 
        success: true, 
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
