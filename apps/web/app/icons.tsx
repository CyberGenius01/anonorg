import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function OrgIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 21V7a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v14" />
      <path d="M15 21V11a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v10" />
      <path d="M7.5 9h.01M7.5 12h.01M7.5 15h.01M18 14h.01M18 17h.01" />
    </svg>
  );
}

export function ChainIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="8.5" width="7" height="7" rx="2.2" />
      <rect x="14.5" y="8.5" width="7" height="7" rx="2.2" />
      <path d="M9.5 12h5" />
    </svg>
  );
}

export function PrivacyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6l7-3z" />
      <path d="M9.5 12l1.8 1.8L14.5 10" />
    </svg>
  );
}

export function CollabIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="9" r="3" />
      <circle cx="17" cy="9" r="3" />
      <path d="M3.5 20c0-3 2-5.2 4.5-5.2S12.5 17 12.5 20" />
      <path d="M12.5 20c0-3 2-5.2 4.5-5.2S21.5 17 21.5 20" />
    </svg>
  );
}

export function GovernanceIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l8 4-8 4-8-4 8-4z" />
      <path d="M4 11v6c0 1.3 3.6 3 8 3s8-1.7 8-3v-6" />
      <path d="M4 7v3M20 7v3" />
    </svg>
  );
}

export function AuditIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M8.5 13.5h7M8.5 17h5" />
    </svg>
  );
}

export function LogoMarkIcon(props: IconProps) {
  return (
    <svg {...base} stroke="white" {...props}>
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  );
}
