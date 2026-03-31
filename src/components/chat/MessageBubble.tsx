"use client";

import { Box, Button, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  id: number;
  text: string;
  isUserMessage: boolean;
  visiblePart: string;
  fullContent: string;
  hasMore: boolean;
  isExpanded: boolean;
  isAlbanian: boolean;
  refId: string | null;
  onToggleExpand: (id: number) => void;
}

export function MessageBubble({
  id,
  text,
  isUserMessage,
  visiblePart,
  fullContent,
  hasMore,
  isExpanded,
  isAlbanian,
  refId,
  onToggleExpand,
}: MessageBubbleProps) {
  if (isUserMessage) {
    return (
      <Box
        sx={{
          alignSelf: "flex-end",
          bgcolor: "hsl(var(--surface))",
          border: "1px solid hsl(var(--border-soft))",
          px: 1.5,
          py: 1,
          borderRadius: 3,
          maxWidth: { xs: "88%", sm: "72%" },
          boxShadow: "0 4px 16px rgba(17, 24, 39, 0.06)",
          fontSize: "0.95rem",
          lineHeight: 1.45,
          wordBreak: "break-word",
        }}
      >
        {text}
      </Box>
    );
  }

  return (
    <Box sx={{ alignSelf: "flex-start", width: "100%", fontSize: "0.95rem", lineHeight: 1.5 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p style={{ margin: "0.55em 0" }}>{children}</p>,
          table: ({ children }) => (
            <Box sx={{ overflowX: "auto", my: 1.5 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>{children}</table>
            </Box>
          ),
          thead: ({ children }) => <thead style={{ backgroundColor: "hsl(var(--surface-muted))" }}>{children}</thead>,
          th: ({ children }) => (
            <th style={{ padding: "8px 12px", borderBottom: "1px solid hsl(var(--border-soft))", textAlign: "left", whiteSpace: "nowrap" }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{ padding: "8px 12px", borderBottom: "1px solid hsl(var(--border-soft))", verticalAlign: "top" }}>
              {children}
            </td>
          ),
        }}
      >
        {isExpanded ? fullContent : visiblePart}
      </ReactMarkdown>

      {hasMore && (
        <Button
          onClick={() => onToggleExpand(id)}
          size="small"
          startIcon={isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          sx={{
            mt: 0.8,
            color: "hsl(var(--text-muted))",
            px: 0,
            "&:hover": { color: "hsl(var(--text-primary))", bgcolor: "transparent" },
          }}
        >
          {isExpanded
            ? isAlbanian
              ? "Fshih Burimet & Detajet"
              : "Hide Sources & Details"
            : isAlbanian
              ? "Shfaq Burimet & Detajet Ligjore"
              : "Show Sources & Legal Details"}
        </Button>
      )}

      {refId && (
        <Typography sx={{ mt: 1, fontSize: "0.65rem", color: "hsl(var(--text-muted))", fontFamily: "var(--font-geist-mono), monospace" }}>
          ref: {refId}
        </Typography>
      )}
    </Box>
  );
}
