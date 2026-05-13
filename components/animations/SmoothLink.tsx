"use client";

import Link from "next/link";
import type { LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type SmoothLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    className?: string;
  };

export default function SmoothLink({
  href,
  children,
  className,
  onClick,
  ...props
}: SmoothLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </Link>
  );
}