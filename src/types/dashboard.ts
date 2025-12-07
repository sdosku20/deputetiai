/**
 * Navigation Item - Sidebar navigation structure
 */
export interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  badge?: string | number;
  children?: NavigationItem[];
  active?: boolean;
  disabled?: boolean;
  permissions?: string[];
  onClick?: () => void;
}

