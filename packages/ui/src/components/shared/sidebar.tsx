"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Logo } from "./logo";
import { useIsMobile } from "../../hooks/use-mobile";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

interface SidebarProps {
  groups: NavGroup[];
  footer?: React.ReactNode;
  className?: string;
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]"
          : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
      )}
    >
      {item.icon && (
        <span className="shrink-0 [&_svg]:h-4 [&_svg]:w-4">{item.icon}</span>
      )}
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && (
        <span className="ml-auto rounded-full bg-[var(--sidebar-primary)] px-2 py-0.5 text-xs text-[var(--sidebar-primary-foreground)]">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function SidebarContent({ groups, footer }: SidebarProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-[var(--sidebar-border)] px-4">
        <Logo />
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {groups.map((group, i) => (
          <div key={i} className="space-y-1">
            {group.title && (
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-foreground)]/50 mb-2">
                {group.title}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer slot */}
      {footer && (
        <div className="border-t border-[var(--sidebar-border)] p-4">
          {footer}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ groups, footer, className }: SidebarProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  if (isMobile) {
    return (
      <>
        {/* Mobile trigger — render this in your nav-bar */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-[var(--sidebar)]">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <SidebarContent groups={groups} footer={footer} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <aside
      className={cn(
        "hidden md:flex w-64 shrink-0 flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)]",
        className
      )}
    >
      <SidebarContent groups={groups} footer={footer} />
    </aside>
  );
}
