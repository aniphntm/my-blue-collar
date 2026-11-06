import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** MyBlue Edge Button. Primary is the one accent fill; secondary is outlined; link is a quiet text CTA. */
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-1.5 rounded-card font-medium transition-colors outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 before:absolute before:-inset-y-2 before:inset-x-0 before:content-['']",
  {
    variants: {
      variant: {
        default: "bg-accent text-on-accent hover:bg-accent-dark",
        secondary: "border border-border-mid text-ink hover:border-ink",
        link: "text-mut hover:text-ink font-normal before:-inset-y-3.5 before:-inset-x-1",
      },
      size: {
        default: "px-5 py-2.5 text-[15px]",
        sm: "px-3.5 py-1.5 text-[13px]",
        block: "w-full py-3 text-[15px]",
      },
    },
    compoundVariants: [{ variant: "link", className: "p-0 text-[13px]" }],
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
