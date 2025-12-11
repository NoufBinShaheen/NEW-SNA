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

    console.log("Starting coach reminder job...");

    // Get users who have email_notifications and meal_reminders enabled
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, first_name, email_notifications, meal_reminders, last_coach_session, coach_reminder_frequency")
      .eq("email_notifications", true)
      .eq("meal_reminders", true)
      .neq("coach_reminder_frequency", "none");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} users with reminders enabled`);

    const now = new Date();
    const emailsSent: string[] = [];

    for (const profile of profiles || []) {
      // Check if user should receive reminder based on frequency
      const lastSession = profile.last_coach_session ? new Date(profile.last_coach_session) : null;
      const frequency = profile.coach_reminder_frequency || "weekly";
      
      let shouldSendReminder = false;
      
      if (!lastSession) {
        // Never used coach - send reminder
        shouldSendReminder = true;
      } else {
        const daysSinceLastSession = Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
        
        if (frequency === "daily" && daysSinceLastSession >= 1) {
          shouldSendReminder = true;
        } else if (frequency === "weekly" && daysSinceLastSession >= 7) {
          shouldSendReminder = true;
        }
      }

      if (!shouldSendReminder) {
        console.log(`Skipping user ${profile.user_id} - reminder not due yet`);
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

      console.log(`Sending reminder to ${userEmail}`);

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
            subject: "Time for your AI Coach session! 🥗",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #10b981; margin-bottom: 20px;">Hey ${userName}! 👋</h1>
                
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                  Your AI Nutrition Coach is ready to help you stay on track with your health goals!
                </p>
                
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                  ${!lastSession 
                    ? "You haven't had your first coaching session yet. Start today and get personalized nutrition advice!"
                    : "It's been a while since your last session. Let's check in on your progress!"}
                </p>
                
                <div style="margin: 30px 0;">
                  <a href="https://smartnutriassistant.lovable.app/coach" 
                     style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    Start Coaching Session
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  Your AI coach can help you with:
                </p>
                <ul style="font-size: 14px; color: #666; line-height: 1.8;">
                  <li>Personalized meal suggestions</li>
                  <li>Nutrition advice based on your health profile</li>
                  <li>Tips to reach your weight goals</li>
                  <li>Managing dietary restrictions</li>
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
          console.log(`Successfully sent reminder to ${userEmail}`);
        }
      } catch (sendError) {
        console.error(`Failed to send email to ${userEmail}:`, sendError);
      }
    }

    console.log(`Completed. Sent ${emailsSent.length} reminder emails.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: emailsSent.length,
        recipients: emailsSent 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error in send-coach-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
