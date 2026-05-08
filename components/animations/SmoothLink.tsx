"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { ReactNode } from "react";

export default function SmoothLink({ href, children, className }: { href: string; children: ReactNode; className?: string; }) {
  const router = useRouter();

  const handleTransition = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      router.push(href);
      setTimeout(() => { document.body.style.opacity = '1'; }, 50);
    }, 300);
  };

  return <Link href={href} onClick={handleTransition} className={className}>{children}</Link>;
}