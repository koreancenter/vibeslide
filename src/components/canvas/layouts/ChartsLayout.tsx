import React from "react";
import { InteractiveChart } from "../../InteractiveChart";
import { CommonLayoutProps } from "./layoutTypes";

export const ChartsLayout: React.FC<CommonLayoutProps> = ({
  slide,
  theme,
  language,
}) => {
  return (
    <div data-collision-zone="static" className="w-full">
      <InteractiveChart
        type={slide.layout as any}
        bullets={slide.bullets || []}
        stats={slide.stats || []}
        language={language}
        accentColor={theme.accentColor}
        accentSecondary={theme.accentSecondary}
        cardBg={theme.cardBg}
        textColor={theme.textColor}
        borderColor={theme.borderColor}
      />
    </div>
  );
};
