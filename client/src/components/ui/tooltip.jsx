import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const TooltipProvider = ({ children }) => children;

const Tooltip = React.forwardRef(({ children, content, side = "right", ...props }, ref) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const triggerRef = React.useRef(null);

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      {...props}
    >
      <div ref={triggerRef}>{children}</div>
      {isVisible && content && (
        <div
          className={cn(
            "absolute z-50 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg animate-in fade-in-0 zoom-in-95",
            side === "right" && "left-full ml-2 top-1/2 -translate-y-1/2",
            side === "left" && "right-full mr-2 top-1/2 -translate-y-1/2",
            side === "top" && "bottom-full mb-2 left-1/2 -translate-x-1/2",
            side === "bottom" && "top-full mt-2 left-1/2 -translate-x-1/2"
          )}
        >
          {content}
          <div
            className={cn(
              "absolute w-2 h-2 bg-gray-900 rotate-45",
              side === "right" && "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
              side === "left" && "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
              side === "top" && "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
              side === "bottom" && "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
            )}
          />
        </div>
      )}
    </div>
  );
});
Tooltip.displayName = "Tooltip";

const TooltipTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={className} {...props} />
));
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
