"use client";

import { ReactNode, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MobileFilterDrawer,
  MobileFilterField,
} from "@/components/ui/mobile-filter-drawer";
import { X, Search, RotateCcw, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterTabOption {
  id: string;
  label: string;
  count?: number;
}

export interface FacetedSelectOption {
  value: string;
  label: string;
}

export interface FacetedFilterConfig {
  id: string;
  placeholder: string;
  icon?: LucideIcon;
  options: FacetedSelectOption[];
  value: string;
  onChange: (val: string) => void;
  width?: string;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface ActiveFilterChip {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

export interface DataTableToolbarProps {
  /** Segmented quick filter tabs */
  tabs?: FilterTabOption[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;

  /** Search input */
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;

  /** Faceted dropdown filters (e.g. Clients, Status, Categories) */
  facetedFilters?: FacetedFilterConfig[];

  /** Consolidated sort control */
  sortOptions?: SortOption[];
  activeSort?: string;
  onSortChange?: (sortVal: string) => void;
  sortIcon?: LucideIcon;

  /** Active filters list for dismissible chips */
  activeFilters?: ActiveFilterChip[];
  onClearAllFilters?: () => void;

  /** Mobile filter drawer title */
  mobileDrawerTitle?: string;

  /** Extra trailing action buttons / elements */
  actions?: ReactNode;

  className?: string;
}

/**
 * DataTableToolbar — Compact, high-performance, accessible filter & control toolbar.
 * Standardizes search (⌘K shortcut), segmented status tabs, consolidated sorting,
 * client/entity selectors, and active chip tags across list pages.
 */
export function DataTableToolbar({
  tabs,
  activeTab,
  onTabChange,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search records...",
  facetedFilters = [],
  sortOptions = [],
  activeSort,
  onSortChange,
  sortIcon: SortIcon,
  activeFilters = [],
  onClearAllFilters,
  mobileDrawerTitle = "Filter Records",
  actions,
  className,
}: DataTableToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasActiveFilters = activeFilters.length > 0;

  // Keyboard shortcut (Cmd+K / Ctrl+K) to focus search
  useEffect(() => {
    if (!onSearchChange) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSearchChange]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Level 1: Segmented Tabs (if provided) */}
      {tabs && tabs.length > 0 && onTabChange && (
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          <nav
            className="inline-flex items-center gap-1 p-1 bg-muted/40 border border-border/50 rounded-lg text-xs shrink-0"
            aria-label="Filter Tabs"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-md font-medium transition-all duration-150 text-xs whitespace-nowrap cursor-pointer flex items-center gap-1.5",
                    isActive
                      ? "bg-background text-foreground shadow-xs font-semibold border border-border/70 dark:border-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium",
                        isActive
                          ? "bg-muted text-foreground"
                          : "bg-muted/60 text-muted-foreground",
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {actions && (
            <div className="hidden sm:flex items-center gap-2">{actions}</div>
          )}
        </div>
      )}

      {/* Level 2: Compact Search & Control Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
            <Input
              ref={searchInputRef}
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 pl-8 pr-14 text-xs bg-muted/20 border-border/60 hover:border-border focus:bg-background transition-colors"
            />
            {searchValue ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-sm transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none h-4.5 select-none rounded border border-border/60 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            )}
          </div>
        )}

        {/* Desktop Filters */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {facetedFilters.map((f) => {
            const FilterIcon = f.icon;
            return (
              <Select key={f.id} value={f.value} onValueChange={f.onChange}>
                <SelectTrigger
                  className={cn(
                    "h-9 text-xs bg-muted/20 border-border/60 hover:border-border",
                    f.width || "w-[180px]",
                  )}
                >
                  {FilterIcon && (
                    <FilterIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                  )}
                  <SelectValue placeholder={f.placeholder} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {f.options.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })}

          {/* Consolidated Sort */}
          {sortOptions.length > 0 && onSortChange && (
            <Select value={activeSort} onValueChange={onSortChange}>
              <SelectTrigger className="h-9 w-[210px] text-xs bg-muted/20 border-border/60 hover:border-border">
                {SortIcon && (
                  <SortIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                )}
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-xs"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Reset button */}
          {hasActiveFilters && onClearAllFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAllFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
          )}
        </div>

        {/* Mobile Filter Drawer */}
        {(facetedFilters.length > 0 || sortOptions.length > 0) && (
          <div className="sm:hidden">
            <MobileFilterDrawer
              activeFilterCount={activeFilters.length}
              title={mobileDrawerTitle}
              onApply={() => {}}
              onClear={onClearAllFilters || (() => {})}
            >
              {facetedFilters.map((f) => (
                <MobileFilterField key={f.id} label={f.placeholder}>
                  <Select value={f.value} onValueChange={f.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={f.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MobileFilterField>
              ))}

              {sortOptions.length > 0 && onSortChange && (
                <MobileFilterField label="Sort order">
                  <Select value={activeSort} onValueChange={onSortChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sort order" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MobileFilterField>
              )}
            </MobileFilterDrawer>
          </div>
        )}
      </div>

      {/* Level 3: Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">
            Filtered by:
          </span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="h-6 px-2 py-0 text-[11px] font-normal bg-muted/60 hover:bg-muted text-foreground border border-border/50 flex items-center gap-1.5 rounded-md"
            >
              <span className="font-semibold text-muted-foreground">
                {filter.label}:
              </span>
              <span className="truncate max-w-[140px]">{filter.value}</span>
              <button
                type="button"
                className="hover:text-destructive focus:outline-none cursor-pointer rounded-full p-0.5"
                onClick={filter.onRemove}
                aria-label={`Remove ${filter.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {onClearAllFilters && (
            <button
              type="button"
              onClick={onClearAllFilters}
              className="text-[11px] text-muted-foreground hover:text-foreground underline ml-1 cursor-pointer transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
