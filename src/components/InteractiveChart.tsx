import React, { useState } from "react";
import { motion } from "motion/react";

interface InteractiveChartProps {
  type: "chart-bar" | "chart-line" | "chart-donut" | "chart-waterfall";
  bullets?: Array<{
    id?: string;
    titleKo?: string;
    titleId?: string;
    descKo?: string;
    descId?: string;
  }>;
  stats?: Array<{
    labelKo?: string;
    labelId?: string;
    value?: string;
    unitKo?: string;
    unitId?: string;
    subKo?: string;
  }>;
  accentColor: string;
  accentSecondary?: string;
  cardBg?: string;
  textColor?: string;
  borderColor?: string;
  language?: "ko" | "id" | "dual";
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  type,
  bullets = [],
  stats = [],
  accentColor,
  accentSecondary = "#10b981",
  cardBg = "#1c1c1e",
  textColor = "#ffffff",
  borderColor = "rgba(255,255,255,0.1)",
  language = "ko",
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Parse chart items from either stats or bullets
  let chartData: Array<{ label: string; value: number; displayVal: string }> = [];

  if (bullets && bullets.length > 0) {
    chartData = bullets.map((b, idx) => {
      const label = (language === "ko" ? b.titleKo || b.titleId : b.titleId || b.titleKo) || (language === "ko" ? `항목 ${idx + 1}` : `Item ${idx + 1}`);
      const rawVal = (language === "ko" ? b.descKo || b.descId : b.descId || b.descKo) || "";
      const match = rawVal.match(/[-+]?[0-9]*\.?[0-9]+/);
      const parsedVal = match ? parseFloat(match[0]) : (idx + 1) * 20;
      return {
        label,
        value: parsedVal,
        displayVal: rawVal || `${parsedVal}%`,
      };
    });
  } else if (stats && stats.length > 0) {
    chartData = stats.map((st, idx) => {
      const label = (language === "ko" ? st.labelKo || st.labelId : st.labelId || st.labelKo) || (language === "ko" ? `지표 ${idx + 1}` : `Metric ${idx + 1}`);
      const rawVal = st.value || "";
      const match = rawVal.match(/[-+]?[0-9]*\.?[0-9]+/);
      const parsedVal = match ? parseFloat(match[0]) : (idx + 1) * 25;
      return {
        label,
        value: parsedVal,
        displayVal: rawVal || `${parsedVal}%`,
      };
    });
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-xs text-neutral-500 font-sans border border-dashed rounded-lg">
        차트 데이터가 없습니다. AI 프롬프트(Cmd+K)에서 원하는 수치와 함께 변환을 요청해 보세요.
      </div>
    );
  }

  const values = chartData.map((d) => d.value);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const valueRange = maxVal - minVal;

  // Render Bar Chart
  if (type === "chart-bar") {
    return (
      <div className="w-full h-full flex flex-col justify-between font-sans">
        {/* Y-axis & Bars grid */}
        <div className="relative flex-1 flex items-end justify-between gap-3 sm:gap-6 pt-6 pb-2 border-b border-white/10 px-2 sm:px-6">
          {/* Subtle horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="w-full border-t border-dashed border-white/40" />
            <div className="w-full border-t border-dashed border-white/40" />
            <div className="w-full border-t border-dashed border-white/40" />
          </div>

          {chartData.map((item, idx) => {
            const heightPercent = Math.max(5, Math.min(100, (item.value / maxVal) * 100));
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className="relative flex-1 flex flex-col items-center group cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Floating Tooltip */}
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? -4 : 4 }}
                  className="absolute top-0 -translate-y-full bg-[#18181b] border border-white/15 px-2 py-1 rounded text-[10px] font-mono font-bold z-20 shadow-lg pointer-events-none whitespace-nowrap"
                  style={{ color: accentColor }}
                >
                  {item.displayVal}
                </motion.div>

                {/* Animated Column Bar */}
                <div className="w-full max-w-[32px] sm:max-w-[48px] h-32 sm:h-36 flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ type: "spring", stiffness: 80, delay: idx * 0.05 }}
                    className="w-full rounded-t-md relative overflow-hidden"
                    style={{
                      background: isHovered
                        ? `linear-gradient(to top, ${accentColor}dd, ${accentColor})`
                        : `linear-gradient(to top, ${accentColor}88, ${accentColor}cc)`,
                      boxShadow: isHovered ? `0 0 16px ${accentColor}40` : "none",
                    }}
                  >
                    {/* Gloss sheen overlay */}
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10" />
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Labels bar */}
        <div className="flex justify-between gap-3 sm:gap-6 mt-2 px-2 sm:px-6">
          {chartData.map((item, idx) => (
            <div key={idx} className="flex-1 text-center min-w-0">
              <div
                className="text-[10px] font-semibold truncate leading-tight transition-colors duration-150"
                style={{ color: hoveredIdx === idx ? "#ffffff" : "rgba(255,255,255,0.6)" }}
              >
                {item.label}
              </div>
              <div className="text-[9px] font-mono opacity-40 mt-0.5">{item.displayVal}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Line Chart
  if (type === "chart-line") {
    const width = 500;
    const height = 140;
    const padding = 24;

    const points = chartData.map((item, idx) => {
      const x = padding + (idx / (chartData.length - 1 || 1)) * (width - padding * 2);
      const y = height - padding - ((item.value - minVal) / (valueRange || 1)) * (height - padding * 2);
      return { x, y, label: item.label, value: item.value, display: item.displayVal };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPath = points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : "";

    return (
      <div className="w-full h-full flex flex-col font-sans">
        <div className="relative flex-1">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke={borderColor} strokeDasharray="3,3" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke={borderColor} strokeDasharray="3,3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={borderColor} />

            {/* Shaded Area under spline */}
            {areaPath && (
              <motion.path
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                d={areaPath}
                fill="url(#area-gradient)"
              />
            )}

            {/* Glowing Line */}
            {linePath && (
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                d={linePath}
                fill="none"
                stroke={accentColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Points */}
            {points.map((p, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <g
                  key={idx}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? "7" : "4.5"}
                    fill={isHovered ? "#ffffff" : accentColor}
                    stroke={accentColor}
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                  {isHovered && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="14"
                      fill={accentColor}
                      fillOpacity="0.15"
                      className="animate-ping"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip in Canvas Space */}
          {hoveredIdx !== null && points[hoveredIdx] && (
            <div
              className="absolute bg-[#18181b] border border-white/10 rounded px-2.5 py-1 text-[10px] font-mono shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-12 z-30"
              style={{
                left: `${(points[hoveredIdx].x / width) * 100}%`,
                top: `${(points[hoveredIdx].y / height) * 100}%`,
              }}
            >
              <div className="font-bold text-neutral-300 mb-0.5">{points[hoveredIdx].label}</div>
              <div className="font-semibold" style={{ color: accentColor }}>
                Value: {points[hoveredIdx].display}
              </div>
            </div>
          )}
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-2 px-1 text-[10px] font-semibold text-neutral-400">
          {chartData.map((item, idx) => (
            <div
              key={idx}
              className="text-center transition-colors duration-150"
              style={{
                color: hoveredIdx === idx ? "#ffffff" : "rgba(255,255,255,0.4)",
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Donut Chart
  if (type === "chart-donut") {
    const total = values.reduce((sum, v) => sum + Math.abs(v), 0) || 1;
    let cumulativePercent = 0;

    const colors = [
      accentColor,
      accentSecondary,
      "#3b82f6",
      "#f59e0b",
      "#ec4899",
      "#8b5cf6",
      "#14b8a6",
    ];

    const radius = 50;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className="w-full h-full flex flex-col sm:flex-row items-center justify-around gap-6 font-sans">
        {/* Circle SVG */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 120 120">
            {chartData.map((item, idx) => {
              const currentPercent = Math.abs(item.value) / total;
              const strokeLength = currentPercent * circumference;
              const strokeOffset = circumference - (cumulativePercent * circumference);
              cumulativePercent += currentPercent;

              const isHovered = hoveredIdx === idx;
              const color = colors[idx % colors.length];

              return (
                <motion.circle
                  key={idx}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke={color}
                  strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 6px ${color}60)` : "none",
                  }}
                />
              );
            })}
          </svg>

          {/* Central Label inside the donut hole */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
            {hoveredIdx !== null ? (
              <>
                <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider truncate max-w-[80px]">
                  {chartData[hoveredIdx].label}
                </span>
                <span className="text-sm font-extrabold font-mono leading-none mt-1" style={{ color: colors[hoveredIdx % colors.length] }}>
                  {chartData[hoveredIdx].displayVal}
                </span>
                <span className="text-[8px] font-mono text-neutral-500 mt-0.5">
                  {Math.round((Math.abs(chartData[hoveredIdx].value) / total) * 100)}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[9px] text-neutral-400 font-semibold uppercase tracking-wider">
                  합계 (TOTAL)
                </span>
                <span className="text-sm font-black mt-0.5" style={{ color: accentColor }}>
                  {total.toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend Panel */}
        <div className="flex-1 space-y-1.5 w-full max-w-[180px] sm:max-w-none">
          {chartData.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            const color = colors[idx % colors.length];
            const pct = Math.round((Math.abs(item.value) / total) * 100);

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-1.5 rounded-lg transition-all cursor-pointer text-[10px] sm:text-xs"
                style={{
                  backgroundColor: isHovered ? "rgba(255,255,255,0.04)" : "transparent",
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className={`truncate font-semibold ${isHovered ? "text-white" : "text-neutral-300"}`}>
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center space-x-2 pl-2 shrink-0 font-mono">
                  <span className="text-neutral-400 font-bold">{item.displayVal}</span>
                  <span className="text-neutral-500 text-[9px] sm:text-[10px]">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render Waterfall Chart
  if (type === "chart-waterfall") {
    let cumulative = 0;
    const waterfallData = chartData.map((item, idx) => {
      const start = cumulative;
      const end = cumulative + item.value;
      cumulative = end;
      return {
        ...item,
        start,
        end,
        isIncrease: item.value >= 0,
      };
    });

    // Create a final "Total" node if there are multiple nodes
    const finalTotal = cumulative;
    const renderData = [...waterfallData];
    if (renderData.length > 1) {
      renderData.push({
        label: "총합계 (Total)",
        value: finalTotal,
        displayVal: finalTotal.toLocaleString(),
        start: 0,
        end: finalTotal,
        isIncrease: finalTotal >= 0,
      });
    }

    const maxCumVal = Math.max(...renderData.map(d => Math.max(d.start, d.end)), 1);
    const minCumVal = Math.min(...renderData.map(d => Math.min(d.start, d.end)), 0);
    const scaleRange = maxCumVal - minCumVal;

    return (
      <div className="w-full h-full flex flex-col justify-between font-sans">
        <div className="relative flex-1 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 border-b border-white/10 px-2 sm:px-6">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="w-full border-t border-dashed border-white/40" />
            <div className="w-full border-t border-dashed border-white/40" />
            <div className="w-full border-t border-dashed border-white/40" />
          </div>

          {renderData.map((item, idx) => {
            const isTotal = idx === renderData.length - 1 && renderData.length > chartData.length;
            const bottomPercent = ((Math.min(item.start, item.end) - minCumVal) / scaleRange) * 100;
            const heightPercent = Math.max(5, (Math.abs(item.value) / scaleRange) * 100);
            const isHovered = hoveredIdx === idx;

            let color = accentColor; // Default
            if (isTotal) {
              color = "#3b82f6"; // Blue total
            } else if (item.value >= 0) {
              color = "#10b981"; // Green increase
            } else {
              color = "#ef4444"; // Red decrease
            }

            return (
              <div
                key={idx}
                className="relative flex-1 flex flex-col items-center group cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Floating Tooltip */}
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? -4 : 4 }}
                  className="absolute top-0 -translate-y-full bg-[#18181b] border border-white/15 px-2 py-1 rounded text-[10px] font-mono font-bold z-20 shadow-lg pointer-events-none whitespace-nowrap"
                  style={{ color }}
                >
                  {item.value >= 0 && !isTotal ? `+${item.displayVal}` : item.displayVal}
                </motion.div>

                {/* Bar drawing with offset bottom */}
                <div className="w-full max-w-[28px] sm:max-w-[40px] h-32 sm:h-36 relative">
                  <motion.div
                    initial={{ height: 0, bottom: 0 }}
                    animate={{
                      height: `${heightPercent}%`,
                      bottom: `${bottomPercent}%`,
                    }}
                    transition={{ type: "spring", stiffness: 85, delay: idx * 0.05 }}
                    className="absolute w-full rounded-[3px] overflow-hidden shadow-sm"
                    style={{
                      backgroundColor: isHovered ? `${color}dd` : `${color}aa`,
                      border: `1.5px solid ${color}`,
                      boxShadow: isHovered ? `0 0 12px ${color}30` : "none",
                    }}
                  >
                    <div className="w-full h-1/2 bg-white/5" />
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Labels bar */}
        <div className="flex justify-between gap-2 sm:gap-4 mt-2 px-2 sm:px-6">
          {renderData.map((item, idx) => {
            const isTotal = idx === renderData.length - 1 && renderData.length > chartData.length;
            return (
              <div key={idx} className="flex-1 text-center min-w-0">
                <div
                  className={`text-[9px] sm:text-[10px] truncate leading-tight font-bold transition-colors duration-150 ${
                    isTotal ? "text-blue-300" : "text-neutral-300"
                  }`}
                  style={{ color: hoveredIdx === idx ? "#ffffff" : undefined }}
                >
                  {item.label.split(" (")[0]}
                </div>
                <div className="text-[8px] font-mono opacity-45 mt-0.5">{item.displayVal}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};
