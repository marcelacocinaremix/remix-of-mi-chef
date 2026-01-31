import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ShoppingListItem {
  id: string;
  ingredient_name: string;
  category: string;
  is_purchased: boolean;
  created_at: string;
  quantity: number;
  unit: string;
}

export function useShoppingList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchItems = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("shopping_list_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching shopping list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user]);

  const addItem = async (ingredientName: string, category: string = "otros", quantity: number = 1, unit: string = "unidad") => {
    if (!user) {
      toast({
        title: "Iniciá sesión",
        description: "Necesitás una cuenta para usar la lista del súper.",
        variant: "destructive",
      });
      return false;
    }

    // Check if item already exists
    const existingItem = items.find(
      (item) => item.ingredient_name.toLowerCase() === ingredientName.toLowerCase()
    );

    if (existingItem) {
      // If exists, update quantity instead
      const newQuantity = existingItem.quantity + quantity;
      await updateQuantity(existingItem.id, newQuantity);
      toast({
        title: "Cantidad actualizada",
        description: `${ingredientName} ahora tiene ${newQuantity} ${existingItem.unit}.`,
      });
      return true;
    }

    try {
      const { data, error } = await supabase
        .from("shopping_list_items")
        .insert([
          {
            user_id: user.id,
            ingredient_name: ingredientName,
            category: category,
            quantity: quantity,
            unit: unit,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setItems((prev) => [data, ...prev]);
      toast({
        title: "¡Agregado!",
        description: `${ingredientName} se agregó a tu lista del súper.`,
      });
      return true;
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el ingrediente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    
    try {
      const { error } = await supabase
        .from("shopping_list_items")
        .update({ quantity })
        .eq("id", itemId);

      if (error) throw error;

      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, quantity } : i
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cantidad.",
        variant: "destructive",
      });
    }
  };

  const updateUnit = async (itemId: string, unit: string) => {
    try {
      const { error } = await supabase
        .from("shopping_list_items")
        .update({ unit })
        .eq("id", itemId);

      if (error) throw error;

      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, unit } : i
        )
      );
    } catch (error) {
      console.error("Error updating unit:", error);
    }
  };

  const togglePurchased = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    try {
      const { error } = await supabase
        .from("shopping_list_items")
        .update({ is_purchased: !item.is_purchased })
        .eq("id", itemId);

      if (error) throw error;

      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, is_purchased: !i.is_purchased } : i
        )
      );
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el ingrediente.",
        variant: "destructive",
      });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("shopping_list_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el ingrediente.",
        variant: "destructive",
      });
    }
  };

  const clearPurchased = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("shopping_list_items")
        .delete()
        .eq("user_id", user.id)
        .eq("is_purchased", true);

      if (error) throw error;

      setItems((prev) => prev.filter((i) => !i.is_purchased));
      toast({
        title: "¡Listo!",
        description: "Se eliminaron los ingredientes comprados.",
      });
    } catch (error) {
      console.error("Error clearing purchased:", error);
    }
  };

  const pendingCount = items.filter((i) => !i.is_purchased).length;

  return {
    items,
    isLoading,
    addItem,
    updateQuantity,
    updateUnit,
    togglePurchased,
    removeItem,
    clearPurchased,
    pendingCount,
    refetch: fetchItems,
  };
}
