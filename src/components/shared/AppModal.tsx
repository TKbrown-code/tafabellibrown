import {
  CheckCircle2,
  CircleAlert,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { ModalOptions } from "@/contexts/ModalContext";

interface AppModalProps {
  modal: ModalOptions | null;
  onClose: () => void;
}

const modalStyles = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-success",
    iconBackground: "bg-success/10",
    iconBorder: "border-success/20",
  },
  error: {
    icon: CircleAlert,
    iconColor: "text-danger",
    iconBackground: "bg-danger/10",
    iconBorder: "border-danger/20",
  },
  warning: {
    icon: TriangleAlert,
    iconColor: "text-amber-500",
    iconBackground: "bg-amber-500/10",
    iconBorder: "border-amber-500/20",
  },
  info: {
    icon: Info,
    iconColor: "text-accent",
    iconBackground: "bg-accent/10",
    iconBorder: "border-accent/20",
  },
} satisfies Record<
  ModalOptions["type"],
  {
    icon: typeof CheckCircle2;
    iconColor: string;
    iconBackground: string;
    iconBorder: string;
  }
>;

export function AppModal({ modal, onClose }: AppModalProps) {
  const isOpen = modal !== null;

  const style = modal ? modalStyles[modal.type] : modalStyles.info;
  const Icon = style.icon;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="border border-border bg-surface shadow-lift sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div
            className={`mb-3 flex size-14 items-center justify-center rounded-full border ${style.iconBackground} ${style.iconBorder}`}
          >
            <Icon className={`size-7 ${style.iconColor}`} />
          </div>

          <DialogTitle className="font-display text-xl font-bold tracking-tight text-ink">
            {modal?.title}
          </DialogTitle>

          {modal?.description && (
            <DialogDescription className="mt-2 text-sm leading-relaxed text-muted">
              {modal.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary min-w-28 cursor-pointer"
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}