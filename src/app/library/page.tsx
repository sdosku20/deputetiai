"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Sidebar } from "@/components/navigation/Sidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";

type SourceKey = "eu_law" | "albanian";

interface SourceFilter {
  key: SourceKey;
  label: string;
}

interface LibraryResult {
  id: string;
  source: SourceKey;
  title: string;
  subtitle: string;
  docType: string;
  date: string;
  score?: number;
}

const SOURCE_FILTERS: SourceFilter[] = [
  { key: "eu_law", label: "Ligji i BE-se" },
  { key: "albanian", label: "Ligji Shqiptar" },
];

export default function LibraryPage() {
  const { user: authUser, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LibraryResult[]>([]);
  const [selectedSources, setSelectedSources] = useState<SourceKey[]>(["eu_law", "albanian"]);
  const [totalCount, setTotalCount] = useState(0);

  const userForHeader = authUser
    ? {
        id: authUser.id || "",
        email: authUser.email || "",
      }
    : undefined;

  const fetchLibraryData = useCallback(async () => {
    if (selectedSources.length === 0) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    try {
      const jwtToken = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
      if (!jwtToken) {
        setResults([]);
        setTotalCount(0);
        return;
      }

      const isSearch = query.trim().length > 0;
      const requests = selectedSources.map(async (source) => {
        if (isSearch) {
          const response = await fetch(
            `/api/library?source=${encodeURIComponent(source)}&q=${encodeURIComponent(query.trim())}&limit=50`,
            { headers: { Authorization: `Bearer ${jwtToken}` } }
          );
          if (!response.ok) {
            throw new Error(`Search request failed: ${response.status}`);
          }
          const payload = (await response.json()) as { results: Array<Record<string, unknown>>; total: number };

          const mapped = (payload.results || []).map((item) => ({
            id: String(item.id || item.document_id || `${source}-${Math.random()}`),
            source,
            title: String(item.title || "Pa titull"),
            subtitle: String(item.text_preview || item.subtitle || ""),
            docType: String(item.doc_type || "Dokument"),
            date: "",
            score: typeof item.score === "number" ? Math.round(item.score) : undefined,
          }));

          return { total: payload.total || mapped.length, mapped };
        }

        const response = await fetch(`/api/library?source=${encodeURIComponent(source)}&page=1&page_size=50`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (!response.ok) {
          throw new Error(`Documents request failed: ${response.status}`);
        }
        const payload = (await response.json()) as { documents: Array<Record<string, unknown>>; total: number };
        const mapped = (payload.documents || []).map((item) => ({
          id: String(item.id || `${source}-${Math.random()}`),
          source,
          title: String(item.title || "Pa titull"),
          subtitle: String(item.subtitle || ""),
          docType: String(item.doc_type || "Dokument"),
          date: String(item.date || ""),
        }));
        return { total: payload.total || mapped.length, mapped };
      });

      const responses = await Promise.all(requests);
      const merged = responses.flatMap((r) => r.mapped);
      const mergedTotal = responses.reduce((acc, curr) => acc + curr.total, 0);
      setResults(merged);
      setTotalCount(mergedTotal);
    } catch (error) {
      console.error("Failed to load library results:", error);
      setResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [query, selectedSources]);

  useEffect(() => {
    const t = setTimeout(fetchLibraryData, 220);
    return () => clearTimeout(t);
  }, [fetchLibraryData]);

  useEffect(() => {
    const onTokenReady = () => {
      fetchLibraryData();
    };
    window.addEventListener("jwtTokenUpdated", onTokenReady);
    return () => window.removeEventListener("jwtTokenUpdated", onTokenReady);
  }, [fetchLibraryData]);

  const sourceCount = useMemo(
    () => ({
      eu_law: results.filter((r) => r.source === "eu_law").length,
      albanian: results.filter((r) => r.source === "albanian").length,
    }),
    [results]
  );

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar
        items={[]}
        selectedItem="library"
        user={{
          name: authUser?.name || "User",
          email: authUser?.email || "user@deputeti.ai",
        }}
      />

      <Box component="main" sx={{ flexGrow: 1, minHeight: "100vh" }}>
        <DashboardLayout
          header={<PageHeader breadcrumbItems={[{ label: "Biblioteka" }]} user={userForHeader} onLogout={logout} />}
        >
          <Box sx={{ px: { xs: 1, sm: 2 }, pb: 0 }}>
            <Box
              sx={{
                position: "relative",
                height: "calc(100dvh - 96px)",
                minHeight: "calc(100vh - 96px)",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: { xs: 0, md: 236 },
                  right: 0,
                }}
              >
              <TextField
                fullWidth
                placeholder="Kerko ne te gjitha bazat ligjore..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon sx={{ color: "hsl(var(--text-muted))" }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 999,
                    bgcolor: "hsl(var(--surface))",
                  },
                }}
              />
              </Box>

              <Paper
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  position: "absolute",
                  top: { xs: 72, md: 84 },
                  left: 0,
                  width: 220,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "hsl(var(--text-muted))",
                    mb: 0.8,
                  }}
                >
                  Burimet
                </Typography>
                {SOURCE_FILTERS.map((filter) => (
                  <FormControlLabel
                    key={filter.key}
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedSources.includes(filter.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSources((prev) => [...prev, filter.key]);
                          } else {
                            setSelectedSources((prev) => prev.filter((item) => item !== filter.key));
                          }
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: "0.86rem", color: "hsl(var(--text-primary))" }}>
                        {filter.label} ({sourceCount[filter.key]})
                      </Typography>
                    }
                  />
                ))}
              </Paper>

              <Box
                sx={{
                  position: "absolute",
                  top: { xs: 72, md: 84 },
                  left: { xs: 0, md: 236 },
                  right: 0,
                  bottom: 0,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Typography sx={{ fontSize: "0.84rem", color: "hsl(var(--text-muted))" }}>
                    {totalCount} rezultate
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1 }} />

                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 8, flex: 1 }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : (
                  <Box sx={{ display: "grid", gap: 1, overflowY: "auto", pr: 0.3, minHeight: 0, flex: 1 }}>
                    {results.map((item) => (
                      <Paper key={`${item.source}-${item.id}`} sx={{ p: 1.1, borderRadius: 1.8 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>{item.title}</Typography>
                            {item.subtitle ? (
                              <Typography sx={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))", mt: 0.3 }} noWrap>
                                {item.subtitle}
                              </Typography>
                            ) : null}
                            <Typography sx={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))", mt: 0.45 }}>
                              {item.docType}
                              {item.date ? ` · ${item.date}` : ""}
                              {item.source === "eu_law" ? " · EU" : " · AL"}
                            </Typography>
                          </Box>
                          {typeof item.score === "number" ? (
                            <Typography sx={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))" }}>{item.score}%</Typography>
                          ) : null}
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </DashboardLayout>
      </Box>
    </Box>
  );
}
