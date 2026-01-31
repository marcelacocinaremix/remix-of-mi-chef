import { useState, useEffect } from "react";
import { 
  Package, Plus, Trash2, Search, BarChart3, 
  ChevronDown, ChevronUp, ShoppingCart, Eye 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProductScanner } from "./ProductScanner";
import { ProductNutritionChart } from "./ProductNutritionChart";
import { NutritionSmartHistory } from "./NutritionSmartHistory";
import { cn } from "@/lib/utils";

interface ScannedProduct {
  id: string;
  product_name: string;
  brand: string | null;
  serving_size: string | null;
  calories: number | null;
  total_fat: number | null;
  saturated_fat: number | null;
  trans_fat: number | null;
  cholesterol: number | null;
  sodium: number | null;
  total_carbs: number | null;
  dietary_fiber: number | null;
  sugars: number | null;
  protein: number | null;
  added_to_pantry: boolean;
  created_at: string;
}

export function ScannedProducts() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<ScannedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ScannedProduct | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("scanned_products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("scanned_products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== id));
      toast({
        title: "Producto eliminado",
        description: "Se eliminó el producto correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto.",
        variant: "destructive",
      });
    }
  };

  const handleAddToPantry = async (product: ScannedProduct) => {
    if (!user) return;

    try {
      // Add to pantry
      const { error: pantryError } = await supabase
        .from("pantry_items")
        .insert({
          user_id: user.id,
          ingredient_name: product.product_name.toLowerCase(),
          category: "otros",
          source: "scanned",
          scanned_product_id: product.id,
        });

      if (pantryError) throw pantryError;

      // Update product flag
      const { error: updateError } = await supabase
        .from("scanned_products")
        .update({ added_to_pantry: true })
        .eq("id", product.id);

      if (updateError) throw updateError;

      setProducts(products.map(p => 
        p.id === product.id ? { ...p, added_to_pantry: true } : p
      ));

      toast({
        title: "✅ Agregado a despensa",
        description: `${product.product_name} se agregó a tu despensa.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar a la despensa.",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter(p =>
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-semibold text-lg mb-2">Escaneá tus productos</h3>
        <p className="text-muted-foreground text-sm">
          Iniciá sesión para guardar productos escaneados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={cn(
        "bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-transparent",
        "rounded-2xl p-4 border border-border/50"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20">
              <Package className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">Productos Escaneados</h3>
              <p className="text-xs text-muted-foreground">{products.length} productos guardados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => setShowScanner(true)} className="gap-2 flex-1">
          <Plus className="w-4 h-4" />
          Escanear Producto
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h4 className="font-medium text-lg mb-2">
            {searchTerm ? "No se encontraron productos" : "No hay productos escaneados"}
          </h4>
          <p className="text-muted-foreground text-sm mb-4">
            {searchTerm ? "Probá con otra búsqueda" : "Escaneá la tabla nutricional de tus productos"}
          </p>
          <Button onClick={() => setShowScanner(true)} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Escanear primer producto
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className={cn(
                "overflow-hidden transition-all",
                expandedProduct === product.id && "ring-2 ring-primary/50"
              )}
            >
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => setExpandedProduct(
                      expandedProduct === product.id ? null : product.id
                    )}
                  >
                    <CardTitle className="text-base flex items-center gap-2">
                      {product.product_name}
                      {product.added_to_pantry && (
                        <Badge variant="secondary" className="text-xs">
                          En despensa
                        </Badge>
                      )}
                    </CardTitle>
                    {product.brand && (
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setExpandedProduct(
                        expandedProduct === product.id ? null : product.id
                      )}
                    >
                      {expandedProduct === product.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-3 text-xs mt-2">
                  {product.calories && (
                    <span className="text-orange-600 dark:text-orange-400">
                      {product.calories} kcal
                    </span>
                  )}
                  {product.protein && (
                    <span className="text-blue-600 dark:text-blue-400">
                      {product.protein}g prot
                    </span>
                  )}
                  {product.total_carbs && (
                    <span className="text-green-600 dark:text-green-400">
                      {product.total_carbs}g carbs
                    </span>
                  )}
                </div>
              </CardHeader>

              {expandedProduct === product.id && (
                <CardContent className="p-3 pt-0 border-t">
                  <div className="grid grid-cols-2 gap-2 text-sm py-2">
                    {product.serving_size && (
                      <div className="col-span-2 text-xs text-muted-foreground mb-1">
                        Porción: {product.serving_size}
                      </div>
                    )}
                    {product.calories && <div>Calorías: <span className="font-medium">{product.calories} kcal</span></div>}
                    {product.protein && <div>Proteínas: <span className="font-medium">{product.protein}g</span></div>}
                    {product.total_carbs && <div>Carbohidratos: <span className="font-medium">{product.total_carbs}g</span></div>}
                    {product.sugars && <div>Azúcares: <span className="font-medium">{product.sugars}g</span></div>}
                    {product.total_fat && <div>Grasas: <span className="font-medium">{product.total_fat}g</span></div>}
                    {product.saturated_fat && <div>Grasas sat.: <span className="font-medium">{product.saturated_fat}g</span></div>}
                    {product.dietary_fiber && <div>Fibra: <span className="font-medium">{product.dietary_fiber}g</span></div>}
                    {product.sodium && <div>Sodio: <span className="font-medium">{product.sodium}mg</span></div>}
                  </div>

                  <div className="flex gap-2 mt-3">
                    {!product.added_to_pantry && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-1"
                        onClick={() => handleAddToPantry(product)}
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Agregar a despensa
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <Eye className="w-3 h-3" />
                      Ver gráfico
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Smart History */}
      <NutritionSmartHistory />

      {/* Scanner Dialog */}
      <ProductScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onProductSaved={fetchProducts}
      />

      {/* Nutrition Chart Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {selectedProduct?.product_name}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductNutritionChart product={selectedProduct} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
