"use client";

import { cn } from "@/lib/utils";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

// const Slider = React.forwardRef<
//   React.ElementRef<typeof SliderPrimitive.Root>,
//   React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
// >(({ className, ...props }, ref) => (
//   <SliderPrimitive.Root
//     className={cn("relative flex w-full touch-none select-none items-center cursor-pointer", className)}
//     ref={ref}
//     {...props}
//   >
//     <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-secondary">
//       <SliderPrimitive.Range className="absolute h-full bg-primary" />
//     </SliderPrimitive.Track>
//     <SliderPrimitive.Thumb className="block h-3 w-3 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
//   </SliderPrimitive.Root>
// ));
// Slider.displayName = SliderPrimitive.Root.displayName;

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  className?: string;
}

function Slider({ className, ...props }: SliderProps) {
  const [trackIsHovered, setTrackIsHovered] = React.useState(false);
  const ref = React.useRef(null); // Create a ref for the SliderPrimitive.Root element

  return (
    <SliderPrimitive.Root
      className={cn("relative flex w-full touch-none select-none items-center cursor-pointer py-4", className)}
      onMouseEnter={() => setTrackIsHovered(true)}
      onMouseLeave={() => setTrackIsHovered(false)}
      ref={ref}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-secondary hover:scale-y-150">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {trackIsHovered ? (
        <SliderPrimitive.Thumb className="block h-3 w-3 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      ) : null}
    </SliderPrimitive.Root>
  );
}
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
