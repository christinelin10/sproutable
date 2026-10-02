export function GardenerSprite({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect x="18" y="8" width="28" height="8" fill="#e7c56a" />
      <rect x="14" y="14" width="36" height="6" fill="#c9842a" />
      <rect x="22" y="20" width="20" height="16" fill="#f0c9a0" />
      <rect x="24" y="26" width="4" height="4" fill="#3d2914" />
      <rect x="36" y="26" width="4" height="4" fill="#3d2914" />
      <rect x="28" y="32" width="8" height="2" fill="#8f3b1c" />
      <rect x="20" y="36" width="24" height="16" fill="#215c45" />
      <rect x="14" y="38" width="8" height="12" fill="#f0c9a0" />
      <rect x="42" y="38" width="8" height="12" fill="#f0c9a0" />
      <rect x="20" y="52" width="8" height="8" fill="#6b3f22" />
      <rect x="36" y="52" width="8" height="8" fill="#6b3f22" />
      <rect x="46" y="30" width="10" height="8" fill="#8f3b1c" />
      <rect x="48" y="26" width="6" height="6" fill="#d84b3a" />
    </svg>
  );
}
