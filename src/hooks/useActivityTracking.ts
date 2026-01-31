import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type FitnessGoal = 'lose_fat' | 'gain_muscle' | 'stay_active' | 'improve_performance';
export type WorkoutType = 'strength' | 'cardio' | 'boxing' | 'functional' | 'yoga' | 'swimming' | 'running' | 'cycling' | 'hiit' | 'other';

export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_type: WorkoutType;
  duration_minutes: number;
  intensity: number | null;
  calories_burned: number | null;
  notes: string | null;
  workout_date: string;
  created_at: string;
}

export interface UserFitnessGoal {
  id: string;
  user_id: string;
  goal: FitnessGoal;
  weight_kg: number | null;
  target_weight_kg: number | null;
  height_cm: number | null;
  target_weeks: number | null;
  target_date: string | null;
  weekly_workout_target: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityProfile {
  weight_kg: number | null;
  target_weight_kg: number | null;
  height_cm: number | null;
  goal: FitnessGoal;
  target_weeks: number | null;
  target_date: string | null;
  weekly_workout_target: number;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalMinutes: number;
  totalCalories: number;
  currentStreak: number;
  bestStreak: number;
  favoriteWorkout: WorkoutType | null;
  avgDuration: number;
  weeklyWorkouts: number;
  monthlyWorkouts: number;
  weeklyWorkoutTarget: number;
  targetProgress: number; // percentage 0-100
}

const WORKOUT_CALORIES_PER_MINUTE: Record<WorkoutType, number> = {
  strength: 5,
  cardio: 8,
  boxing: 10,
  functional: 7,
  yoga: 3,
  swimming: 9,
  running: 10,
  cycling: 7,
  hiit: 12,
  other: 5,
};

export function useActivityTracking() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [goal, setGoal] = useState<UserFitnessGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch workouts and goal
  const fetchData = useCallback(async () => {
    if (!user) {
      setWorkouts([]);
      setGoal(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch workouts
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false });

      if (workoutsError) throw workoutsError;
      setWorkouts((workoutsData as WorkoutLog[]) || []);

      // Fetch goal with new columns
      const { data: goalData, error: goalError } = await supabase
        .from('user_fitness_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (goalError && goalError.code !== 'PGRST116') throw goalError;
      setGoal(goalData as UserFitnessGoal | null);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set or update fitness goal with full profile
  const updateActivityProfile = useCallback(async (profile: ActivityProfile) => {
    if (!user) return false;

    setIsSaving(true);
    try {
      const payload = {
        goal: profile.goal,
        weight_kg: profile.weight_kg,
        target_weight_kg: profile.target_weight_kg,
        height_cm: profile.height_cm,
        target_weeks: profile.target_weeks,
        target_date: profile.target_date,
        weekly_workout_target: profile.weekly_workout_target,
        updated_at: new Date().toISOString(),
      };

      if (goal) {
        // Update existing goal
        const { error } = await supabase
          .from('user_fitness_goals')
          .update(payload)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Insert new goal
        const { error } = await supabase
          .from('user_fitness_goals')
          .insert({ user_id: user.id, ...payload });
        if (error) throw error;
      }
      
      await fetchData();
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error al guardar perfil');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, goal, fetchData]);

  // Set or update fitness goal (simple version)
  const setFitnessGoal = useCallback(async (newGoal: FitnessGoal) => {
    if (!user) return;

    setIsSaving(true);
    try {
      if (goal) {
        // Update existing goal
        const { error } = await supabase
          .from('user_fitness_goals')
          .update({ goal: newGoal, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Insert new goal
        const { error } = await supabase
          .from('user_fitness_goals')
          .insert({ user_id: user.id, goal: newGoal });
        if (error) throw error;
      }
      
      await fetchData();
      toast.success('Objetivo actualizado');
    } catch (error) {
      console.error('Error setting goal:', error);
      toast.error('Error al guardar objetivo');
    } finally {
      setIsSaving(false);
    }
  }, [user, goal, fetchData]);

  // Add workout
  const addWorkout = useCallback(async (
    workoutType: WorkoutType,
    durationMinutes: number,
    intensity?: number,
    notes?: string,
    workoutDate?: string
  ) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const caloriesBurned = Math.round(durationMinutes * WORKOUT_CALORIES_PER_MINUTE[workoutType] * ((intensity || 5) / 5));
      
      const { error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: user.id,
          workout_type: workoutType,
          duration_minutes: durationMinutes,
          intensity: intensity || null,
          calories_burned: caloriesBurned,
          notes: notes || null,
          workout_date: workoutDate || new Date().toISOString().split('T')[0],
        });

      if (error) throw error;
      await fetchData();
      return true;
    } catch (error) {
      console.error('Error adding workout:', error);
      toast.error('Error al guardar entrenamiento');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, fetchData]);

  // Delete workout
  const deleteWorkout = useCallback(async (workoutId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('id', workoutId)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchData();
      toast.success('Entrenamiento eliminado');
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Error al eliminar entrenamiento');
    }
  }, [user, fetchData]);

  // Calculate stats
  const stats: WorkoutStats = (() => {
    const weeklyTarget = goal?.weekly_workout_target || 3;
    
    if (workouts.length === 0) {
      return {
        totalWorkouts: 0,
        totalMinutes: 0,
        totalCalories: 0,
        currentStreak: 0,
        bestStreak: 0,
        favoriteWorkout: null,
        avgDuration: 0,
        weeklyWorkouts: 0,
        monthlyWorkouts: 0,
        weeklyWorkoutTarget: weeklyTarget,
        targetProgress: 0,
      };
    }

    const totalWorkouts = workouts.length;
    const totalMinutes = workouts.reduce((sum, w) => sum + w.duration_minutes, 0);
    const totalCalories = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
    const avgDuration = Math.round(totalMinutes / totalWorkouts);

    // Calculate weekly and monthly workouts
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const weeklyWorkouts = workouts.filter(w => new Date(w.workout_date) >= weekAgo).length;
    const monthlyWorkouts = workouts.filter(w => new Date(w.workout_date) >= monthAgo).length;

    // Calculate target progress
    const targetProgress = Math.min(100, Math.round((weeklyWorkouts / weeklyTarget) * 100));

    // Calculate streak
    const sortedDates = [...new Set(workouts.map(w => w.workout_date))].sort().reverse();
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      for (let i = 0; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const expectedDate = new Date(sortedDates[0]);
        expectedDate.setDate(expectedDate.getDate() - i);
        
        if (currentDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
          tempStreak++;
        } else {
          break;
        }
      }
      currentStreak = tempStreak;
    }

    // Calculate best streak
    tempStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
      
      if (diffDays === 1) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    bestStreak = Math.max(bestStreak, currentStreak, tempStreak);

    // Find favorite workout
    const workoutCounts = workouts.reduce((acc, w) => {
      acc[w.workout_type] = (acc[w.workout_type] || 0) + 1;
      return acc;
    }, {} as Record<WorkoutType, number>);
    
    const favoriteWorkout = Object.entries(workoutCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as WorkoutType || null;

    return {
      totalWorkouts,
      totalMinutes,
      totalCalories,
      currentStreak,
      bestStreak,
      favoriteWorkout,
      avgDuration,
      weeklyWorkouts,
      monthlyWorkouts,
      weeklyWorkoutTarget: weeklyTarget,
      targetProgress,
    };
  })();

  // Get workouts by time period
  const getWorkoutsByPeriod = useCallback((period: 'week' | 'month' | 'year') => {
    const now = new Date();
    let cutoffDate: Date;

    switch (period) {
      case 'week':
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case 'month':
        cutoffDate = new Date(now);
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      case 'year':
        cutoffDate = new Date(now);
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
    }

    return workouts.filter(w => new Date(w.workout_date) >= cutoffDate);
  }, [workouts]);

  return {
    workouts,
    goal,
    stats,
    isLoading,
    isSaving,
    setFitnessGoal,
    updateActivityProfile,
    addWorkout,
    deleteWorkout,
    getWorkoutsByPeriod,
    refetch: fetchData,
  };
}
