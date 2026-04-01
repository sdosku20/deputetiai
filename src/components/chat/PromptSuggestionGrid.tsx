"use client";

import { Box, Button, Paper, Typography } from "@mui/material";

interface PromptGroup {
  title: string;
  prompts: Array<{
    label: string;
    fullQuestion: string;
  }>;
}

interface PromptSuggestionGridProps {
  onPromptClick: (prompt: string) => void;
  selectedLawLabel?: string;
}

const PROMPT_GROUPS: PromptGroup[] = [
  {
    title: "Fact Finding",
    prompts: [
      { label: "Max GDPR fine", fullQuestion: "What is the maximum fine under GDPR for serious violations?" },
      { label: "GDPR legal bases", fullQuestion: "What are the legal bases for processing personal data under GDPR Article 6?" },
      { label: "AI Act deadline", fullQuestion: "When does the EU AI Act become applicable, and what are the key compliance deadlines?" },
      {
        label: "Infringement procedures",
        fullQuestion: "How does the EU infringement procedure work against Member States, step by step?",
      },
    ],
  },
  {
    title: "Cross-Document Reasoning",
    prompts: [
      { label: "NIS2 and GDPR", fullQuestion: "How do NIS2 obligations interact with GDPR requirements for incident response?" },
      {
        label: "AI Act and medical devices",
        fullQuestion: "How does the AI Act apply to AI systems used in medical devices under EU law?",
      },
      {
        label: "DSA and e-Commerce",
        fullQuestion: "What are the main differences between the Digital Services Act and the e-Commerce Directive?",
      },
    ],
  },
  {
    title: "Temporal Accuracy",
    prompts: [
      {
        label: "GDPR vs Directive 95/46",
        fullQuestion: "What changed when GDPR replaced Directive 95/46/EC, and which obligations became stricter?",
      },
      {
        label: "AI Act entry into force",
        fullQuestion: "On what date did the AI Act enter into force, and from when do its core provisions apply?",
      },
      {
        label: "AI transitional provisions",
        fullQuestion: "What are the AI Act transitional provisions and how do they affect existing AI systems?",
      },
    ],
  },
  {
    title: "Hierarchical Reasoning",
    prompts: [
      { label: "Data localization", fullQuestion: "When is data localization allowed or restricted under EU law?" },
      {
        label: "Regulation vs Directive",
        fullQuestion: "What is the legal difference between an EU Regulation and an EU Directive in practice?",
      },
    ],
  },
  {
    title: "Edge Cases & Exceptions",
    prompts: [
      { label: "GDPR outside EU", fullQuestion: "When does GDPR apply to companies located outside the European Union?" },
      { label: "AI high risk", fullQuestion: "How does the AI Act define high-risk AI systems and what obligations apply?" },
      {
        label: "Automated decisions",
        fullQuestion: "What rights do individuals have under GDPR regarding automated decision-making and profiling?",
      },
    ],
  },
];

export function PromptSuggestionGrid({ onPromptClick, selectedLawLabel = "EU Law" }: PromptSuggestionGridProps) {
  return (
    <Box sx={{ width: "100%", maxWidth: 980, mx: "auto", pt: { xs: 2, sm: 4 } }}>
      <Typography sx={{ textAlign: "center", fontWeight: 600, fontSize: { xs: "1.1rem", sm: "1.35rem" } }}>
        Ask about {selectedLawLabel}
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
                  key={prompt.label}
                  onClick={() => onPromptClick(prompt.fullQuestion)}
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
                  {prompt.label}
                </Button>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
