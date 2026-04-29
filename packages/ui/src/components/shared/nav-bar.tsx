"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { type NavGroup } from "./sidebar";

interface UserMenuProps {
  name: string;
  email: string;
  image?: string;
  onSignOut?: () => void;
  extraItems?: React.ReactNode;
}

function UserMenu({ name, email, image, onSignOut, extraItems }: UserMenuProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="User menu">
          <Avatar className="h-9 w-9">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-[var(--muted-foreground)]">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {extraItems}
        {onSignOut && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="text-[var(--destructive)]">
              Sign out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NavBarProps {
  /** Nav groups — shown in mobile Sheet drawer */
  groups?: NavGroup[];
  /** Authenticated user — shows avatar + dropdown when provided */
  user?: UserMenuProps;
  /** Extra items in the right side of the bar */
  actions?: React.ReactNode;
  /** Full logo src (with text) */
  logoSrc?: string;
  /** Icon-only logo src */
  logoIconSrc?: string;
  className?: string;
}

export function NavBar({ groups, user, actions, logoSrc, logoIconSrc, className }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-[var(--border)] bg-[var(--background)] px-4 md:px-6",
        className
      )}
    >
      {/* Mobile menu trigger */}
      {groups && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-64 p-0 bg-[var(--sidebar)]">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex h-full flex-col">
                <div className="flex h-14 items-center border-b border-[var(--sidebar-border)] px-4">
                  <Logo />
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                  {groups.flatMap((g) => g.items).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]"
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}

      {/* Logo */}
      <Link href="/" className="hidden md:flex">
        <Logo src={logoSrc} iconSrc={logoIconSrc} showText={!!logoSrc} />
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {actions}
        <ThemeToggle />
        {user && <UserMenu {...user} />}
      </div>
    </header>
  );
}
