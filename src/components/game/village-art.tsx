const grass = [
  [4, 6, 7, 3, "#6aaf58"],
  [12, 14, 5, 2, "#8fce73"],
  [70, 8, 6, 2, "#6aaf58"],
  [86, 18, 8, 3, "#8fce73"],
  [8, 78, 6, 2, "#6aaf58"],
  [90, 84, 6, 3, "#6aaf58"],
  [30, 88, 5, 2, "#8fce73"],
  [58, 8, 4, 2, "#8fce73"],
] as const;

const flowers = [
  [8, 22, "#e7a0c4"],
  [14, 70, "#f4e7c5"],
  [33, 18, "#e3b23c"],
  [62, 16, "#e7a0c4"],
  [88, 58, "#c9a0e0"],
  [18, 88, "#e3b23c"],
  [40, 90, "#e7a0c4"],
  [92, 28, "#f4e7c5"],
  [6, 48, "#c9a0e0"],
  [94, 72, "#e3b23c"],
] as const;

export function VillageGround() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true" shapeRendering="crispEdges" preserveAspectRatio="none">
      <rect width="100" height="100" fill="#7dbe6a" />
      {grass.map(([x, y, w, h, fill]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
      {Array.from({ length: 18 }, (_, index) => (
        <rect key={`tuft-${index}`} x={(index * 17) % 94} y={(index * 23) % 92} width="1" height="2" fill="#5c9a4c" opacity="0.7" />
      ))}
      <Path />
      {flowers.map(([x, y, fill]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y + 1} width="1" height="2" fill="#3f8f55" />
          <rect x={x - 0.6} y={y} width="2.2" height="1.4" fill={fill} />
        </g>
      ))}
      <Bush x={9} y={58} />
      <Bush x={88} y={14} />
      <Bush x={36} y={84} />
      <Rock x={12} y={40} />
      <Rock x={90} y={46} />
      <Fence x={4} y={8} />
      <LogPile x={84} y={86} />
    </svg>
  );
}

function Path() {
  const dirt = "#efd39a";
  const edge = "#d4b06a";
  const parts = [
    [42, 14, 10, 28],
    [28, 30, 26, 9],
    [44, 36, 10, 18],
    [50, 44, 28, 9],
    [42, 50, 12, 22],
    [48, 66, 24, 9],
    [40, 72, 12, 18],
  ];
  return (
    <g>
      {parts.map(([x, y, w, h]) => (
        <rect key={`e-${x}-${y}`} x={x - 0.8} y={y - 0.6} width={w + 1.6} height={h + 1.2} fill={edge} />
      ))}
      {parts.map(([x, y, w, h]) => (
        <rect key={`d-${x}-${y}`} x={x} y={y} width={w} height={h} fill={dirt} />
      ))}
    </g>
  );
}

function Bush({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y + 2} width="6" height="3" fill="#3f8f55" />
      <rect x={x + 1} y={y} width="4" height="3" fill="#5aaa62" />
    </g>
  );
}

function Rock({ x, y }: { x: number; y: number }) {
  return <rect x={x} y={y} width="3.2" height="2.2" fill="#d9d3c7" />;
}

function Fence({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y + 1} width="12" height="0.7" fill="#c4a574" />
      <rect x={x} y={y + 2.2} width="12" height="0.7" fill="#c4a574" />
      {[0, 3, 6, 9].map((offset) => (
        <rect key={offset} x={x + offset} y={y} width="0.8" height="4" fill="#8a5a32" />
      ))}
    </g>
  );
}

function LogPile({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width="6" height="1.4" fill="#8a5a32" />
      <rect x={x + 0.6} y={y + 1.5} width="5" height="1.4" fill="#a56b3c" />
    </g>
  );
}

export function PlaceMark({ id, hot }: { id: "community" | "growing" | "map" | "achievements"; hot: boolean }) {
  const ring = hot ? "#e3b23c" : "transparent";
  return (
    <span className="relative block" style={{ filter: hot ? "drop-shadow(0 0 0 #e3b23c)" : undefined }}>
      {id === "community" ? <CommunityHall /> : null}
      {id === "growing" ? <GardenBeds /> : null}
      {id === "map" ? <MapSign /> : null}
      {id === "achievements" ? <GrowthTree /> : null}
      <span className="pointer-events-none absolute -inset-1 rounded-md border-4" style={{ borderColor: ring }} />
    </span>
  );
}

