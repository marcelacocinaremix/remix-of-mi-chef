// PaywallModal removed - app is now free
// This file is kept for compatibility but the modal is no longer used

import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaywallModal({ open, onOpenChange }: PaywallModalProps) {
  // App is free now, close immediately if somehow opened
  if (open) {
    onOpenChange(false);
  }
  
  return (
    <Dialog open={false} onOpenChange={onOpenChange}>
      <DialogContent>
        <p>La app es gratuita</p>
      </DialogContent>
    </Dialog>
  );
}
