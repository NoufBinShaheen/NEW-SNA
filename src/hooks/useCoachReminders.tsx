import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCoachReminders = (userId: string | undefined) => {
  const { toast } = useToast();
  const [hasShownReminder, setHasShownReminder] = useState(false);

  // Update last coach session timestamp
  const updateLastCoachSession = async () => {
    if (!userId) return;
    
    try {
      await supabase
        .from("profiles")
        .update({ last_coach_session: new Date().toISOString() })
        .eq("user_id", userId);
    } catch (error) {
      console.error("Error updating last coach session:", error);
    }
  };

  // In-app toast reminders disabled - only email and push notifications are active

  // Request browser push notification permission
  const requestPushPermission = async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  };

  // Show browser push notification
  const showPushNotification = (title: string, body: string) => {
    if (Notification.permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "coach-reminder",
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = "/coach";
        notification.close();
      };
    }
  };

  // Schedule periodic push notification check (when tab is open)
  useEffect(() => {
    if (!userId) return;

    const checkPushReminder = async () => {
      const hasPermission = await requestPushPermission();
      if (!hasPermission) return;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("last_coach_session, meal_reminders, coach_reminder_frequency")
          .eq("user_id", userId)
          .single();

        if (!profile?.meal_reminders || profile.coach_reminder_frequency === "none") return;

        const lastSession = profile.last_coach_session 
          ? new Date(profile.last_coach_session) 
          : null;
        
        const now = new Date();
        
        // Only show push if document is not visible (user is away)
        if (document.visibilityState === "visible") return;

        if (!lastSession) {
          showPushNotification(
            "SmartNutritionAssistant",
            "Start your first AI coaching session today!"
          );
        } else {
          const daysSinceLastSession = Math.floor(
            (now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (
            (profile.coach_reminder_frequency === "daily" && daysSinceLastSession >= 1) ||
            (profile.coach_reminder_frequency === "weekly" && daysSinceLastSession >= 7)
          ) {
            showPushNotification(
              "Time for your AI Coach!",
              "Check in with your nutrition coach for personalized advice."
            );
          }
        }
      } catch (error) {
        console.error("Error checking push reminder:", error);
      }
    };

    // Check every 30 minutes when tab is open
    const interval = setInterval(checkPushReminder, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [userId]);

  return {
    updateLastCoachSession,
    requestPushPermission,
    showPushNotification,
  };
};
