import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppTheme, THEMES, AppTheme } from "@/contexts/ThemeContext";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const themeGradients: Record<AppTheme, string> = {
  "cyan-light": "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 40%, #00bcd4 100%)",
  "cyan-dark": "linear-gradient(135deg, #0a1929 0%, #0d2d4a 40%, #00acc1 100%)",
  "rose-light": "linear-gradient(135deg, #fce4ec 0%, #f8bbd9 40%, #e91e8c 100%)",
  "rose-dark": "linear-gradient(135deg, #1a0a12 0%, #3d0c24 40%, #e91e8c 100%)",
};

const themePrimaryColors: Record<AppTheme, string> = {
  "cyan-light": "#00bcd4",
  "cyan-dark": "#00acc1",
  "rose-light": "#e91e8c",
  "rose-dark": "#e91e8c",
};

export function ThemePickerModal({ open, onOpenChange }: ThemePickerModalProps) {
  const { theme, setTheme } = useAppTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Palette className="w-5 h-5 text-primary" />
            Elegí tu tema
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-2 mb-2">
          Personalizá los colores de toda la app
        </p>

        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((t) => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  onOpenChange(false);
                }}
                className={cn(
                  "relative rounded-2xl overflow-hidden border-2 transition-all duration-200 group",
                  isSelected
                    ? "border-primary shadow-lg scale-[1.03]"
                    : "border-border hover:border-primary/40 hover:scale-[1.02]"
                )}
              >
                {/* Preview swatch */}
                <div
                  className="h-20 w-full"
                  style={{ background: themeGradients[t.id] }}
                >
                  {/* Mini UI preview dots */}
                  <div className="flex items-end justify-center h-full pb-3 gap-1.5">
                    <div className="w-6 h-6 rounded-lg" style={{ background: themePrimaryColors[t.id], opacity: 0.9 }} />
                    <div className="w-4 h-4 rounded-md" style={{ background: themePrimaryColors[t.id], opacity: 0.6 }} />
                    <div className="w-5 h-5 rounded-lg" style={{ background: themePrimaryColors[t.id], opacity: 0.75 }} />
                  </div>
                </div>

                {/* Label */}
                <div className="px-3 py-2 bg-card text-left">
                  <p className="text-xs font-semibold text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground">{t.description}</p>
                </div>

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
