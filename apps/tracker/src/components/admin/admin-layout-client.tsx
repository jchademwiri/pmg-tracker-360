'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/sidebar/admin-sidebar';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: any;
}

function getBreadcrumbs(pathname: string) {
  // Remove trailing slash and split
  const paths = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  // We assume /admin is the root
  // If paths = ['admin'], breadcrumb = Admin Portal > Dashboard
  // If paths = ['admin', 'users'], breadcrumb = Admin Portal > Users

  if (paths.length <= 1) {
    return (
      <>
        <BreadcrumbItem>
          <BreadcrumbPage>Dashboard</BreadcrumbPage>
        </BreadcrumbItem>
      </>
    );
  }

  return paths.slice(1).map((path, index, arr) => {
    const isLast = index === arr.length - 1;
    const title = path.charAt(0).toUpperCase() + path.slice(1);
    const href = `/admin/${arr.slice(0, index + 1).join('/')}`;

    return (
      <React.Fragment key={path}>
        <BreadcrumbItem>
          {isLast ? (
            <BreadcrumbPage>{title}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink href={href}>{title}</BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {!isLast && <BreadcrumbSeparator />}
      </React.Fragment>
    );
  });
}

export default function AdminLayoutClient({
  children,
  user,
}: AdminLayoutClientProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <AdminSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/admin">Admin Portal</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                {getBreadcrumbs(pathname)}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
