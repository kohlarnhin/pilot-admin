import { t, useT } from '@/i18n';
import React from "react";
import { Link } from "react-router";
import { appConfig } from '@/config/app';
import { cn } from "@/utils";

interface Props {
  size?: number;
  className?: string;
  disableLink?: boolean;
}

/** 领航标识：可在此替换产品标识，并同步 public/favicon.svg。 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="15" fill="#111827" />
      <path d="M17 45 30 15l17 30-16-8-14 8Z" fill="#FDA92D" />
      <path d="m30 15 1 22 16 8-17-30Z" fill="#FED680" />
    </svg>
  );
}

export function Logo({ size = 32, className, disableLink = false }: Props) {
  useT();
  const mark = <LogoMark size={size} />;
  if (disableLink) {
    return <span className={cn("inline-flex items-center", className)}>{mark}</span>;
  }
  return (
    <Link to="/dashboard" className={cn("inline-flex items-center", className)} aria-label={t('layout.logoHome', { name: appConfig.name })}>
      {mark}
    </Link>
  );
}

export default Logo;
