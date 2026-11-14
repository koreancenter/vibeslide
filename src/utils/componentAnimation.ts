import type React from "react";
import { ComponentAnimationType, ComponentBuildInConfig } from "../types";

export interface BuildInItemState {
  isVisible: boolean;
  style: React.CSSProperties;
  className: string;
}

export function getBuildInItemState(
  itemIndex: number,
  buildInStep?: number,
  config?: ComponentBuildInConfig
): BuildInItemState {
  // If build-in is disabled or not in step mode (buildInStep is undefined), always fully visible
  if (buildInStep === undefined || (config && config.enabled === false)) {
    return {
      isVisible: true,
      style: {
        transition: "opacity 0.3s ease, transform 0.3s ease",
      },
      className: "",
    };
  }

  // itemIndex is 0-indexed. Step 0 is slide headers, step 1 reveals item 0, etc.
  const isVisible = itemIndex + 1 <= buildInStep;
  const animationType: ComponentAnimationType = config?.animation || "slide-up";

  let hiddenTransform = "translateY(16px)";
  if (animationType === "slide-right") hiddenTransform = "translateX(-20px)";
  else if (animationType === "zoom-in") hiddenTransform = "scale(0.92)";
  else if (animationType === "flip-up") hiddenTransform = "perspective(600px) rotateX(25deg)";
  else if (animationType === "fade") hiddenTransform = "none";

  return {
    isVisible,
    style: {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "none" : hiddenTransform,
      transition: "opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      pointerEvents: isVisible ? "auto" : "none",
    },
    className: isVisible ? "animate-in-build" : "pointer-events-none select-none",
  };
}
