"use client";

import { useState } from "react";
import { Role } from "@pmg/db/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Settings, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { OrganizationWithStats } from "@/server/organizations";
import { switchOrganization } from "@/lib/organization-utils";

interface OrganizationCardProps {
  organization: OrganizationWithStats;
  memberCount?: number;
  isActive?: boolean;
  userRole?: Role;
  className?: string;
}

export function OrganizationCard({
  organization,
  memberCount,
  isActive = false,
  userRole,
  className,
}: OrganizationCardProps) {
  // Use the organization's built-in data if not provided as props
  const actualMemberCount = memberCount ?? organization.memberCount;
  const actualUserRole = userRole ?? organization.userRole;
  const [isSwitching, setIsSwitching] = useState(false);

  const handleOpenDashboard = async () => {
    if (isActive) {
      window.location.href = "/dashboard";
      return;
    }

    setIsSwitching(true);
    const result = await switchOrganization({
      organizationId: organization.id,
      organizationName: organization.name,
      redirectUrl: "/dashboard",
    });

    if (!result.success) {
      setIsSwitching(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 ease-out border",
        "before:absolute before:inset-0 before:bg-linear-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100 before:pointer-events-none",
        isActive
          ? "border-primary/60 bg-primary/[0.03] ring-2 ring-primary/20 ring-offset-1 shadow-md"
          : "hover:border-border/80",
        className,
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 transition-transform duration-300">
              <AvatarImage src={organization.logo || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold transition-colors duration-300 group-hover:bg-primary/20">
                <Link href={`/organization/${organization.slug}`}>
                  {getInitials(organization.name)}
                </Link>
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight truncate">
                <Link href={`/organization/${organization.slug}`}>
                  {organization.name}
                </Link>
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className="text-xs uppercase tracking-wider font-semibold"
                >
                  {actualUserRole}
                </Badge>
                {isActive && (
                  <Badge
                    variant="outline"
                    className="text-xs border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                  >
                    Active Workspace
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="size-4 text-muted-foreground" />
              <span>
                {actualMemberCount} member{actualMemberCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4 text-muted-foreground" />
              <span>Created {formatDate(organization.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              type="button"
              className="flex-1 transition-all duration-200"
              size="sm"
              disabled={isSwitching}
              onClick={handleOpenDashboard}
            >
              {isSwitching ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="size-4 mr-2 transition-transform duration-200 group-hover:translate-x-0.5" />
              )}
              {isActive ? "Current Dashboard" : "Switch Workspace"}
            </Button>
            {(actualUserRole === "owner" || actualUserRole === "admin") && (
              <Button
                asChild
                variant="outline"
                size="sm"
                aria-label="Organization settings"
                className="transition-all duration-200 hover:bg-muted"
              >
                <Link href={`/organization/${organization.slug}`}>
                  <Settings className="size-4 transition-transform duration-200" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
