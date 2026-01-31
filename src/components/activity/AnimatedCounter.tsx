import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

export function AnimatedCounter({ value, duration = 1, className, suffix }: AnimatedCounterProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const spring = useSpring(0, { 
    mass: 0.8, 
    stiffness: 75, 
    damping: 15, 
    duration: duration * 1000 
  });
  
  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isClient) {
      spring.set(value);
    }
  }, [spring, value, isClient]);

  useEffect(() => {
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return () => unsubscribe();
  }, [display]);

  if (!isClient) {
    return <span className={className}>{value}{suffix}</span>;
  }

  return (
    <motion.span className={className}>
      {displayValue}{suffix}
    </motion.span>
  );
}
