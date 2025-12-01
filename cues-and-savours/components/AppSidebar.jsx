"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Table as TableIcon,
  Gamepad2,
  UserPlus,
  LogOut,
  ChevronDown,
  Clock,
  Package,
  BarChart3,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import useAuthStore from "@/lib/store/useAuthStore";
import { useState } from "react";
import Image from "next/image";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["Owner", "Management", "Closer"],
  },
  {
    name: "Tables",
    href: "/tables",
    icon: TableIcon,
    roles: ["Owner", "Management", "Admin", "Closer"],
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
    roles: ["Owner", "Management", "Admin", "Closer"],
  },
  {
    name: "Game Types",
    href: "/gametypes",
    icon: Gamepad2,
    roles: ["Owner", "Management"],
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Package,
    roles: ["Owner", "Management"],
  },
  {
    name: "Sales Data",
    href: "/sales-data",
    icon: BarChart3,
    roles: ["Owner", "Management", "Closer"],
  },
  {
    name: "Expenses",
    href: "/expenses",
    icon: Receipt,
    roles: ["Owner", "Management", "Admin"],
  },
  {
    name: "Staff Management",
    href: "/staff",
    icon: UserPlus,
    roles: ["Owner", "Management"],
    subItems: [
      {
        name: "Add Staff",
        href: "/staff/add",
      },
    ],
  },
  {
    name: "Shift Management",
    href: "/shifts",
    icon: Clock,
    roles: ["Owner", "Management", "Closer"],
  },
];

function AppSidebarContent() {
  const pathname = usePathname();
  const { user, logout, endShift, activeShift, shiftLoading } = useAuthStore();
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleExpanded = (itemName) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter((item) => {
    if (item.roles) {
      return item.roles.includes(user?.accountType);
    }
    return true;
  });

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex h-32 items-center px-4">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Cues & Savours Logo"
              width={150}
              height={50}
            />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* User Info */}
        <SidebarGroup>
          <div className="flex items-center gap-3 px-2 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white">
              <span className="text-sm font-semibold">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">
                {user?.username || "User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.accountType || "Staff"}
              </p>
            </div>
          </div>
        </SidebarGroup>

        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isExpanded = expandedItems.has(item.name);

                return (
                  <SidebarMenuItem key={item.name}>
                    {hasSubItems ? (
                      <>
                        <SidebarMenuButton
                          onClick={() => toggleExpanded(item.name)}
                          className="w-full"
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.name}</span>
                          <ChevronDown
                            className={cn(
                              "ml-auto h-4 w-4 transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </SidebarMenuButton>
                        {isExpanded && (
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={isActive}>
                                <Link href={item.href}>{item.name}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            {item.subItems.map((subItem) => {
                              const subIsActive = pathname === subItem.href;
                              return (
                                <SidebarMenuSubItem key={subItem.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={subIsActive}
                                  >
                                    <Link href={subItem.href}>
                                      {subItem.name}
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        )}
                      </>
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <item.icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          {/* End Shift Button - Only for Admins with active shift */}
          {user?.accountType === "Admin" && activeShift && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={async () => {
                  const result = await endShift();
                  if (result.success) {
                    logout();
                  }
                }}
                disabled={shiftLoading}
                className="text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              >
                <Clock className="h-5 w-5" />
                <span>{shiftLoading ? "Ending..." : "End Shift & Logout"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* Logout Button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}

export function AppSidebar() {
  return (
    <Sidebar>
      <AppSidebarContent />
    </Sidebar>
  );
}
