"use client";

// Optimized: Direct imports instead of barrel imports (saves 10-15KB)
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Switch from "@mui/material/Switch";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import type { SelectChangeEvent } from "@mui/material/Select";
import CloseIcon from "@mui/icons-material/Close";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import { type MouseEvent, useState } from "react";
import type { NavigationItem } from "@/types/dashboard";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarActions } from "./SidebarActions";

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
  items: _items,
  selectedItem: _selectedItem,
  onItemSelect: _onItemSelect,
  user = {
    name: "User",
    email: "user@example.com",
  },
  className,
}: SidebarProps) {
  void _items;
  void _selectedItem;
  void _onItemSelect;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchMode, setSearchMode] = useState("balanced");
  const [queryMode, setQueryMode] = useState("hyde");
  const [retrievalMode, setRetrievalMode] = useState("sat");
  const [dataVersion, setDataVersion] = useState("System Default (Active)");

  const handleSearchMode = (_: MouseEvent<HTMLElement>, value: string | null) => {
    if (value) setSearchMode(value);
  };

  const handleQueryMode = (_: MouseEvent<HTMLElement>, value: string | null) => {
    if (value) setQueryMode(value);
  };

  const handleRetrievalMode = (event: SelectChangeEvent) => {
    setRetrievalMode(event.target.value);
  };

  const handleDataVersion = (event: SelectChangeEvent) => {
    setDataVersion(event.target.value);
  };

  const footerLinks = [
    { id: "library", label: "Library", icon: <SearchOutlinedIcon sx={{ fontSize: 18 }} /> },
    { id: "explorer", label: "Explorer", icon: <ExploreOutlinedIcon sx={{ fontSize: 18 }} /> },
    { id: "compare", label: "Compare", icon: <CompareArrowsOutlinedIcon sx={{ fontSize: 18 }} /> },
    { id: "dashboard", label: "Dashboard", icon: <DashboardOutlinedIcon sx={{ fontSize: 18 }} /> },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 270,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 270,
          boxSizing: "border-box",
          backgroundColor: "hsl(var(--surface))",
          boxShadow: "none",
          borderRadius: 0,
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
            background: "hsl(var(--border-soft))",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "hsl(var(--text-muted))",
          },
        }}
      >
        {/* Sidebar sections */}
        <SidebarActions />
      </Box>

      <Box sx={{ px: 2, py: 1.5, borderTop: "1px solid hsl(var(--border-soft))" }}>
        <Box
          component="button"
          type="button"
          onClick={() => setSettingsOpen(true)}
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1,
            py: 0.9,
            borderRadius: 2,
            color: "hsl(var(--text-primary))",
            border: "none",
            background: "transparent",
            textAlign: "left",
            transition: "background-color 160ms ease",
            "&:hover": { backgroundColor: "hsl(var(--surface-muted))" },
            "&:focus-visible": {
              outline: "2px solid hsl(var(--ring))",
              outlineOffset: "2px",
            },
          }}
        >
          <SettingsOutlinedIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: "0.9rem", fontWeight: 500 }}>Settings</Typography>
        </Box>

        <Box sx={{ mt: 0.5 }}>
          {footerLinks.map((item) => (
            <Box
              key={item.id}
              component="button"
              type="button"
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1,
                py: 0.8,
                borderRadius: 2,
                color: "hsl(var(--text-primary))",
                border: "none",
                background: "transparent",
                textAlign: "left",
                transition: "background-color 160ms ease",
                "&:hover": { backgroundColor: "hsl(var(--surface-muted))" },
                "&:focus-visible": {
                  outline: "2px solid hsl(var(--ring))",
                  outlineOffset: "2px",
                },
              }}
            >
              {item.icon}
              <Typography sx={{ fontSize: "0.88rem" }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          px: 2,
          py: 1.2,
          borderTop: "1px solid hsl(var(--border-soft))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: "hsl(var(--surface-muted))",
              display: "grid",
              placeItems: "center",
              fontSize: "0.74rem",
              fontWeight: 700,
              color: "hsl(var(--text-primary))",
            }}
          >
            {(user.name || "U").slice(0, 1).toUpperCase()}
          </Box>
          <Typography sx={{ fontSize: "0.86rem", maxWidth: 150 }} noWrap>
            {user.name}
          </Typography>
        </Box>
      </Box>

      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth={false}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxWidth: "92vw",
              borderRadius: 2,
              border: "1px solid hsl(var(--border-soft))",
            },
          },
        }}
      >
        <DialogContent sx={{ px: 2.2, py: 1.6 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.2 }}>
            <Typography sx={{ fontSize: "1rem", fontWeight: 600 }}>Settings</Typography>
            <IconButton size="small" onClick={() => setSettingsOpen(false)}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Typography sx={{ fontSize: "0.66rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--text-muted))", mb: 0.7 }}>
            Usage
          </Typography>
          <Box sx={{ mb: 1.4 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem", mb: 0.6 }}>
              <Typography sx={{ fontSize: "0.92rem" }}>Daily</Typography>
              <Typography sx={{ fontSize: "0.92rem" }}>7.9k / 400.0k</Typography>
            </Box>
            <Slider value={8} min={0} max={100} disabled />
            <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem", mb: 0.6, mt: 0.5 }}>
              <Typography sx={{ fontSize: "0.92rem" }}>Monthly</Typography>
              <Typography sx={{ fontSize: "0.92rem" }}>36.0k / 8.0M</Typography>
            </Box>
            <Slider value={1} min={0} max={100} disabled />
          </Box>

          <Typography sx={{ fontSize: "0.66rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--text-muted))", mb: 0.7 }}>
            Model
          </Typography>
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.8 }}>
              <Typography sx={{ fontSize: "0.92rem" }}>Composition</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography sx={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))" }}>mini</Typography>
                <Switch defaultChecked size="small" />
                <Typography sx={{ fontSize: "0.9rem" }}>5.4</Typography>
              </Box>
            </Box>
            <Typography sx={{ fontSize: "0.92rem", mb: 0.2 }}>Temperature</Typography>
            <Slider value={30} min={0} max={100} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))" }}> </Typography>
              <Typography sx={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))" }}>0</Typography>
            </Box>
            <Typography sx={{ fontSize: "0.92rem", mb: 0.2, mt: 0.4 }}>Context</Typography>
            <Slider value={88} min={0} max={100} />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Typography sx={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))" }}>32k</Typography>
            </Box>
          </Box>

          <Typography sx={{ fontSize: "0.66rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--text-muted))", mb: 0.7 }}>
            Search
          </Typography>
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: "0.92rem", mb: 0.4 }}>Mode</Typography>
            <ToggleButtonGroup value={searchMode} exclusive onChange={handleSearchMode} fullWidth size="small" sx={{ mb: 0.8 }}>
              <ToggleButton value="precise">Precise</ToggleButton>
              <ToggleButton value="balanced">Balanced</ToggleButton>
              <ToggleButton value="broad">Broad</ToggleButton>
            </ToggleButtonGroup>

            <Typography sx={{ fontSize: "0.92rem", mb: 0.4 }}>Query</Typography>
            <ToggleButtonGroup value={queryMode} exclusive onChange={handleQueryMode} size="small" sx={{ mb: 0.8 }}>
              <ToggleButton value="hyde">HyDE</ToggleButton>
              <ToggleButton value="fast">Fast</ToggleButton>
            </ToggleButtonGroup>

            <Typography sx={{ fontSize: "0.92rem", mb: 0.1 }}>Results</Typography>
            <Slider value={20} min={1} max={50} />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0.4 }}>
              <Typography sx={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))" }}>20</Typography>
            </Box>

            <Typography sx={{ fontSize: "0.92rem", mb: 0.1 }}>Rerank</Typography>
            <Slider value={25} min={1} max={50} />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0.4 }}>
              <Typography sx={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))" }}>25</Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: "0.92rem" }}>Neural Rerank</Typography>
              <Switch size="small" />
            </Box>
          </Box>

          <Typography sx={{ fontSize: "0.66rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--text-muted))", mb: 0.7 }}>
            Intelligence
          </Typography>
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.8 }}>
              <Typography sx={{ fontSize: "0.92rem" }}>Retrieval</Typography>
              <Select size="small" value={retrievalMode} onChange={handleRetrievalMode} sx={{ minWidth: 90, fontSize: "0.88rem" }}>
                <MenuItem value="sat">SAT</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
                <MenuItem value="keyword">Keyword</MenuItem>
              </Select>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: "0.92rem" }}>Decompose</Typography>
              <Switch defaultChecked size="small" />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: "0.92rem" }}>Graph</Typography>
              <Switch defaultChecked size="small" />
            </Box>

            <Typography sx={{ fontSize: "0.92rem", mt: 0.6, mb: 0.1 }}>Expansion</Typography>
            <Slider value={2} min={0} max={5} />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0.4 }}>
              <Typography sx={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))" }}>2</Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: "0.92rem" }}>ECHR Cases</Typography>
              <Switch size="small" />
            </Box>
          </Box>

          <Typography sx={{ fontSize: "0.66rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(var(--text-muted))", mb: 0.7 }}>
            Preferences
          </Typography>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.8 }}>
              <Typography sx={{ fontSize: "0.92rem" }}>Data Version</Typography>
              <Select size="small" value={dataVersion} onChange={handleDataVersion} sx={{ minWidth: 210, fontSize: "0.88rem" }}>
                <MenuItem value="System Default (Active)">System Default (Active)</MenuItem>
                <MenuItem value="Latest">Latest</MenuItem>
              </Select>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: "0.92rem" }}>Dark Mode</Typography>
              <Switch size="small" />
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Drawer>
  );
}
