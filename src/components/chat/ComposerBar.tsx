"use client";

import { CircularProgress, IconButton, Paper, TextField, Box } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import type { KeyboardEvent } from "react";

interface ComposerBarProps {
  loading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
}

export function ComposerBar({ loading, input, onInputChange, onSend, onKeyDown }: ComposerBarProps) {
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
          placeholder="Ask about EU law..."
          InputProps={{ disableUnderline: true }}
          sx={{
            "& .MuiInputBase-input": {
              px: 1,
              fontSize: "0.94rem",
            },
            "& .MuiInputBase-root.Mui-focused": {
              boxShadow: "inset 0 0 0 2px hsl(var(--ring) / 0.18)",
              borderRadius: 2,
            },
          }}
        />
        <IconButton
          onClick={onSend}
          disabled={!input.trim() || loading}
          sx={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            bgcolor: input.trim() ? "hsl(var(--primary))" : "hsl(var(--border-soft))",
            color: "hsl(var(--primary-foreground))",
            "&:hover": {
              bgcolor: input.trim() ? "hsl(var(--primary))" : "hsl(var(--border-soft))",
              filter: input.trim() ? "brightness(1.08)" : "none",
            },
            "&:focus-visible": {
              outline: "2px solid hsl(var(--ring))",
              outlineOffset: "2px",
            },
            "&.Mui-disabled": {
              color: "hsl(var(--primary-foreground))",
            },
          }}
        >
          {loading ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : <SendIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      </Paper>
    </Box>
  );
}
