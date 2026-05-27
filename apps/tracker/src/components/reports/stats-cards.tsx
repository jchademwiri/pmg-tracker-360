'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Briefcase, TrendingUp, Banknote } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface ReportStatsProps {
  stats: {
    totalTenders: number;
    wonTenders: number;
    lostTenders: number;
    pendingTenders: number;
    activeProjects: number;
    winRate: number;
    pipelineValue: number;
    totalWonValue: number;
    poRevenue: number;
  };
}

export function ReportStatsCards({ stats }: ReportStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* 1. Win Rate Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          <Trophy className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.winRate}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.wonTenders} won / {stats.lostTenders} lost
          </p>
        </CardContent>
      </Card>

      {/* 2. PO Revenue (Guaranteed) - New Card */}
      <Card className="bg-emerald-500/10 border-emerald-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue Secured</CardTitle>
          <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.poRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">
            Guaranteed revenue (POs)
          </p>
        </CardContent>
      </Card>

      {/* 3. Total Won Value (Booked) - Was Revenue Secured */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Booked Contracts
          </CardTitle>
          <Briefcase className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.totalWonValue)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total value of won tenders
          </p>
        </CardContent>
      </Card>

      {/* 4. Pipeline Value Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
          <Target className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.pipelineValue)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.pendingTenders} pending decision
          </p>
        </CardContent>
      </Card>

      {/* 5. Active Projects Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <TrendingUp className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeProjects}</div>
          <p className="text-xs text-muted-foreground">Currently in progress</p>
        </CardContent>
      </Card>
    </div>
  );
}
