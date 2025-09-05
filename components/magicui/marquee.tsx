"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const marqueeVariants = cva(
  "group relative flex w-fit animate-marquee flex-row [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
  {
    variants: {
      reverse: {
        true: "animate-marquee-reverse",
        false: "",
      },
      vertical: {
        true: "rotate-90 flex-col",
        false: "",
      },
      pauseOnHover: {
        true: "[--pause-on-hover:paused]",
        false: "",
      },
    },
    defaultVariants: {
      reverse: false,
      vertical: false,
      pauseOnHover: false,
    },
  }
);

const marqueeContentVariants = cva(
  "flex shrink-0 justify-around [gap:var(--gap)]",
  {
    variants: {
      vertical: {
        true: "flex-col",
        false: "flex-row",
      },
    },
    defaultVariants: {
      vertical: false,
    },
  }
);

interface MarqueeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof marqueeVariants> {
  children: React.ReactNode;
  repeat?: number;
}

const Marquee = forwardRef<HTMLDivElement, MarqueeProps>(
  (
    {
      children,
      className,
      repeat = 4,
      reverse,
      vertical,
      pauseOnHover,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative flex w-fit overflow-hidden [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
          className
        )}
        {...props}
      >
        {Array(repeat)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className={cn(
                marqueeVariants({ reverse, vertical, pauseOnHover })
              )}
              style={{
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div className={cn(marqueeContentVariants({ vertical }))}>
                {children}
              </div>
            </div>
          ))}
      </div>
    );
  }
);

Marquee.displayName = "Marquee";

export { Marquee, marqueeVariants };
