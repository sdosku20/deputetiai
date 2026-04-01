"use client";

import { Box, Button, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useRef, useState } from "react";

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
  sources?: string[];
  reasoningSteps?: string[];
  animateTyping?: boolean;
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
  sources = [],
  reasoningSteps = [],
  animateTyping = false,
  onToggleExpand,
}: MessageBubbleProps) {
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const animatedOnceRef = useRef(false);

  useEffect(() => {
    const fullText = isExpanded ? fullContent : visiblePart;
    if (!animateTyping || animatedOnceRef.current) {
      setTypedText(fullText);
      return;
    }

    animatedOnceRef.current = true;
    setIsTyping(true);
    setTypedText("");
    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      if (i >= fullText.length) {
        setTypedText(fullText);
        setIsTyping(false);
        clearInterval(interval);
        return;
      }
      setTypedText(fullText.slice(0, i));
    }, 14);

    return () => clearInterval(interval);
  }, [animateTyping, fullContent, isExpanded, visiblePart]);

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
        {typedText}
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
              : "Fshih Burimet & Detajet"
            : isAlbanian
              ? "Shfaq Burimet & Detajet Ligjore"
              : "Shfaq Burimet & Detajet Ligjore"}
        </Button>
      )}

      {refId && (
        <Typography sx={{ mt: 1, fontSize: "0.65rem", color: "hsl(var(--text-muted))", fontFamily: "var(--font-geist-mono), monospace" }}>
          ref: {refId}
        </Typography>
      )}

      {sources.length > 0 && (
        <Box sx={{ mt: 1.4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
            <Typography
              sx={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "hsl(var(--text-muted))",
                fontWeight: 600,
              }}
            >
              Burimet:
            </Typography>
            {sources.slice(0, 6).map((source, idx) => (
              <Box
                key={`${source}-${idx}`}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.8,
                  borderRadius: 999,
                  border: "1px solid hsl(var(--border-soft))",
                  backgroundColor: "hsl(var(--surface-muted))",
                  px: 0.55,
                  py: 0.35,
                }}
              >
                <Box
                  sx={{
                    minWidth: 28,
                    height: 20,
                    borderRadius: 1.2,
                    px: 0.55,
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: "#0d47a1",
                    color: "#ffffff",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    lineHeight: 1,
                  }}
                >
                  EU
                </Box>
                <Typography sx={{ fontSize: "0.8rem", color: "hsl(var(--text-primary))", lineHeight: 1 }}>
                  {source}
                </Typography>
              </Box>
            ))}
            {sources.length > 6 && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: 999,
                  border: "1px solid hsl(var(--border-soft))",
                  backgroundColor: "hsl(var(--surface-muted))",
                  px: 1.1,
                  py: 0.45,
                }}
              >
                <Typography sx={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))", lineHeight: 1 }}>
                  +{sources.length - 6} me shume
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {reasoningSteps.length > 0 && (
        <Box sx={{ mt: 1.4 }}>
          <Button
            size="small"
            onClick={() => setShowReasoning((prev) => !prev)}
            startIcon={showReasoning ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            sx={{ px: 0, color: "hsl(var(--text-muted))", "&:hover": { bgcolor: "transparent", color: "hsl(var(--text-primary))" } }}
          >
            Hapat e arsyetimit
          </Button>
          {showReasoning && (
            <Box sx={{ mt: 0.6, pl: 0.3 }}>
              {reasoningSteps.map((step, idx) => (
                <Typography key={`${step}-${idx}`} sx={{ fontSize: "0.86rem", color: "hsl(var(--text-muted))", mb: 0.45 }}>
                  {idx + 1}. {step}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
