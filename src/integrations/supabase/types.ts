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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cached_descriptions: {
        Row: {
          created_at: string
          description: string
          id: string
          recipe_name: string
          recipe_name_normalized: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          recipe_name: string
          recipe_name_normalized: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          recipe_name?: string
          recipe_name_normalized?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      cached_food_guides: {
        Row: {
          category: string
          created_at: string
          food_name: string
          food_name_normalized: string
          id: string
          response_data: Json
          updated_at: string
          usage_count: number
        }
        Insert: {
          category: string
          created_at?: string
          food_name: string
          food_name_normalized: string
          id?: string
          response_data: Json
          updated_at?: string
          usage_count?: number
        }
        Update: {
          category?: string
          created_at?: string
          food_name?: string
          food_name_normalized?: string
          id?: string
          response_data?: Json
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      cached_marcela_reactions: {
        Row: {
          action: string
          created_at: string
          id: string
          reaction_data: Json
          usage_count: number
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          reaction_data: Json
          usage_count?: number
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          reaction_data?: Json
          usage_count?: number
        }
        Relationships: []
      }
      cached_nutrition: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          fats: number
          food_name: string
          food_name_normalized: string
          id: string
          portion: string | null
          portion_description: string | null
          protein: number
          updated_at: string
          usage_count: number
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          fats?: number
          food_name: string
          food_name_normalized: string
          id?: string
          portion?: string | null
          portion_description?: string | null
          protein?: number
          updated_at?: string
          usage_count?: number
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          fats?: number
          food_name?: string
          food_name_normalized?: string
          id?: string
          portion?: string | null
          portion_description?: string | null
          protein?: number
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      cached_recipes: {
        Row: {
          created_at: string
          difficulty: string | null
          id: string
          language: string | null
          main_ingredients: string[]
          meal_type: string | null
          recipe_data: Json
          recipe_name: string
          tags: string[] | null
          time_range: string | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          id?: string
          language?: string | null
          main_ingredients: string[]
          meal_type?: string | null
          recipe_data: Json
          recipe_name: string
          tags?: string[] | null
          time_range?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          id?: string
          language?: string | null
          main_ingredients?: string[]
          meal_type?: string | null
          recipe_data?: Json
          recipe_name?: string
          tags?: string[] | null
          time_range?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      cached_smart_tips: {
        Row: {
          context_type: string
          created_at: string
          id: string
          tip: string
          usage_count: number
        }
        Insert: {
          context_type?: string
          created_at?: string
          id?: string
          tip: string
          usage_count?: number
        }
        Update: {
          context_type?: string
          created_at?: string
          id?: string
          tip?: string
          usage_count?: number
        }
        Relationships: []
      }
      cooked_recipes: {
        Row: {
          cooked_at: string
          id: string
          recipe_data: Json
          recipe_name: string
          user_id: string
        }
        Insert: {
          cooked_at?: string
          id?: string
          recipe_data: Json
          recipe_name: string
          user_id: string
        }
        Update: {
          cooked_at?: string
          id?: string
          recipe_data?: Json
          recipe_name?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_food_tips: {
        Row: {
          category: string
          created_at: string
          food_name: string
          id: string
          tip_data: Json
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          food_name: string
          id?: string
          tip_data: Json
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          food_name?: string
          id?: string
          tip_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      favorite_recipes: {
        Row: {
          created_at: string
          id: string
          recipe_data: Json
          recipe_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_data: Json
          recipe_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_data?: Json
          recipe_name?: string
          user_id?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          id: string
          mode: string
          played_at: string
          recipes_completed: number
          score: number
          streak: number
          time_played: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          id?: string
          mode: string
          played_at?: string
          recipes_completed?: number
          score?: number
          streak?: number
          time_played?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          id?: string
          mode?: string
          played_at?: string
          recipes_completed?: number
          score?: number
          streak?: number
          time_played?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          fats: number
          food_name: string
          id: string
          meal_date: string
          meal_type: string
          portion: string | null
          protein: number
          recipe_data: Json | null
          source: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          fats?: number
          food_name: string
          id?: string
          meal_date?: string
          meal_type: string
          portion?: string | null
          protein?: number
          recipe_data?: Json | null
          source?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          fats?: number
          food_name?: string
          id?: string
          meal_date?: string
          meal_type?: string
          portion?: string | null
          protein?: number
          recipe_data?: Json | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          meal_type: string
          recipe_data: Json
          recipe_name: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          meal_type: string
          recipe_data: Json
          recipe_name: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          meal_type?: string
          recipe_data?: Json
          recipe_name?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      pantry_items: {
        Row: {
          category: string | null
          created_at: string
          expiration_date: string | null
          expiration_notified: boolean | null
          id: string
          ingredient_name: string
          quantity: number
          scanned_product_id: string | null
          source: string | null
          unit: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          expiration_date?: string | null
          expiration_notified?: boolean | null
          id?: string
          ingredient_name: string
          quantity?: number
          scanned_product_id?: string | null
          source?: string | null
          unit?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          expiration_date?: string | null
          expiration_notified?: boolean | null
          id?: string
          ingredient_name?: string
          quantity?: number
          scanned_product_id?: string | null
          source?: string | null
          unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pantry_items_scanned_product_id_fkey"
            columns: ["scanned_product_id"]
            isOneToOne: false
            referencedRelation: "scanned_products"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          external_reference: string | null
          id: string
          paid_at: string | null
          payment_id: string | null
          preference_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          external_reference?: string | null
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          preference_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          external_reference?: string | null
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          preference_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allergies: string[] | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          cooking_skill: string | null
          country: string | null
          created_at: string
          diet_type: string | null
          display_name: string | null
          gender: string | null
          household_size: number | null
          id: string
          language: string | null
          preferred_foods: string[] | null
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          cooking_skill?: string | null
          country?: string | null
          created_at?: string
          diet_type?: string | null
          display_name?: string | null
          gender?: string | null
          household_size?: number | null
          id: string
          language?: string | null
          preferred_foods?: string[] | null
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          cooking_skill?: string | null
          country?: string | null
          created_at?: string
          diet_type?: string | null
          display_name?: string | null
          gender?: string | null
          household_size?: number | null
          id?: string
          language?: string | null
          preferred_foods?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      scanned_products: {
        Row: {
          added_to_pantry: boolean | null
          brand: string | null
          calories: number | null
          cholesterol: number | null
          created_at: string
          dietary_fiber: number | null
          id: string
          image_url: string | null
          product_name: string
          protein: number | null
          raw_text: string | null
          saturated_fat: number | null
          serving_size: string | null
          sodium: number | null
          sugars: number | null
          total_carbs: number | null
          total_fat: number | null
          trans_fat: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          added_to_pantry?: boolean | null
          brand?: string | null
          calories?: number | null
          cholesterol?: number | null
          created_at?: string
          dietary_fiber?: number | null
          id?: string
          image_url?: string | null
          product_name: string
          protein?: number | null
          raw_text?: string | null
          saturated_fat?: number | null
          serving_size?: string | null
          sodium?: number | null
          sugars?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          trans_fat?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          added_to_pantry?: boolean | null
          brand?: string | null
          calories?: number | null
          cholesterol?: number | null
          created_at?: string
          dietary_fiber?: number | null
          id?: string
          image_url?: string | null
          product_name?: string
          protein?: number | null
          raw_text?: string | null
          saturated_fat?: number | null
          serving_size?: string | null
          sodium?: number | null
          sugars?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          trans_fat?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_recipes: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          recipe_data: Json
          recipe_name: string
          share_code: string
          shared_by_name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          recipe_data: Json
          recipe_name: string
          share_code: string
          shared_by_name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          recipe_data?: Json
          recipe_name?: string
          share_code?: string
          shared_by_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          ingredient_name: string
          is_purchased: boolean
          quantity: number
          unit: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          ingredient_name: string
          is_purchased?: boolean
          quantity?: number
          unit?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          ingredient_name?: string
          is_purchased?: boolean
          quantity?: number
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_type: string
          created_at: string
          id: string
          recipe_count_at_unlock: number | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          created_at?: string
          id?: string
          recipe_count_at_unlock?: number | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          created_at?: string
          id?: string
          recipe_count_at_unlock?: number | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_cooking_stats: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_cooked_at: string | null
          longest_streak: number
          total_recipes_cooked: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_cooked_at?: string | null
          longest_streak?: number
          total_recipes_cooked?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_cooked_at?: string | null
          longest_streak?: number
          total_recipes_cooked?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_fitness_goals: {
        Row: {
          created_at: string
          goal: Database["public"]["Enums"]["fitness_goal"]
          height_cm: number | null
          id: string
          target_date: string | null
          target_weeks: number | null
          target_weight_kg: number | null
          updated_at: string
          user_id: string
          weekly_workout_target: number | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          goal?: Database["public"]["Enums"]["fitness_goal"]
          height_cm?: number | null
          id?: string
          target_date?: string | null
          target_weeks?: number | null
          target_weight_kg?: number | null
          updated_at?: string
          user_id: string
          weekly_workout_target?: number | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          goal?: Database["public"]["Enums"]["fitness_goal"]
          height_cm?: number | null
          id?: string
          target_date?: string | null
          target_weeks?: number | null
          target_weight_kg?: number | null
          updated_at?: string
          user_id?: string
          weekly_workout_target?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      user_game_stats: {
        Row: {
          best_streak: number
          created_at: string
          high_score: number
          id: string
          last_played_at: string | null
          total_games_played: number
          total_recipes_completed: number
          total_time_played: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number
          created_at?: string
          high_score?: number
          id?: string
          last_played_at?: string | null
          total_games_played?: number
          total_recipes_completed?: number
          total_time_played?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number
          created_at?: string
          high_score?: number
          id?: string
          last_played_at?: string | null
          total_games_played?: number
          total_recipes_completed?: number
          total_time_played?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_learning_progress: {
        Row: {
          category: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          level: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          last_celebrated_milestone: number
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          last_celebrated_milestone?: number
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          last_celebrated_milestone?: number
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string
          daily_uses: number
          id: string
          is_premium: boolean
          last_use_date: string | null
          mp_preapproval_id: string | null
          mp_subscription_id: string | null
          plan_type: string | null
          recipe_uses: number
          subscription_end: string | null
          subscription_start: string | null
          subscription_status: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          trial_used: boolean | null
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string
          daily_uses?: number
          id?: string
          is_premium?: boolean
          last_use_date?: string | null
          mp_preapproval_id?: string | null
          mp_subscription_id?: string | null
          plan_type?: string | null
          recipe_uses?: number
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          trial_used?: boolean | null
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string
          daily_uses?: number
          id?: string
          is_premium?: boolean
          last_use_date?: string | null
          mp_preapproval_id?: string | null
          mp_subscription_id?: string | null
          plan_type?: string | null
          recipe_uses?: number
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          trial_used?: boolean | null
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          calories_burned: number | null
          created_at: string
          duration_minutes: number
          id: string
          intensity: number | null
          notes: string | null
          user_id: string
          workout_date: string
          workout_type: Database["public"]["Enums"]["workout_type"]
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string
          duration_minutes: number
          id?: string
          intensity?: number | null
          notes?: string | null
          user_id: string
          workout_date?: string
          workout_type: Database["public"]["Enums"]["workout_type"]
        }
        Update: {
          calories_burned?: number | null
          created_at?: string
          duration_minutes?: number
          id?: string
          intensity?: number | null
          notes?: string | null
          user_id?: string
          workout_date?: string
          workout_type?: Database["public"]["Enums"]["workout_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_increment_daily_uses: {
        Args: { p_daily_limit?: number; p_user_id: string }
        Returns: Json
      }
      check_subscription_expiry: { Args: { p_user_id: string }; Returns: Json }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          bio: string
          display_name: string
          id: string
        }[]
      }
      get_shared_recipe_by_code: {
        Args: { p_share_code: string }
        Returns: {
          created_at: string
          expires_at: string
          id: string
          recipe_data: Json
          recipe_name: string
          share_code: string
          shared_by_name: string
        }[]
      }
      get_xp_leaderboard: {
        Args: never
        Returns: {
          avatar_url: string
          country: string
          display_name: string
          rank: number
          total_games_played: number
          total_xp: number
          user_id: string
        }[]
      }
      has_active_access: { Args: { p_user_id: string }; Returns: boolean }
      has_write_access: { Args: { p_user_id: string }; Returns: boolean }
      increment_recipe_uses:
        | { Args: never; Returns: number }
        | { Args: { p_user_id: string }; Returns: number }
      is_subscription_active: { Args: { p_user_id: string }; Returns: boolean }
      record_streak_activity: { Args: never; Returns: Json }
      start_trial: { Args: { p_user_id: string }; Returns: Json }
      unlock_achievement: {
        Args: { p_achievement_type: string; p_recipe_count?: number }
        Returns: boolean
      }
    }
    Enums: {
      fitness_goal:
        | "lose_fat"
        | "gain_muscle"
        | "stay_active"
        | "improve_performance"
      workout_type:
        | "strength"
        | "cardio"
        | "boxing"
        | "functional"
        | "yoga"
        | "swimming"
        | "running"
        | "cycling"
        | "hiit"
        | "other"
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
    Enums: {
      fitness_goal: [
        "lose_fat",
        "gain_muscle",
        "stay_active",
        "improve_performance",
      ],
      workout_type: [
        "strength",
        "cardio",
        "boxing",
        "functional",
        "yoga",
        "swimming",
        "running",
        "cycling",
        "hiit",
        "other",
      ],
    },
  },
} as const
