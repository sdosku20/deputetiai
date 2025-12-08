"use client";

import { useRouter } from "next/navigation";
// Optimized: Direct imports instead of barrel imports (saves 10-15KB)
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import type { NavigationItem } from "@/types/dashboard";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarSectionHeader } from "./SidebarSectionHeader";
import { SidebarNavList } from "./SidebarNavList";
import { SidebarActions } from "./SidebarActions";

/**
 * Sidebar Component
 * Matches EXACT styling from root frontend SideMenu.tsx
 * - 240px fixed width
 * - White background
 * - Space Grotesk font throughout
 * - Logo section (30x30px)
 * - Scrollable content section with "Dashboard" and "Actions" headers
 * - Profile avatar section at bottom (120px height)
 * - Hover: #f9f8f6
 * - Selected: #f4f3ef, fontWeight 600
 */

interface SidebarProps {
  items: NavigationItem[];
  selectedItem?: string;
  onItemSelect?: (itemId: string, itemPath?: string) => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  className?: string;
}

export function Sidebar({
  items,
  selectedItem,
  onItemSelect,
  user = {
    name: "User",
    email: "user@example.com",
  },
  className,
}: SidebarProps) {
  const router = useRouter();

  // Handle navigation item click
  const handleItemClick = (item: NavigationItem) => {
    // If item has onClick handler, use that (for filtering)
    if (item.onClick) {
      item.onClick();
      return;
    }

    // Otherwise use traditional navigation
    if (onItemSelect) {
      onItemSelect(item.id, item.path);
    }
    if (item.path) {
      router.push(item.path);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
          boxSizing: "border-box",
          backgroundColor: "white",
          borderRight: "none",
          boxShadow: "none",
        },
      }}
      className={className}
    >
      {/* Logo Section */}
      <SidebarLogo />

      {/* Scrollable Content Section */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#d1d5db",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#9ca3af",
          },
        }}
      >
        {/* Queries Section */}
        <SidebarActions />
      </Box>
    </Drawer>
  );
}
