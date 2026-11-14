import React from "react";
import { useCollabContext } from "../../context/CollabContext";

interface CollabCursorsOverlayProps {
  currentSlideIndex: number;
}

export const CollabCursorsOverlay: React.FC<CollabCursorsOverlayProps> = ({ currentSlideIndex }) => {
  const { users, myUser } = useCollabContext();

  // Filter users who are active on this specific slide and have recent cursor coordinates
  const activeCursors = users.filter(
    (u) =>
      u.id !== myUser.id &&
      u.cursor &&
      u.cursor.slideIndex === currentSlideIndex &&
      typeof u.cursor.x === "number" &&
      typeof u.cursor.y === "number"
  );

  if (activeCursors.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {activeCursors.map((peer) => {
        const x = peer.cursor!.x;
        const y = peer.cursor!.y;
        const color = peer.color || "#3b82f6";

        return (
          <div
            key={peer.id}
            className="absolute transition-all duration-75 ease-out flex items-start space-x-1.5"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-2px, -2px)",
            }}
          >
            {/* Custom SVG Cursor Arrow */}
            <svg
              className="w-4 h-4 drop-shadow-md"
              viewBox="0 0 24 24"
              fill={color}
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="3 3 10 21 13 13 21 10 3 3" />
            </svg>

            {/* Peer User Name Tag */}
            <div
              className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-lg whitespace-nowrap tracking-tight -mt-1 flex items-center space-x-1"
              style={{ backgroundColor: color }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-ping inline-block" />
              <span>{peer.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
