import { useState } from "react";
import { 
  Salad, Wallet, Zap, Heart, Dumbbell, Baby,
  Sparkles, ChevronDown 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export interface WeekTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tags: string[];
  characteristics: {
    avgTime: number;
    difficulty: string;
    variety: string;
  };
}

const TEMPLATES: WeekTemplate[] = [
  {
    id: 'healthy',
    name: 'Semana Saludable',
    description: 'Comidas equilibradas con muchas verduras, proteínas magras y granos integrales',
    icon: <Salad className="w-4 h-4" />,
    tags: ['bajo en calorías', 'alto en fibra', 'nutritivo'],
    characteristics: {
      avgTime: 35,
      difficulty: 'media',
      variety: 'alta'
    }
  },
  {
    id: 'budget',
    name: 'Presupuesto Bajo',
    description: 'Recetas económicas que maximizan ingredientes accesibles y minimizan desperdicio',
    icon: <Wallet className="w-4 h-4" />,
    tags: ['económico', 'ingredientes simples', 'rendidor'],
    characteristics: {
      avgTime: 30,
      difficulty: 'fácil',
      variety: 'media'
    }
  },
  {
    id: 'quick',
    name: 'Semana Express',
    description: 'Todas las recetas en 20 minutos o menos, perfectas para días ocupados',
    icon: <Zap className="w-4 h-4" />,
    tags: ['rápido', 'fácil', 'práctico'],
    characteristics: {
      avgTime: 18,
      difficulty: 'fácil',
      variety: 'media'
    }
  },
  {
    id: 'comfort',
    name: 'Comida Reconfortante',
    description: 'Platos caseros que calientan el alma: guisos, sopas y favoritos de siempre',
    icon: <Heart className="w-4 h-4" />,
    tags: ['casero', 'abundante', 'tradicional'],
    characteristics: {
      avgTime: 45,
      difficulty: 'media',
      variety: 'media'
    }
  },
  {
    id: 'protein',
    name: 'Alto en Proteína',
    description: 'Ideal para deportistas o quienes buscan aumentar su consumo proteico',
    icon: <Dumbbell className="w-4 h-4" />,
    tags: ['proteico', 'energético', 'fitness'],
    characteristics: {
      avgTime: 35,
      difficulty: 'media',
      variety: 'alta'
    }
  },
  {
    id: 'family',
    name: 'Familia Feliz',
    description: 'Recetas que gustan a grandes y chicos, fáciles de adaptar para todos',
    icon: <Baby className="w-4 h-4" />,
    tags: ['familiar', 'versátil', 'clásico'],
    characteristics: {
      avgTime: 40,
      difficulty: 'fácil',
      variety: 'alta'
    }
  },
];

interface WeekTemplatesProps {
  onSelectTemplate: (template: WeekTemplate) => void;
  isLoading?: boolean;
}

export function WeekTemplates({ onSelectTemplate, isLoading }: WeekTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<WeekTemplate | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSelect = (template: WeekTemplate) => {
    setSelectedTemplate(template);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      setShowConfirm(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isLoading} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Usar plantilla
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Plantillas de semana</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {TEMPLATES.map((template) => (
            <DropdownMenuItem
              key={template.id}
              onClick={() => handleSelect(template)}
              className="flex items-start gap-3 p-3 cursor-pointer"
            >
              <div className={cn(
                "p-2 rounded-lg",
                template.id === 'healthy' && "bg-green-100 dark:bg-green-950/50 text-green-600",
                template.id === 'budget' && "bg-amber-100 dark:bg-amber-950/50 text-amber-600",
                template.id === 'quick' && "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-600",
                template.id === 'comfort' && "bg-pink-100 dark:bg-pink-950/50 text-pink-600",
                template.id === 'protein' && "bg-blue-100 dark:bg-blue-950/50 text-blue-600",
                template.id === 'family' && "bg-purple-100 dark:bg-purple-950/50 text-purple-600",
              )}>
                {template.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{template.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate?.icon}
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Characteristics */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-secondary/30 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">{selectedTemplate.characteristics.avgTime}'</p>
                  <p className="text-xs text-muted-foreground">Tiempo promedio</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-primary capitalize">{selectedTemplate.characteristics.difficulty}</p>
                  <p className="text-xs text-muted-foreground">Dificultad</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-primary capitalize">{selectedTemplate.characteristics.variety}</p>
                  <p className="text-xs text-muted-foreground">Variedad</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                La IA generará un plan semanal completo basado en esta plantilla y tus ingredientes disponibles.
                Las recetas existentes no se modificarán.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generar plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { TEMPLATES };
