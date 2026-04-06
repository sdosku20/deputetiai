"use client";

import {
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

interface ComposerBarProps {
  loading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
  focusInputSignal?: number;
}

interface ProfileOption {
  id: string;
  label: string;
  description: string;
}

const PROFILE_OPTIONS: ProfileOption[] = [
  { id: "general", label: "Pergjithshem", description: "Shpjegime te qarta per te gjithe" },
  { id: "legal", label: "Ligjor", description: "Gjuhe teknike juridike" },
  { id: "policy", label: "Politika", description: "Implikime te politikave" },
  { id: "academic", label: "Akademik", description: "Analize shkencore" },
  { id: "compliance", label: "Pajtueshmeri", description: "Udhezim praktik" },
];

export function ComposerBar({ loading, input, onInputChange, onSend, onKeyDown, focusInputSignal = 0 }: ComposerBarProps) {
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProfile, setSelectedProfile] = useState("general");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const activeProfile = useMemo(
    () => PROFILE_OPTIONS.find((option) => option.id === selectedProfile) || PROFILE_OPTIONS[0],
    [selectedProfile]
  );

  useEffect(() => {
    if (!focusInputSignal) return;
    inputRef.current?.focus();
  }, [focusInputSignal]);

  return (
    <Box sx={{ px: { xs: 1.4, sm: 2.5 }, py: { xs: 1.4, sm: 2 }, position: "sticky", bottom: 0, zIndex: 3 }}>
      <Paper
        sx={{
          maxWidth: 780,
          mx: "auto",
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          px: { xs: 1, sm: 1.2 },
          py: 0.85,
          borderRadius: 99,
          boxShadow: "0 8px 26px rgba(20, 20, 20, 0.08)",
          backdropFilter: "blur(3px)",
        }}
      >
        <TextField
          multiline
          minRows={1}
          maxRows={6}
          fullWidth
          variant="standard"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
          placeholder="Shkruani pyetjen tuaj..."
          inputRef={inputRef}
          InputProps={{ disableUnderline: true }}
          sx={{
            "& .MuiInputBase-input": {
              px: 1,
              fontSize: "0.94rem",
            },
          }}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.15 }}>
          <Button
            onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
            endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
            sx={{
              minWidth: "auto",
              px: 0.8,
              py: 0.7,
              borderRadius: 2,
              color: "hsl(var(--text-muted))",
              fontSize: "0.82rem",
              fontWeight: 500,
              lineHeight: 1,
              "&:hover": {
                backgroundColor: "hsl(var(--surface-muted))",
                color: "hsl(var(--text-primary))",
              },
            }}
          >
            {activeProfile.label}
          </Button>
        </Box>
        <IconButton
          onClick={onSend}
          disabled={!input.trim() || loading}
          sx={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            bgcolor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
            "&:hover": {
              bgcolor: "hsl(var(--primary))",
              filter: "brightness(1.08)",
            },
            "&:focus-visible": {
              outline: "2px solid hsl(var(--ring))",
              outlineOffset: "2px",
            },
            "&.Mui-disabled": {
              bgcolor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              opacity: 0.65,
            },
          }}
        >
          {loading ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : <SendIcon sx={{ fontSize: 18 }} />}
        </IconButton>

        <Menu
          anchorEl={profileMenuAnchor}
          open={Boolean(profileMenuAnchor)}
          onClose={() => setProfileMenuAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "bottom", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                mt: -1.2,
                width: 220,
                borderRadius: 2,
                border: "1px solid hsl(var(--border-soft))",
                boxShadow: "0 10px 24px rgba(17, 24, 39, 0.12)",
              },
            },
          }}
        >
          {PROFILE_OPTIONS.map((option) => (
            <MenuItem
              key={option.id}
              onClick={() => {
                setSelectedProfile(option.id);
                setProfileMenuAnchor(null);
              }}
              selected={selectedProfile === option.id}
              sx={{
                alignItems: "flex-start",
                py: 1,
                px: 1.2,
                borderRadius: 1.2,
                mx: 0.5,
                my: 0.15,
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.2 }}>
                <Typography sx={{ fontSize: "0.92rem", fontWeight: 600, color: "hsl(var(--text-primary))" }}>
                  {option.label}
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", lineHeight: 1.2 }}>
                  {option.description}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Paper>
    </Box>
  );
}
