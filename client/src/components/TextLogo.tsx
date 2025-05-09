"use client";
import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function TextLogo({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const { isAuthenticated } = useAuth();
  const targetHref = isAuthenticated ? '/admin/dashboard' : '/';

  return (
    <Link href={targetHref} passHref>
      <span
        className={`font-extrabold tracking-tight select-none cursor-pointer ${
          size === 'lg'
            ? 'text-3xl sm:text-4xl text-neutral-900 dark:text-neutral-100'
            : 'text-xl text-neutral-900 dark:text-neutral-100'
        }`}
        style={{ letterSpacing: '-0.04em', fontFamily: 'SF Pro Display, Inter, Arial, sans-serif' }}
      >
        Script <span className="text-[#0582FF]">Guardian</span>
      </span>
    </Link>
  );
} 