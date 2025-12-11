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

    let systemPrompt = `You are a professional nutritionist AI assistant and personal health coach. Based on the user's health profile, provide personalized nutrition recommendations and coaching.

When providing advice, consider:
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
      // Include full health profile context for personalized coaching
      const profileContext = `
USER HEALTH PROFILE (use this to personalize your responses):
- Age: ${healthProfile.age || "Not specified"}
- Gender: ${healthProfile.gender || "Not specified"}
- Height: ${healthProfile.height ? `${healthProfile.height} cm` : "Not specified"}
- Current Weight: ${healthProfile.weight ? `${healthProfile.weight} kg` : "Not specified"}
- Target Weight: ${healthProfile.target_weight ? `${healthProfile.target_weight} kg` : "Not specified"}
- Activity Level: ${healthProfile.activity_level || "Not specified"}
- Health Conditions: ${healthProfile.health_conditions?.join(", ") || "None reported"}
- Current Medications: ${healthProfile.medications || "None reported"}
- Dietary Preferences: ${healthProfile.dietary_preferences?.join(", ") || "None specified"}
- Food Allergies: ${healthProfile.allergies?.join(", ") || "None reported"}
- Disliked Foods: ${healthProfile.disliked_foods || "None specified"}
- Health Goals: ${healthProfile.goals?.join(", ") || "General wellness"}
- Timeline: ${healthProfile.timeline || "Not specified"}
- Additional Notes: ${healthProfile.additional_notes || "None"}

You already have access to all the user's health information above. DO NOT ask them to provide this information again. Use it to give personalized, specific advice.`;

      systemPrompt = `You are a friendly, knowledgeable AI nutrition coach. You have access to the user's complete health profile and should use it to provide personalized advice.

${profileContext}

IMPORTANT GUIDELINES:
1. NEVER ask for information you already have from their profile above
2. Refer to their specific details when giving advice (e.g., "Since you have diabetes..." or "Given your goal of weight loss...")
3. Always consider their allergies and dietary preferences
4. Be encouraging and supportive
5. Provide specific, actionable recommendations
6. If they ask about foods, consider their health conditions and allergies
7. Keep responses conversational but informative`;

      userPrompt = healthProfile.message || "Give me personalized nutrition advice for today.";
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
