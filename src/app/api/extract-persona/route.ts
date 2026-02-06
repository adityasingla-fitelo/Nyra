import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client for API routes
// Uses service role key since this is a backend API handling authenticated user data
// Service role key has permission to bypass RLS policies
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * Extract persona information from user message using LLM
 * This API is called after every user message to automatically update persona fields
 * IMPORTANT: Strictly validates user_id to prevent data mixing between users
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userMessage, userId } = body;

    if (!userMessage || !userId) {
      return NextResponse.json(
        { error: "userMessage and userId required" },
        { status: 400 }
      );
    }

    // SECURITY: Validate userId format (UUID)
    if (!userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Get current persona for this SPECIFIC user only
    const { data: currentPersona, error: fetchError } = await supabase
      .from("personas")
      .select("*")
      .eq("user_id", userId) // CRITICAL: Filter by user_id
      .maybeSingle();

    if (fetchError) {
      console.error("Persona fetch error:", fetchError);
      throw fetchError;
    }

    // Verify persona belongs to this user (if it exists)
    if (currentPersona && currentPersona.user_id !== userId) {
      console.error(`SECURITY: Persona user_id mismatch! ${currentPersona.user_id} vs ${userId}`);
      return NextResponse.json(
        { error: "Persona ownership validation failed" },
        { status: 403 }
      );
    }

    const extractionPrompt = `You are an expert at extracting health & wellness information from conversations.

PERSONA FIELDS TO EXTRACT (if mentioned):
- age: integer (years)
- height_cm: number (height in centimeters)
- weight_kg: number (weight in kilograms)
- gender: string ("Male", "Female", "Other", "Prefer not to say")
- occupation: string (job/profession)
- wake_time: string (time format like "6:00 AM" or "06:00")
- sleep_time: string (time format like "11:00 PM" or "23:00")
- activity_type: string (e.g., "Gym", "Running", "Yoga", "Sports", "Sedentary", "Mixed")
- activity_frequency: string (e.g., "5 days a week", "Daily", "3 times a week", "Rarely")
- activity_duration: string (e.g., "1 hour", "30 minutes", "2 hours")
- health_goal: string (e.g., "Weight Loss", "Muscle Building", "General Fitness", "Endurance", "Flexibility")
- diet_preference: string (e.g., "Vegetarian", "Vegan", "Non-Vegetarian", "Pescatarian", "Jain")
- medical_conditions: string (comma-separated, e.g., "Diabetes, High Blood Pressure")
- water_intake: string (e.g., "2 liters", "8 glasses", "4-5 liters")
- stress_level: string ("Low", "Medium", "High")

CURRENT PERSONA (for context, avoid overwriting if user doesn't mention):
${currentPersona ? JSON.stringify(currentPersona, null, 2) : "No existing persona"}

USER MESSAGE:
"${userMessage}"

TASK:
1. Analyze if the message contains ANY persona information
2. Extract ONLY the fields explicitly mentioned by the user
3. Return JSON with ONLY the fields that should be updated
4. If no persona info is found, return empty object
5. Do NOT infer or assume information not explicitly stated
6. For numeric values (age, height, weight), extract numbers only
7. For time values, convert to standard format (HH:MM AM/PM)
8. For health goals/diet, normalize to standard values if user's wording matches intent

IMPORTANT:
- Do NOT overwrite existing values unless user explicitly mentions a change
- Be conservative: only extract what the user clearly stated
- For activity info: extract type AND frequency AND duration separately if all mentioned
- Medical conditions: list all mentioned, separated by commas

Return ONLY valid JSON with extracted fields, no explanations:
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: extractionPrompt,
        },
      ],
      temperature: 0.3, // Lower temperature for consistent extraction
      max_tokens: 600,
    });

    const responseText =
      completion.choices[0]?.message?.content || "{}";

    console.log("LLM extraction response:", responseText);

    // Parse the JSON response
    let extractedFields: Record<string, any> = {};
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedFields = JSON.parse(jsonMatch[0]);
        console.log("Parsed extracted fields:", extractedFields);
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Response was:", responseText);
      // If parsing fails, return empty object
      return NextResponse.json({
        success: true,
        extractedFields: {},
        message: "No persona information extracted",
      });
    }

    // Filter out empty values
    const cleanedFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(extractedFields)) {
      if (value !== null && value !== undefined && value !== "") {
        cleanedFields[key] = value;
      }
    }

    console.log("Cleaned fields to update:", cleanedFields);

    // If no fields were extracted, return early
    if (Object.keys(cleanedFields).length === 0) {
      console.log("No persona info found in message:", userMessage);
      return NextResponse.json({
        success: true,
        extractedFields: {},
        message: "No persona information found in message",
      });
    }

    // Update persona in database - CRITICAL: Always verify user_id
    cleanedFields.user_id = userId;

    console.log("Attempting to upsert persona for user:", userId);
    console.log("Fields to upsert:", cleanedFields);

    const { data: existingPersona, error: checkError } = await supabase
      .from("personas")
      .select("id, user_id")
      .eq("user_id", userId) // CRITICAL: Filter by user_id
      .maybeSingle();

    console.log("Existing persona check:", { existingPersona, checkError });

    if (checkError) {
      console.error("Persona check error:", checkError);
      throw checkError;
    }

    let upsertResult;
    if (existingPersona) {
      console.log("Updating existing persona:", existingPersona.id);

      // Verify ownership before updating
      if (existingPersona.user_id !== userId) {
        console.error(`SECURITY: Attempted update of persona belonging to different user!`);
        return NextResponse.json(
          { error: "Unauthorized: Persona ownership mismatch" },
          { status: 403 }
        );
      }

      // Update existing persona - CRITICAL: Only for this user
      const { data, error } = await supabase
        .from("personas")
        .update(cleanedFields)
        .eq("user_id", userId) // CRITICAL: Double-check in update
        .select()
        .single();

      console.log("Update result:", { success: !error, data, error });

      if (error) {
        console.error("Persona update error:", error);
        throw error;
      }
      upsertResult = data;
    } else {
      console.log("Creating new persona for user:", userId);

      // Create new persona - CRITICAL: Set correct user_id
      const { data, error } = await supabase
        .from("personas")
        .insert(cleanedFields)
        .select()
        .single();

      console.log("Insert result:", { success: !error, data, error });

      if (error) {
        console.error("Persona insert error:", error);
        throw error;
      }

      // Verify inserted record belongs to this user
      if (data.user_id !== userId) {
        console.error(`SECURITY: Inserted persona has wrong user_id!`);
        // Delete the mismatched record
        await supabase.from("personas").delete().eq("id", data.id);
        return NextResponse.json(
          { error: "Data validation failed" },
          { status: 500 }
        );
      }

      upsertResult = data;
    }

    return NextResponse.json({
      success: true,
      extractedFields: cleanedFields,
      updatedPersona: upsertResult,
      message: `Updated ${Object.keys(cleanedFields).length} persona fields`,
    });
  } catch (error: any) {
    console.error("Extract persona error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to extract persona information",
      },
      { status: 500 }
    );
  }
}
