import React from "react";
import { CommonLayoutProps } from "./layoutTypes";
import { ChartsLayout } from "./ChartsLayout";
import { TableLayout } from "./TableLayout";
import { KeyStatsLayout } from "./KeyStatsLayout";
import { ProcessLayout } from "./ProcessLayout";
import { SplitInfoLayout } from "./SplitInfoLayout";
import { CardsLayout } from "./CardsLayout";

export const LayoutDispatcher: React.FC<CommonLayoutProps> = (props) => {
  const { slide } = props;

  // Chart layouts
  if (["chart-bar", "chart-line", "chart-donut", "chart-waterfall"].includes(slide.layout)) {
    return <ChartsLayout {...props} />;
  }

  // Table layouts
  if (["comparison-table", "feature-matrix", "schedule-table", "delegation-table"].includes(slide.layout)) {
    return <TableLayout {...props} />;
  }

  // Key stats
  if (slide.layout === "key-stats") {
    return <KeyStatsLayout {...props} />;
  }

  // 3-step process
  if (slide.layout === "process-3") {
    return <ProcessLayout {...props} />;
  }

  // Split info (bullets + right image)
  if (slide.layout === "split-info") {
    return <SplitInfoLayout {...props} />;
  }

  // Cards (cards-2, cards-3, general, callout/notes, or default)
  return <CardsLayout {...props} />;
};
