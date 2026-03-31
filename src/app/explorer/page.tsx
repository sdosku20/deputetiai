"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/navigation/Sidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";

type SourceKey = "eu_law" | "albanian";

interface ExplorerDocument {
  id: string;
  title: string;
  subtitle: string;
  doc_type: string;
  date: string;
  in_force: boolean;
  chunk_count: number;
}

interface ExplorerChunk {
  key: string;
  id: string;
  article_label?: string;
  article_title?: string;
  group_label?: string;
  group_title?: string;
  text?: string;
  text_preview?: string;
}

type ExplorerChunksPayload = { chunks?: Array<Partial<ExplorerChunk> & Record<string, unknown>> };

const SOURCE_OPTIONS: Array<{ id: SourceKey; label: string }> = [
  { id: "eu_law", label: "EU Law" },
  { id: "albanian", label: "Albanian" },
];

const DECADE_OPTIONS = ["All years", "2020s", "2010s", "2000s", "1990s", "1980s", "1970s", "1960s", "1950s"];

export default function ExplorerPage() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const [source, setSource] = useState<SourceKey>("eu_law");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<ExplorerDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedChunks, setSelectedChunks] = useState<ExplorerChunk[]>([]);
  const [selectedDocDetail, setSelectedDocDetail] = useState<Record<string, unknown> | null>(null);
  const [chunkQuery, setChunkQuery] = useState("");
  const [selectedChunkKey, setSelectedChunkKey] = useState<string | null>(null);

  const userForHeader = authUser
    ? {
        id: authUser.id || "",
        email: authUser.email || "",
      }
    : undefined;

  const fetchDocuments = useCallback(async () => {
    const jwtToken = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
    if (!jwtToken) {
      setDocuments([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const url =
        query.trim().length > 0
          ? `/api/library?source=${encodeURIComponent(source)}&q=${encodeURIComponent(query.trim())}&limit=200`
          : `/api/library?source=${encodeURIComponent(source)}&page=1&page_size=200`;

      const response = await fetch(url, { headers: { Authorization: `Bearer ${jwtToken}` } });
      if (!response.ok) throw new Error(`Explorer request failed: ${response.status}`);

      if (query.trim().length > 0) {
        const payload = (await response.json()) as { results: Array<Record<string, unknown>>; total: number };
        const mapped = (payload.results || []).map((item) => ({
          id: String(item.document_id || item.id || ""),
          title: String(item.title || "Untitled"),
          subtitle: String(item.subtitle || item.text_preview || ""),
          doc_type: String(item.doc_type || "Document"),
          date: "",
          in_force: false,
          chunk_count: 0,
        }));
        setDocuments(mapped.filter((d) => d.id));
        setTotal(payload.total || mapped.length);
      } else {
        const payload = (await response.json()) as { documents: ExplorerDocument[]; total: number };
        setDocuments(payload.documents || []);
        setTotal(payload.total || (payload.documents || []).length);
      }
    } catch (error) {
      console.error("Explorer load failed:", error);
      setDocuments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [query, source]);

  useEffect(() => {
    const t = setTimeout(fetchDocuments, 180);
    return () => clearTimeout(t);
  }, [fetchDocuments]);

  useEffect(() => {
    if (!selectedId && documents.length > 0) {
      setSelectedId(documents[0].id);
    }
    if (selectedId && !documents.some((doc) => doc.id === selectedId)) {
      setSelectedId(documents[0]?.id || null);
    }
  }, [documents, selectedId]);

  const selectedDoc = useMemo(() => documents.find((doc) => doc.id === selectedId) || null, [documents, selectedId]);

  const fetchSelectedDocumentData = useCallback(async () => {
    if (!selectedId) {
      setSelectedChunks([]);
      setSelectedDocDetail(null);
      return;
    }
    const jwtToken = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
    if (!jwtToken) return;

    setDetailLoading(true);
    try {
      const [detailRes, chunksRes] = await Promise.all([
        fetch(`/api/library?source=${encodeURIComponent(source)}&doc_id=${encodeURIComponent(selectedId)}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        }),
        fetch(
          `/api/library?source=${encodeURIComponent(source)}&doc_id=${encodeURIComponent(selectedId)}&mode=chunks`,
          {
            headers: { Authorization: `Bearer ${jwtToken}` },
          }
        ),
      ]);

      const detailJson = detailRes.ok ? ((await detailRes.json()) as Record<string, unknown>) : null;
      const chunksJson = chunksRes.ok ? ((await chunksRes.json()) as ExplorerChunksPayload) : { chunks: [] };
      const pickFirstString = (...values: unknown[]): string | undefined => {
        for (const value of values) {
          if (typeof value === "string" && value.trim()) return value;
        }
        return undefined;
      };

      const normalizedChunks: ExplorerChunk[] = (chunksJson.chunks || []).map((raw, index) => {
        const safeId =
          typeof raw.id === "string" && raw.id.trim()
            ? raw.id
            : [
                raw.article_label,
                raw.group_label,
                raw.article_title,
                raw.group_title,
                index.toString(),
              ]
                .filter(Boolean)
                .join("-")
                .replace(/\s+/g, "_");

        const articleLabel = pickFirstString(raw.article_label, raw.article, raw.article_id, raw.section_label);
        const articleTitle = pickFirstString(raw.article_title, raw.heading, raw.title);
        const groupLabel = pickFirstString(raw.group_label, raw.chapter_label, raw.recital_label);
        const groupTitle = pickFirstString(raw.group_title, raw.chapter_title, raw.recital_title);
        const fullText = pickFirstString(raw.text, raw.content, raw.chunk_text, raw.body, raw.section_text, raw.full_text);
        const previewText = pickFirstString(raw.text_preview, raw.preview, raw.snippet, raw.summary);

        return {
          key: `${safeId || "chunk"}-${index}`,
          id: safeId || `chunk-${index}`,
          article_label: articleLabel,
          article_title: articleTitle,
          group_label: groupLabel,
          group_title: groupTitle,
          text: fullText,
          text_preview: previewText,
        };
      });

      setSelectedDocDetail(detailJson);
      setSelectedChunks(normalizedChunks);
    } catch (error) {
      console.error("Explorer detail load failed:", error);
      setSelectedDocDetail(null);
      setSelectedChunks([]);
    } finally {
      setDetailLoading(false);
    }
  }, [selectedId, source]);

  useEffect(() => {
    fetchSelectedDocumentData();
  }, [fetchSelectedDocumentData]);

  useEffect(() => {
    setChunkQuery("");
    setSelectedChunkKey(null);
  }, [selectedChunks, selectedId]);

  const groupCounts = useMemo(() => {
    const groups = new Map<string, number>();
    documents.forEach((doc) => {
      const g = (doc.doc_type || "D").toUpperCase();
      groups.set(g, (groups.get(g) || 0) + 1);
    });
    return Array.from(groups.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 9);
  }, [documents]);

  const filteredChunks = useMemo(() => {
    const q = chunkQuery.trim().toLowerCase();
    if (!q) return selectedChunks;
    return selectedChunks.filter((chunk) =>
      [chunk.article_label, chunk.article_title, chunk.group_label, chunk.group_title, chunk.text_preview, chunk.text]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [chunkQuery, selectedChunks]);

  const activeChunk = useMemo(() => filteredChunks.find((chunk) => chunk.key === selectedChunkKey) || null, [filteredChunks, selectedChunkKey]);

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar
        items={[]}
        selectedItem="explorer"
        user={{ name: authUser?.name || "User", email: authUser?.email || "user@deputeti.ai" }}
      />

      <Box component="main" sx={{ flexGrow: 1, minHeight: "100vh" }}>
        <DashboardLayout
          header={<PageHeader breadcrumbItems={[{ label: "Law Assistant" }]} user={userForHeader} onLogout={logout} />}
        >
          <Box sx={{ px: { xs: 1, sm: 2 }, pb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.1, mb: 1 }}>
              <Button startIcon={<ArrowBackIcon />} size="small" onClick={() => router.push("/chat")}>
                Back to Chat
              </Button>
              <Typography sx={{ fontSize: "1rem", fontWeight: 600 }}>Explorer</Typography>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.65, mb: 1 }}>
              <Chip
                label={`All (${total.toLocaleString()})`}
                color="primary"
                variant="filled"
                size="small"
                sx={{ height: 26 }}
              />
              {groupCounts.map(([group, count]) => (
                <Chip key={group} label={`${group} (${count.toLocaleString()})`} size="small" sx={{ height: 26 }} />
              ))}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.65, mb: 1.1 }}>
              {DECADE_OPTIONS.map((label, idx) => (
                <Chip
                  key={label}
                  label={label}
                  size="small"
                  color={idx === 0 ? "primary" : "default"}
                  variant={idx === 0 ? "filled" : "outlined"}
                  sx={{ height: 24 }}
                />
              ))}
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 1.2, height: "calc(100dvh - 220px)" }}>
              <Paper sx={{ p: 1, borderRadius: 1.5, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.7, mb: 0.8 }}>
                  {SOURCE_OPTIONS.map((opt) => (
                    <Chip
                      key={opt.id}
                      label={opt.label}
                      size="small"
                      color={source === opt.id ? "primary" : "default"}
                      onClick={() => setSource(opt.id)}
                    />
                  ))}
                </Box>

                <TextField
                  size="small"
                  placeholder={`Search ${total.toLocaleString()} documents...`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 17, color: "hsl(var(--text-muted))" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ mb: 0.8 }}
                />

                <Typography sx={{ fontSize: "0.84rem", color: "hsl(var(--text-muted))", mb: 0.6 }}>
                  {total.toLocaleString()} documents
                </Typography>

                {loading ? (
                  <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
                    <CircularProgress size={26} />
                  </Box>
                ) : (
                  <Box sx={{ overflowY: "auto", minHeight: 0, display: "grid", gap: 0.7 }}>
                    {documents.map((doc) => (
                      <Box
                        key={doc.id}
                        onClick={() => setSelectedId(doc.id)}
                        sx={{
                          p: 0.9,
                          borderRadius: 1.5,
                          border: "1px solid hsl(var(--border-soft))",
                          bgcolor: selectedId === doc.id ? "hsl(var(--surface-muted))" : "hsl(var(--surface))",
                          cursor: "pointer",
                        }}
                      >
                        <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, lineHeight: 1.3 }}>{doc.title}</Typography>
                        <Typography sx={{ fontSize: "0.74rem", color: "hsl(var(--text-muted))", mt: 0.4 }}>
                          {doc.id} · {doc.date || "-"} · {doc.chunk_count} articles
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>

              <Paper sx={{ p: 1.2, borderRadius: 1.5, minHeight: 0, overflowY: "auto" }}>
                {selectedDoc ? (
                  <>
                    <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.25 }}>{selectedDoc.title}</Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))", mt: 0.5 }}>{selectedDoc.id}</Typography>
                    <Box sx={{ mt: 1.2, display: "flex", gap: 0.6 }}>
                      <Chip label="All Chapters" color="primary" size="small" />
                      <Chip label={`Chapter recital (${selectedChunks.length})`} size="small" />
                    </Box>
                    <TextField
                      size="small"
                      placeholder="Search articles..."
                      value={chunkQuery}
                      onChange={(e) => setChunkQuery(e.target.value)}
                      sx={{ mt: 1.1, mb: 1.1, width: "100%", maxWidth: 360 }}
                    />
                    <Divider sx={{ mb: 1.1 }} />
                    {detailLoading ? (
                      <Box sx={{ py: 5, display: "grid", placeItems: "center" }}>
                        <CircularProgress size={22} />
                      </Box>
                    ) : selectedChunks.length > 0 ? (
                      <Box>
                        <Paper sx={{ borderRadius: 1.2, overflow: "hidden", mb: 1 }}>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "110px 230px 1fr",
                              px: 1,
                              py: 0.7,
                              bgcolor: "hsl(var(--surface-muted))",
                            }}
                          >
                            <Typography sx={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))" }}>Article</Typography>
                            <Typography sx={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))" }}>Heading</Typography>
                            <Typography sx={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))" }}>Preview</Typography>
                          </Box>
                          <Box sx={{ maxHeight: 210, overflowY: "auto" }}>
                            {filteredChunks.map((chunk) => {
                              const selected = selectedChunkKey === chunk.key;
                              return (
                                <Box
                                  key={chunk.key}
                                  onClick={() => setSelectedChunkKey((prev) => (prev === chunk.key ? null : chunk.key))}
                                  sx={{
                                    display: "grid",
                                    gridTemplateColumns: "110px 230px 1fr",
                                    px: 1,
                                    py: 0.8,
                                    borderTop: "1px solid hsl(var(--border-soft))",
                                    cursor: "pointer",
                                    bgcolor: selected ? "hsl(var(--surface-muted))" : "hsl(var(--surface))",
                                  }}
                                >
                                  <Typography sx={{ fontSize: "0.82rem" }}>{chunk.article_label || chunk.group_label || "-"}</Typography>
                                  <Typography sx={{ fontSize: "0.82rem" }}>{chunk.article_title || chunk.group_title || "-"}</Typography>
                                  <Typography sx={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }} noWrap>
                                    {chunk.text_preview || chunk.text || "No preview"}
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Box>
                        </Paper>

                        {activeChunk ? (
                          <Paper sx={{ p: 1.1, borderRadius: 1.2 }}>
                            <Typography sx={{ fontSize: "1rem", fontWeight: 700, mb: 0.5 }}>
                              {activeChunk.article_title || activeChunk.group_title || activeChunk.article_label || "Selected section"}
                            </Typography>
                            <Typography sx={{ fontSize: "0.76rem", color: "hsl(var(--text-muted))", mb: 0.6 }}>
                              {activeChunk.article_label || activeChunk.group_label || selectedDoc.id}
                            </Typography>
                            <Typography sx={{ fontSize: "0.86rem", color: "hsl(var(--text-primary))", lineHeight: 1.65 }}>
                              {activeChunk.text || activeChunk.text_preview || "No text preview available."}
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<ContentCopyIcon sx={{ fontSize: 15 }} />}
                              sx={{ mt: 1 }}
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  `${activeChunk.article_label || activeChunk.group_label || ""}\n${
                                    activeChunk.article_title || activeChunk.group_title || ""
                                  }\n\n${activeChunk.text || activeChunk.text_preview || ""}`
                                )
                              }
                            >
                              Copy
                            </Button>
                          </Paper>
                        ) : null}
                      </Box>
                    ) : (
                      <>
                        <Typography sx={{ fontSize: "0.86rem", color: "hsl(var(--text-primary))", lineHeight: 1.65 }}>
                          {(selectedDocDetail?.subtitle as string) || selectedDoc.subtitle || "No preview text available for this document."}
                        </Typography>
                        <Typography sx={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", mt: 0.8 }}>
                          This document currently has no indexed chunk previews in the selected source.
                        </Typography>
                      </>
                    )}
                  </>
                ) : (
                  <Box sx={{ minHeight: 220, display: "grid", placeItems: "center" }}>
                    <Typography sx={{ fontSize: "0.92rem", color: "hsl(var(--text-muted))" }}>
                      Select a regulation to view its contents
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>
        </DashboardLayout>
      </Box>
    </Box>
  );
}
