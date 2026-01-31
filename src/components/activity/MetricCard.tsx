import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "./AnimatedCounter";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  feedback?: string;
  color: 'orange' | 'red' | 'green' | 'blue' | 'purple' | 'yellow';
  suffix?: string;
  delay?: number;
}

const colorClasses = {
  orange: { 
    text: "text-primary",
    iconBg: "bg-primary/15",
  },
  red: { 
    text: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-500/15",
  },
  green: { 
    text: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/15",
  },
  blue: { 
    text: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/15",
  },
  purple: { 
    text: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-500/15",
  },
  yellow: { 
    text: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/15",
  },
};

export function MetricCard({ icon, value, label, feedback, color, suffix, delay = 0 }: MetricCardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="overflow-hidden bg-card border-border hover:shadow-md transition-all duration-300">
        <CardContent className="pt-4 pb-3 text-center">
          <motion.div 
            className={cn(
              "w-11 h-11 mx-auto mb-2 rounded-xl flex items-center justify-center",
              colors.iconBg,
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: delay + 0.1 }}
          >
            <div className={cn(colors.text)}>{icon}</div>
          </motion.div>
          
          <div className={cn("text-2xl font-bold tracking-tight", colors.text)}>
            <AnimatedCounter value={value} suffix={suffix} duration={0.8} />
          </div>
          
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
          
          {feedback && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.3 }}
              className="text-[10px] text-muted-foreground/80 mt-1.5 leading-tight px-1"
            >
              {feedback}
            </motion.p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
