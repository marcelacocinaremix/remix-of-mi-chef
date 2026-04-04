import { useMemo } from "react";
import { ShoppingCart, Package, Clock, ListChecks, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ShoppingHistoryItem {
  id: string;
  ingredient_name: string;
  category: string;
  is_purchased: boolean;
  created_at: string;
  quantity: number;
  unit: string;
}

interface SuperSmartHistoryProps {
  currentItems: ShoppingHistoryItem[];
  onSuggestItem?: (name: string, category: string) => void;
}

export function SuperSmartHistory({ currentItems }: SuperSmartHistoryProps) {
  const stats = useMemo(() => {
    const purchased = currentItems.filter(i => i.is_purchased).length;
    const pending = currentItems.filter(i => !i.is_purchased).length;
    return {
      total: currentItems.length,
      purchased,
      pending,
      inList: currentItems.length,
    };
  }, [currentItems]);

  if (stats.total === 0) return null;

  const cells = [
    { label: "En Lista", value: stats.inList, icon: ShoppingCart, color: "text-blue-500" },
    { label: "Comprados", value: stats.purchased, icon: Package, color: "text-emerald-500" },
    { label: "Pendientes", value: stats.pending, icon: Clock, color: "text-amber-500" },
    { label: "Total Items", value: stats.total, icon: ListChecks, color: "text-purple-500" },
  ];

  return (
    <Accordion type="single" collapsible className="border rounded-lg">
      <AccordionItem value="stats" className="border-0">
        <AccordionTrigger className="px-3 py-2 text-xs font-medium text-muted-foreground hover:no-underline">
          <span className="flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5" />
            Resumen
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-2">
          <div className="grid grid-cols-2 gap-2">
            {cells.map(cell => {
              const Icon = cell.icon;
              return (
                <div key={cell.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                  <Icon className={cn("w-4 h-4 shrink-0", cell.color)} />
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-tight">{cell.value}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{cell.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
