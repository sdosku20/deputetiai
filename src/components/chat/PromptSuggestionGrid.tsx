"use client";

import { Box, Button, Paper, Typography } from "@mui/material";

interface PromptGroup {
  title: string;
  prompts: string[];
}

interface PromptSuggestionGridProps {
  onPromptClick: (prompt: string) => void;
}

const PROMPT_GROUPS: PromptGroup[] = [
  { title: "Fact Finding", prompts: ["Max GDPR fine", "GDPR legal bases", "AI Act deadline", "Infringement procedures"] },
  { title: "Cross-Document Reasoning", prompts: ["NIS2 and GDPR", "AI Act and medical devices", "DSA and e-Commerce"] },
  { title: "Temporal Accuracy", prompts: ["GDPR vs Directive 95/46", "AI Act entry into force", "AI transitional provisions"] },
  { title: "Hierarchical Reasoning", prompts: ["Data localization", "Regulation vs Directive"] },
  { title: "Edge Cases & Exceptions", prompts: ["GDPR outside EU", "AI high risk", "Automated decisions"] },
];

export function PromptSuggestionGrid({ onPromptClick }: PromptSuggestionGridProps) {
  return (
    <Box sx={{ width: "100%", maxWidth: 980, mx: "auto", pt: { xs: 2, sm: 4 } }}>
      <Typography sx={{ textAlign: "center", fontWeight: 600, fontSize: { xs: "1.1rem", sm: "1.35rem" } }}>
        Ask about EU Law
      </Typography>
      <Typography sx={{ textAlign: "center", color: "hsl(var(--text-muted))", mt: 0.4, mb: 2.8, fontSize: "0.92rem" }}>
        Get answers with references to specific treaties and articles
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.4 }}>
        {PROMPT_GROUPS.map((group) => (
          <Paper
            key={group.title}
            sx={{
              px: 1.3,
              pt: 1.45,
              pb: 1.2,
              minHeight: 222,
              borderRadius: 1.5,
              bgcolor: "hsl(var(--surface-muted))",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.66rem",
                textTransform: "uppercase",
                letterSpacing: "0.09em",
                color: "hsl(var(--text-muted))",
                fontWeight: 700,
                pl: 1,
                pt: 0.5,
                mb: 1.05,
                lineHeight: 1.2,
              }}
            >
              {group.title}
            </Typography>
            <Box sx={{ display: "grid", gap: 0.8 }}>
              {group.prompts.map((prompt) => (
                <Button
                  key={prompt}
                  onClick={() => onPromptClick(prompt)}
                  variant="outlined"
                  sx={{
                    justifyContent: "flex-start",
                    borderRadius: 2,
                    py: 0.75,
                    px: 1.1,
                    fontSize: "0.82rem",
                    color: "hsl(var(--text-primary))",
                    borderColor: "hsl(var(--border-soft))",
                    bgcolor: "hsl(var(--surface))",
                    "&:hover": {
                      borderColor: "hsl(var(--text-muted))",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  {prompt}
                </Button>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
