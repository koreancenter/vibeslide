import React from "react";
import { CommonLayoutProps } from "./layoutTypes";

export const TableLayout: React.FC<CommonLayoutProps> = ({
  slide,
  theme,
  getText,
}) => {
  // 1. Explicit Custom Table
  if (slide.customTable && slide.customTable.headers?.length > 0) {
    return (
      <div className="w-full overflow-hidden flex flex-col justify-center" data-collision-zone="static">
        <div
          className="w-full overflow-x-auto rounded-xl border max-h-[240px] shadow-sm"
          style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
        >
          <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
            <thead>
              <tr className="border-b" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: theme.borderColor }}>
                {slide.customTable.headers.map((h, hIdx) => (
                  <th key={hIdx} className="p-2.5 font-bold tracking-wide" style={{ color: theme.textColor }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {slide.customTable.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.03] transition">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="p-2.5 opacity-90"
                      style={{ color: cIdx === 0 ? theme.accentColor : theme.textColor }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 2. Delegates Table (Politeknik Negeri Delegation)
  if (Array.isArray(slide.delegates) && slide.delegates.length > 0) {
    return (
      <div className="w-full overflow-hidden flex flex-col justify-center" data-collision-zone="static">
        <div
          className="w-full overflow-x-auto rounded-xl border max-h-[240px] shadow-sm"
          style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
        >
          <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
            <thead>
              <tr className="border-b" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: theme.borderColor }}>
                <th className="p-2.5 font-bold w-12 text-center" style={{ color: theme.textColor }}>No</th>
                <th className="p-2.5 font-bold" style={{ color: theme.textColor }}>대학명 (Politeknik Negeri)</th>
                <th className="p-2.5 font-bold w-20 text-center" style={{ color: theme.textColor }}>인원</th>
                <th className="p-2.5 font-bold" style={{ color: theme.textColor }}>참석자 성명 (Nama)</th>
                <th className="p-2.5 font-bold" style={{ color: theme.textColor }}>직책 (Jabatan)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {slide.delegates.map((del, dIdx) => (
                <tr key={dIdx} className="hover:bg-white/[0.03] transition">
                  <td className="p-2 text-center font-mono font-bold opacity-70" style={{ color: theme.accentColor }}>
                    {del.no || dIdx + 1}
                  </td>
                  <td className="p-2 font-semibold" style={{ color: theme.textColor }}>
                    {getText(del.universityKo, del.universityId)}
                  </td>
                  <td className="p-2 text-center opacity-80" style={{ color: theme.textColor }}>
                    {getText(del.countKo, del.countId)}
                  </td>
                  <td className="p-2 whitespace-pre-line opacity-90" style={{ color: theme.textColor }}>
                    {getText(del.namesKo, del.namesId)}
                  </td>
                  <td className="p-2 whitespace-pre-line opacity-80 text-[10px] sm:text-[11px]" style={{ color: theme.textColor }}>
                    {getText(del.rolesKo, del.rolesId)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 3. Schedule / Itinerary Table
  if (Array.isArray(slide.schedule) && slide.schedule.length > 0) {
    return (
      <div className="w-full overflow-hidden flex flex-col justify-center" data-collision-zone="static">
        <div
          className="w-full overflow-x-auto rounded-xl border max-h-[240px] shadow-sm"
          style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
        >
          <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
            <thead>
              <tr className="border-b" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: theme.borderColor }}>
                <th className="p-2.5 font-bold w-24" style={{ color: theme.textColor }}>일자</th>
                <th className="p-2.5 font-bold w-20" style={{ color: theme.textColor }}>시간</th>
                <th className="p-2.5 font-bold" style={{ color: theme.textColor }}>주요 일정 (Agenda)</th>
                <th className="p-2.5 font-bold" style={{ color: theme.textColor }}>세부 내용 및 장소</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {slide.schedule.map((ev, eIdx) => (
                <tr key={eIdx} className="hover:bg-white/[0.03] transition">
                  <td className="p-2 font-mono font-bold" style={{ color: theme.accentColor }}>
                    {ev.date}
                  </td>
                  <td className="p-2 font-mono opacity-80" style={{ color: theme.textColor }}>
                    {ev.time}
                  </td>
                  <td className="p-2 font-semibold" style={{ color: theme.textColor }}>
                    {getText(ev.titleKo, ev.titleId)}
                  </td>
                  <td className="p-2 opacity-85" style={{ color: theme.textColor }}>
                    <div>{getText(ev.detailKo, ev.detailId)}</div>
                    {ev.locationKo && (
                      <div className="text-[10px] opacity-60 mt-0.5 font-sans">
                        📍 {getText(ev.locationKo, ev.locationId)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Fallback: If bullets exist, show structured comparison table
  if (Array.isArray(slide.bullets) && slide.bullets.length > 0) {
    return (
      <div className="w-full overflow-hidden flex flex-col justify-center" data-collision-zone="static">
        <div
          className="w-full overflow-x-auto rounded-xl border max-h-[240px] shadow-sm"
          style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
        >
          <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
            <thead>
              <tr className="border-b" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: theme.borderColor }}>
                <th className="p-2.5 font-bold w-12 text-center" style={{ color: theme.textColor }}>No</th>
                <th className="p-2.5 font-bold w-1/3" style={{ color: theme.textColor }}>핵심 과제 (Topic)</th>
                <th className="p-2.5 font-bold" style={{ color: theme.textColor }}>상세 실행 방안 (Implementation)</th>
                <th className="p-2.5 font-bold w-24 text-center" style={{ color: theme.textColor }}>태그</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {slide.bullets.map((b, bIdx) => (
                <tr key={bIdx} className="hover:bg-white/[0.03] transition">
                  <td className="p-2 text-center font-mono font-bold opacity-70" style={{ color: theme.accentColor }}>
                    {bIdx + 1}
                  </td>
                  <td className="p-2 font-semibold" style={{ color: theme.textColor }}>
                    {getText(b.titleKo, b.titleId)}
                  </td>
                  <td className="p-2 opacity-85" style={{ color: theme.textColor }}>
                    {getText(b.descKo, b.descId)}
                  </td>
                  <td className="p-2 text-center">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-mono"
                      style={{ backgroundColor: "rgba(255,255,255,0.08)", color: theme.accentColor }}
                    >
                      {b.tagKo || "KIND 2026"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-6 rounded-xl border border-dashed text-center text-xs opacity-60"
      style={{ borderColor: theme.borderColor }}
    >
      표 데이터가 비어 있습니다. AI 프롬프트(Cmd+K)에서 "비교표로 변환해줘"를 입력하시면 자동으로 표가 구성됩니다.
    </div>
  );
};
