export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      daily_tracking: {
        Row: {
          created_at: string
          date: string
          food_entries: Json
          id: string
          updated_at: string
          user_id: string
          water_intake: number
        }
        Insert: {
          created_at?: string
          date?: string
          food_entries?: Json
          id?: string
          updated_at?: string
          user_id: string
          water_intake?: number
        }
        Update: {
          created_at?: string
          date?: string
          food_entries?: Json
          id?: string
          updated_at?: string
          user_id?: string
          water_intake?: number
        }
        Relationships: []
      }
      health_profiles: {
        Row: {
          activity_level: string | null
          additional_notes: string | null
          age: number | null
          allergies: string[] | null
          created_at: string
          custom_calories: number | null
          custom_carbs: number | null
          custom_fat: number | null
          custom_protein: number | null
          dietary_preferences: string[] | null
          disliked_foods: string | null
          gender: string | null
          goals: string[] | null
          health_conditions: string[] | null
          height: number | null
          id: string
          medications: string | null
          target_weight: number | null
          timeline: string | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          additional_notes?: string | null
          age?: number | null
          allergies?: string[] | null
          created_at?: string
          custom_calories?: number | null
          custom_carbs?: number | null
          custom_fat?: number | null
          custom_protein?: number | null
          dietary_preferences?: string[] | null
          disliked_foods?: string | null
          gender?: string | null
          goals?: string[] | null
          health_conditions?: string[] | null
          height?: number | null
          id?: string
          medications?: string | null
          target_weight?: number | null
          timeline?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          additional_notes?: string | null
          age?: number | null
          allergies?: string[] | null
          created_at?: string
          custom_calories?: number | null
          custom_carbs?: number | null
          custom_fat?: number | null
          custom_protein?: number | null
          dietary_preferences?: string[] | null
          disliked_foods?: string | null
          gender?: string | null
          goals?: string[] | null
          health_conditions?: string[] | null
          height?: number | null
          id?: string
          medications?: string | null
          target_weight?: number | null
          timeline?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coach_reminder_frequency: string | null
          created_at: string
          email_notifications: boolean
          first_name: string | null
          id: string
          last_coach_session: string | null
          last_name: string | null
          meal_reminders: boolean
          updated_at: string
          user_id: string
          weekly_reports: boolean
        }
        Insert: {
          avatar_url?: string | null
          coach_reminder_frequency?: string | null
          created_at?: string
          email_notifications?: boolean
          first_name?: string | null
          id?: string
          last_coach_session?: string | null
          last_name?: string | null
          meal_reminders?: boolean
          updated_at?: string
          user_id: string
          weekly_reports?: boolean
        }
        Update: {
          avatar_url?: string | null
          coach_reminder_frequency?: string | null
          created_at?: string
          email_notifications?: boolean
          first_name?: string | null
          id?: string
          last_coach_session?: string | null
          last_name?: string | null
          meal_reminders?: boolean
          updated_at?: string
          user_id?: string
          weekly_reports?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
