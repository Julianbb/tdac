"use client";

"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Users, Settings, FileText, Menu, X } from "lucide-react";

export function Sidebar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-[60px] items-center justify-between border-b px-4">
        <Link className="flex items-center gap-2 font-semibold" href="/" onClick={onClose}>
          <span className="text-lg font-semibold">TDAC Dashboard</span>
        </Link>
        <button onClick={onClose} className="lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-base font-medium">
          <Link
            className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
            href="/"
            onClick={onClose}
          >
            <Home className="h-4 w-4" />
            首页
          </Link>
          <Link
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            href="#"
            onClick={onClose}
          >
            <Users className="h-4 w-4" />
            旅客管理
          </Link>
          <Link
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            href="#"
            onClick={onClose}
          >
            <FileText className="h-4 w-4" />
            报表
          </Link>
          <Link
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            href="#"
            onClick={onClose}
          >
            <Settings className="h-4 w-4" />
            设置
          </Link>
        </nav>
      </div>
    </div>
  );
}

export function MobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed left-0 top-0 h-full w-64 border-r bg-gray-50 dark:bg-gray-800">
        <Sidebar onClose={onClose} />
      </div>
    </div>
  );
}