function CommunityHall() {
  return (
    <svg viewBox="0 0 40 34" className="h-28 w-32 sm:h-36 sm:w-40" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="6" y="10" width="28" height="16" fill="#c9842a" />
      <rect x="4" y="12" width="32" height="3" fill="#a56b3c" />
      <rect x="8" y="16" width="24" height="14" fill="#f0d7b0" />
      <rect x="10" y="18" width="8" height="6" fill="#9fd0ea" />
      <rect x="22" y="22" width="6" height="8" fill="#8a5a32" />
      <rect x="2" y="20" width="14" height="12" fill="#6b3f22" />
      <rect x="3" y="21" width="12" height="10" fill="#e7d3a1" />
      <rect x="4" y="22" width="4" height="3" fill="#fffdf8" />
      <rect x="9" y="22" width="5" height="3" fill="#d7eccf" />
      <rect x="4" y="26" width="6" height="4" fill="#f6d0dc" />
      <rect x="5" y="23" width="1" height="1" fill="#d84b3a" />
      <rect x="10" y="23" width="1" height="1" fill="#d84b3a" />
      <rect x="6" y="27" width="1" height="1" fill="#d84b3a" />
    </svg>
  );
}

function GardenBeds() {
  return (
    <svg viewBox="0 0 42 32" className="h-28 w-36 sm:h-32 sm:w-44" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="1" y="14" width="12" height="10" fill="#6b3f22" />
      <rect x="2" y="15" width="10" height="8" fill="#8a5a32" />
      <rect x="4" y="8" width="2" height="8" fill="#2f6b45" />
      <rect x="3" y="6" width="4" height="3" fill="#d84b3a" />
      <rect x="6" y="9" width="3" height="3" fill="#e25b45" />
      <rect x="15" y="16" width="12" height="10" fill="#6b3f22" />
      <rect x="16" y="17" width="10" height="8" fill="#a56b3c" />
      <rect x="18" y="12" width="2" height="6" fill="#3f8f55" />
      <rect x="17" y="14" width="5" height="2" fill="#7dbe6a" />
      <rect x="19" y="10" width="2" height="3" fill="#e07a2f" />
      <rect x="29" y="12" width="12" height="14" fill="#6b3f22" />
      <rect x="30" y="13" width="10" height="12" fill="#8a5a32" />
      <rect x="33" y="6" width="2" height="8" fill="#2f6b45" />
      <rect x="30" y="4" width="8" height="4" fill="#e3b23c" />
      <rect x="32" y="5" width="4" height="2" fill="#8f3b1c" />
      <rect x="31" y="18" width="8" height="4" fill="#3f8f55" />
    </svg>
  );
}

function MapSign() {
  return (
    <svg viewBox="0 0 32 34" className="h-28 w-24 sm:h-32 sm:w-28" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="15" y="12" width="3" height="18" fill="#6b3f22" />
      <rect x="2" y="4" width="22" height="14" fill="#8a5a32" />
      <rect x="3" y="5" width="20" height="12" fill="#f4e7c5" />
      <rect x="5" y="7" width="8" height="6" fill="#7dbe6a" />
      <rect x="12" y="8" width="8" height="5" fill="#8ec8ef" />
      <rect x="8" y="9" width="2" height="2" fill="#d84b3a" />
      <rect x="17" y="7" width="4" height="1" fill="#3d2914" />
      <rect x="20" y="7" width="1" height="4" fill="#3d2914" />
    </svg>
  );
}

function GrowthTree() {
  return (
    <svg viewBox="0 0 36 40" className="h-32 w-28 sm:h-40 sm:w-32" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="16" y="24" width="5" height="14" fill="#6b3f22" />
      <rect x="14" y="28" width="9" height="3" fill="#8a5a32" />
      <rect x="6" y="16" width="24" height="12" fill="#2f6b45" />
      <rect x="8" y="10" width="20" height="10" fill="#3f8f55" />
      <rect x="12" y="4" width="12" height="8" fill="#8fce73" />
      <rect x="4" y="34" width="2" height="4" fill="#3f8f55" />
      <rect x="2" y="32" width="4" height="3" fill="#7dbe6a" />
      <rect x="5" y="33" width="3" height="2" fill="#8fce73" />
    </svg>
  );
}
