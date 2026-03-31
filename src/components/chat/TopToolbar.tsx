"use client";

import { Box, IconButton } from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SearchIcon from "@mui/icons-material/Search";
import AppsIcon from "@mui/icons-material/Apps";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export function TopToolbar() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mb: 1.2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {[<ChatBubbleOutlineIcon key="chat" sx={{ fontSize: 18 }} />, <SearchIcon key="search" sx={{ fontSize: 18 }} />, <AppsIcon key="apps" sx={{ fontSize: 18 }} />, <MoreVertIcon key="more" sx={{ fontSize: 18 }} />].map((icon, idx) => (
          <IconButton
            key={idx}
            size="small"
            sx={{
              border: "1px solid hsl(var(--border-soft))",
              bgcolor: "hsl(var(--surface))",
              color: "hsl(var(--text-muted))",
              transition: "all 140ms ease",
              "&:hover": {
                color: "hsl(var(--text-primary))",
                backgroundColor: "hsl(var(--surface-muted))",
                transform: "translateY(-1px)",
              },
              "&:focus-visible": {
                outline: "2px solid hsl(var(--ring))",
                outlineOffset: "1px",
              },
            }}
          >
            {icon}
          </IconButton>
        ))}
      </Box>
    </Box>
  );
}
