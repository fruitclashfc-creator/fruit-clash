import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const gameButtonVariants = cva(
  "relative inline-flex items-center justify-center font-game-heading text-lg uppercase tracking-wider transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-95 overflow-hidden",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-b from-primary to-orange-600 text-primary-foreground box-glow-orange hover:brightness-110 border-2 border-orange-400/50",
        secondary:
          "bg-gradient-to-b from-secondary to-purple-700 text-secondary-foreground box-glow-purple hover:brightness-110 border-2 border-purple-400/50",
        accent:
          "bg-gradient-to-b from-accent to-cyan-600 text-accent-foreground box-glow-cyan hover:brightness-110 border-2 border-cyan-400/50",
        gold:
          "bg-gradient-to-b from-game-legendary to-amber-600 text-primary-foreground box-glow-gold hover:brightness-110 border-2 border-yellow-400/50",
        destructive:
          "bg-gradient-to-b from-destructive to-red-700 text-destructive-foreground hover:brightness-110 border-2 border-red-400/50",
        ghost:
          "bg-transparent text-foreground hover:bg-muted/50 border-2 border-muted",
        outline:
          "bg-transparent border-2 border-primary text-primary hover:bg-primary/10",
      },
      size: {
        sm: "h-10 px-4 text-sm rounded-lg",
        md: "h-12 px-6 text-base rounded-xl",
        lg: "h-14 px-8 text-lg rounded-xl",
        xl: "h-16 px-10 text-xl rounded-2xl",
        icon: "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface GameButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gameButtonVariants> {
  children: React.ReactNode;
}

const GameButton = React.forwardRef<HTMLButtonElement, GameButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        className={cn(gameButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </button>
    );
  }
);
GameButton.displayName = "GameButton";

export { GameButton, gameButtonVariants };
