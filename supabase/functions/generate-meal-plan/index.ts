import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { healthProfile, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a professional nutritionist AI assistant. Based on the user's health profile, generate personalized nutrition recommendations.

When generating meal plans, consider:
- Their health conditions and medical needs
- Dietary preferences and restrictions
- Allergies (CRITICAL: Never include allergens)
- Activity level and caloric needs
- Goals (weight loss, muscle gain, etc.)

Always provide practical, actionable advice with specific foods and portions.`;

    let userPrompt = "";
    
    if (type === "meal-plan") {
      userPrompt = `Generate a detailed 1-day meal plan for this person:
- Age: ${healthProfile.age || "Not specified"}
- Gender: ${healthProfile.gender || "Not specified"}
- Height: ${healthProfile.height ? `${healthProfile.height} cm` : "Not specified"}
- Weight: ${healthProfile.weight ? `${healthProfile.weight} kg` : "Not specified"}
- Activity Level: ${healthProfile.activity_level || "Not specified"}
- Health Conditions: ${healthProfile.health_conditions?.join(", ") || "None"}
- Dietary Preferences: ${healthProfile.dietary_preferences?.join(", ") || "None"}
- Allergies: ${healthProfile.allergies?.join(", ") || "None"}
- Goals: ${healthProfile.goals?.join(", ") || "General wellness"}
- Target Weight: ${healthProfile.target_weight ? `${healthProfile.target_weight} kg` : "Not specified"}

Provide:
1. Breakfast, Lunch, Dinner, and 2 Snacks
2. Estimated calories and macros for each meal
3. Specific portion sizes
4. Preparation tips

Format the response in a clear, organized way with emojis for visual appeal.`;
    } else if (type === "nutrition-tips") {
      userPrompt = `Provide 5 personalized nutrition tips for this person:
- Health Conditions: ${healthProfile.health_conditions?.join(", ") || "None"}
- Goals: ${healthProfile.goals?.join(", ") || "General wellness"}
- Dietary Preferences: ${healthProfile.dietary_preferences?.join(", ") || "None"}

Make tips specific, actionable, and backed by nutrition science.`;
    } else if (type === "coach") {
      userPrompt = healthProfile.message || "Give me general nutrition advice for today.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-meal-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
