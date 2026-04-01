"use client";

import { Box, Button, CircularProgress, Drawer, IconButton, Skeleton, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatSource } from "@/lib/api/client";

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
  sources?: ChatSource[];
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
  const [selectedSource, setSelectedSource] = useState<ChatSource | null>(null);
  const [sourceDetailLoading, setSourceDetailLoading] = useState(false);
  const [sourceDetailText, setSourceDetailText] = useState<string | null>(null);
  const [resolvedExplorerSource, setResolvedExplorerSource] = useState<"eu_law" | "albanian" | null>(null);
  const [resolvedExplorerDocId, setResolvedExplorerDocId] = useState<string | null>(null);
  const animatedOnceRef = useRef(false);
  const sanitizeRenderedText = (value: string) =>
    value
      .replace(/\n?\*\*Sources:\*\*[^\n]*/gi, "")
      .replace(/\n?Sources:[^\n]*/gi, "")
      // Normalize fallback-style section labels if they appear in content.
      .replace(/^\s*Direct Answer\s*/gim, "")
      .replace(/^\s*Legal Basis\s*[\s\S]*?(?=^\s*Legal Text\s*$|$)/gim, "")
      .replace(/^\s*Legal Text\s*/gim, "")
      .trim();

  const effectiveSources = useMemo(() => {
    if (sources.length > 0) return sources;
    const sourceMatch = fullContent.match(/(?:\*\*Sources:\*\*|Sources:)\s*([^\n]+)/i);
    if (!sourceMatch?.[1]) return [];
    return sourceMatch[1]
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 12)
      .map((label) => ({ label }));
  }, [fullContent, sources]);

  const groupedReasoning = [
    {
      key: "sources",
      title: "Burimet e perdorura",
      items: effectiveSources.slice(0, 8).map((source) => source),
    },
    {
      key: "tables",
      title: "Tabelat qe po perdoren",
      items: reasoningSteps.filter((step) => /table|source|retriev|burim|dataset|dokument/i.test(step)),
    },
    {
      key: "filters",
      title: "Filtrat qe po aplikohen",
      items: reasoningSteps.filter((step) => /filter|scope|criteria|kriter|kusht/i.test(step)),
    },
    {
      key: "joins",
      title: "Lidhjet e te dhenave",
      items: reasoningSteps.filter((step) => /join|match|map|relat|lidh/i.test(step)),
    },
    {
      key: "other",
      title: "Hapa te tjere",
      items: reasoningSteps.filter(
        (step) => !/table|source|retriev|burim|dataset|dokument|filter|scope|criteria|kriter|kusht|join|match|map|relat|lidh/i.test(step)
      ),
    },
  ].filter((group) => group.items.length > 0);

  useEffect(() => {
    const fullText = sanitizeRenderedText(isExpanded ? fullContent : visiblePart);
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

  useEffect(() => {
    const loadSourceDetail = async () => {
      if (!selectedSource) return;
      setSourceDetailText(selectedSource.textPreview || null);
      setSourceDetailLoading(true);
      setResolvedExplorerSource(null);
      setResolvedExplorerDocId(selectedSource.documentId || null);
      try {
        const ensureJwtToken = async (forceRefresh = false): Promise<string | null> => {
          if (typeof window === "undefined") return null;
          if (forceRefresh) {
            localStorage.removeItem("jwt_token");
          }
          const existing = localStorage.getItem("jwt_token");
          if (existing) return existing;
          try {
            const loginResponse = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                username: "michael",
                password: "IUsedToBeAStrongPass__",
              }),
            });
            if (!loginResponse.ok) return null;
            const loginData = (await loginResponse.json()) as { access_token?: string; token?: string };
            const token = loginData.access_token || loginData.token || null;
            if (token) {
              localStorage.setItem("jwt_token", token);
              window.dispatchEvent(new CustomEvent("jwtTokenUpdated"));
            }
            return token;
          } catch {
            return null;
          }
        };

        let jwtToken = await ensureJwtToken();
        if (!jwtToken) {
          setSourceDetailLoading(false);
          return;
        }

        const fetchWithAuthRetry = async (url: string, currentToken: string) => {
          let tokenToUse = currentToken;
          let response = await fetch(url, {
            headers: { Authorization: `Bearer ${tokenToUse}` },
          });
          if (response.status !== 401) {
            return { response, token: tokenToUse };
          }
          const refreshed = await ensureJwtToken(true);
          if (!refreshed) {
            return { response, token: tokenToUse };
          }
          tokenToUse = refreshed;
          response = await fetch(url, {
            headers: { Authorization: `Bearer ${tokenToUse}` },
          });
          return { response, token: tokenToUse };
        };

        const selectedLawSource =
          typeof window !== "undefined" && localStorage.getItem("selected_law") === "albanian" ? "albanian" : "eu_law";
        const label = selectedSource.label || "";
        const [docIdRaw, ...rest] = label.split(/\s+/);
        const docId = docIdRaw?.trim();
        const articleHint = rest.join(" ").trim().toLowerCase();

        const inferredSourceType =
          selectedSource.sourceType === "eurlex" || /^\d{4}[A-Z]/i.test(docId || "") || /^(teu|tfeu)$/i.test(docId || "")
            ? "eu_law"
            : selectedLawSource;
        const sourceCandidates = Array.from(
          new Set<[string, ...string[]]>([
            inferredSourceType,
            inferredSourceType === "eu_law" ? "albanian" : "eu_law",
          ])
        );

        const hintTokens = articleHint
          .split(/\s+/)
          .map((token) => token.trim())
          .filter((token) => token.length > 1);

        for (const sourceType of sourceCandidates) {
          let resolvedDocId = selectedSource.documentId || docId || "";

          // Always try search first to resolve canonical document IDs.
          const searchResult = await fetchWithAuthRetry(
            `/api/library?source=${encodeURIComponent(sourceType)}&q=${encodeURIComponent(label)}&limit=5`,
            jwtToken
          );
          jwtToken = searchResult.token;
          const searchRes = searchResult.response;
          if (searchRes.ok) {
            const searchJson = (await searchRes.json()) as { results?: Array<Record<string, unknown>> };
            const results = searchJson.results || [];
            const matched = results.find((item) => {
              const candidateId = String(item.document_id || item.id || "");
              return docId ? candidateId.toLowerCase().includes(docId.toLowerCase()) : Boolean(candidateId);
            });
            const firstResult = matched || results[0];
            const candidate = firstResult?.document_id || firstResult?.id;
            if (typeof candidate === "string" && candidate.trim()) {
              resolvedDocId = candidate.trim();
            }
          }

          if (!resolvedDocId) continue;
          setResolvedExplorerSource(sourceType as "eu_law" | "albanian");
          setResolvedExplorerDocId(resolvedDocId);

          const detailResult = await fetchWithAuthRetry(
            `/api/library?source=${encodeURIComponent(sourceType)}&doc_id=${encodeURIComponent(resolvedDocId)}`,
            jwtToken
          );
          jwtToken = detailResult.token;
          const detailRes = detailResult.response;

          const chunksResult = await fetchWithAuthRetry(
            `/api/library?source=${encodeURIComponent(sourceType)}&doc_id=${encodeURIComponent(resolvedDocId)}&mode=chunks`,
            jwtToken
          );
          jwtToken = chunksResult.token;
          const chunksRes = chunksResult.response;

          if (!detailRes.ok && !chunksRes.ok) continue;

          const detailJson = detailRes.ok ? ((await detailRes.json()) as Record<string, unknown>) : null;
          const chunksJson = chunksRes.ok ? ((await chunksRes.json()) as { chunks?: Array<Record<string, unknown>> }) : { chunks: [] };
          const chunks = chunksJson.chunks || [];

          const matchedChunk =
            chunks.find((chunk) => {
              const article = String(chunk.article_label || chunk.group_label || "").toLowerCase();
              const heading = String(chunk.article_title || chunk.group_title || chunk.article_heading || "").toLowerCase();
              if (!articleHint) return false;
              if (article.includes(articleHint) || heading.includes(articleHint)) return true;
              return hintTokens.some((token) => article.includes(token) || heading.includes(token));
            }) || chunks[0];

          const bestText =
            (matchedChunk && (String(matchedChunk.text || matchedChunk.text_preview || "").trim() || null)) ||
            (detailJson && String(detailJson.subtitle || detailJson.title || "").trim()) ||
            selectedSource.textPreview ||
            null;

          if (bestText) {
            setSourceDetailText(bestText);
            break;
          }
        }
      } catch {
        // Keep fallback preview text
      } finally {
        setSourceDetailLoading(false);
      }
    };

    loadSourceDetail();
  }, [selectedSource]);

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
      {reasoningSteps.length > 0 || effectiveSources.length > 0 ? (
        <Box sx={{ mt: 0.4, mb: 1.2 }}>
          <Button
            size="small"
            onClick={() => setShowReasoning((prev) => !prev)}
            startIcon={showReasoning ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            sx={{ px: 0, color: "hsl(var(--text-muted))", "&:hover": { bgcolor: "transparent", color: "hsl(var(--text-primary))" } }}
          >
            Hapat e arsyetimit
          </Button>
          {showReasoning && (
            <Box sx={{ mt: 0.6, pl: 0.3, display: "grid", gap: 1 }}>
              {groupedReasoning.map((group) => (
                <Box key={group.key}>
                  <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "hsl(var(--text-primary))", mb: 0.5 }}>
                    {group.title}
                  </Typography>
                  <Box sx={{ display: "grid", gap: 0.55 }}>
                    {group.key === "sources"
                      ? (group.items as ChatSource[]).map((source, idx) => (
                          <Button
                            key={`${source.label}-${idx}`}
                            onClick={() => setSelectedSource(source)}
                            sx={{
                              justifyContent: "flex-start",
                              gap: 0.7,
                              minWidth: "auto",
                              px: 0.2,
                              py: 0.15,
                              textTransform: "none",
                              color: "hsl(var(--text-muted))",
                              "&:hover": { bgcolor: "transparent", color: "hsl(var(--text-primary))" },
                            }}
                          >
                            <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: "hsl(var(--primary))", flexShrink: 0 }} />
                            <Typography sx={{ fontSize: "0.9rem" }}>
                              {source.treaty && source.article ? `[${source.treaty}] ${source.article}` : source.label}
                            </Typography>
                          </Button>
                        ))
                      : (group.items as string[]).map((step, idx) => (
                          <Box key={`${group.key}-${idx}`} sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                            <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: isTyping ? "hsl(var(--text-muted))" : "hsl(var(--primary))" }} />
                            <Typography sx={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))" }}>{step}</Typography>
                          </Box>
                        ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ) : null}

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

      <Drawer
        anchor="right"
        open={Boolean(selectedSource)}
        onClose={() => setSelectedSource(null)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 420 },
            p: 1.2,
            bgcolor: "hsl(var(--surface))",
          },
        }}
      >
        {selectedSource && (
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
              <Typography sx={{ fontSize: "1.02rem", fontWeight: 700, lineHeight: 1.3 }}>
                {selectedSource.articleHeading || selectedSource.label}
              </Typography>
              <IconButton size="small" onClick={() => setSelectedSource(null)}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <Box sx={{ mt: 1, mb: 1.2 }}>
              <Typography sx={{ fontSize: "0.82rem", color: "hsl(var(--text-muted))" }}>
                {selectedSource.treaty ? `${selectedSource.treaty}` : ""}
                {selectedSource.article ? ` - Neni ${selectedSource.article}` : ""}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
              onClick={() => {
                if (typeof window !== "undefined") {
                  const q = selectedSource.reference || selectedSource.label;
                  const sourceParam =
                    selectedSource.dataSource || resolvedExplorerSource || (localStorage.getItem("selected_law") === "albanian" ? "albanian" : "eu_law");
                  const params = new URLSearchParams();
                  params.set("q", q);
                  params.set("source", sourceParam);
                  if (resolvedExplorerDocId) {
                    params.set("doc_id", resolvedExplorerDocId);
                  } else if (selectedSource.documentId) {
                    params.set("doc_id", selectedSource.documentId);
                  }
                  if (selectedSource.article) {
                    params.set("article", selectedSource.article);
                  }
                  window.location.href = `/explorer?${params.toString()}`;
                }
              }}
              sx={{ alignSelf: "flex-start", mb: 1.1, textTransform: "none" }}
            >
              Hap ne Explorer
            </Button>
            {sourceDetailLoading ? (
              <Box sx={{ mt: 0.1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.2 }}>
                  <CircularProgress size={16} />
                  <Typography sx={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))" }}>
                    Po ngarkohet permbajtja...
                  </Typography>
                </Box>
                <Skeleton variant="rounded" height={18} sx={{ mb: 0.6 }} />
                <Skeleton variant="rounded" height={18} sx={{ mb: 0.6 }} />
                <Skeleton variant="rounded" height={18} width="82%" />
              </Box>
            ) : (
              <Typography sx={{ fontSize: "0.98rem", color: "hsl(var(--text-primary))", lineHeight: 1.7 }}>
                {sourceDetailText || "Nuk ka permbajtje te detajuar per kete burim."}
              </Typography>
            )}
            {typeof selectedSource.score === "number" && (
              <Typography sx={{ mt: "auto", fontSize: "0.78rem", color: "hsl(var(--text-muted))", pt: 2 }}>
                Relevance: {Math.round(selectedSource.score * 100)}%
              </Typography>
            )}
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
