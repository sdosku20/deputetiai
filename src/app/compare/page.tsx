"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Autocomplete,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Sidebar } from "@/components/navigation/Sidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";

type CompareTab = "cross" | "amendment" | "replacement";
type SourceId = "eu_law" | "albania" | "rks";

type HistoryItem = {
  id: number;
  comparison_type?: string;
  title?: string;
  source_a?: string;
  source_b?: string;
  overall_alignment?: number;
  created_at?: string;
};

type ReportSection = {
  theme?: string;
  side_a?: { summary?: string; key_provisions?: string[] };
  side_b?: { summary?: string; key_provisions?: string[] };
  differences?: string;
  alignment_score?: number;
};

type ReportEnvelope = {
  report?: { title?: string; summary?: string; sections?: ReportSection[] };
  cached?: boolean;
  created_at?: string;
  source_a?: string;
  source_b?: string;
  error?: string;
};

type LawSearchResult = {
  id: string;
  title?: string;
  ref?: string;
  doc_type?: string;
  date?: string;
  in_force?: boolean;
};

const SOURCE_OPTIONS: Array<{ id: SourceId; label: string }> = [
  { id: "eu_law", label: "EU Law" },
  { id: "albania", label: "Albanian Law" },
  { id: "rks", label: "Kosovo Law (RKS)" },
];

function sourceLabel(id?: string): string {
  if (!id) return "Law";
  return SOURCE_OPTIONS.find((s) => s.id === id)?.label || id;
}

function formatDate(value?: string): string {
  if (!value) return "-";
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return value;
  }
}

function scorePercent(v?: number): string {
  if (typeof v !== "number") return "-";
  return `${Math.round(v * 100)}%`;
}

function normalizeDocRef(value: string): string {
  return value.trim().slice(0, 200);
}

function pickDocRefFromOption(option: LawSearchResult, source: SourceId): string {
  // Compare backend expects numeric/internal IDs for albanian/rks datasets.
  if (source === "albania" || source === "rks") {
    return normalizeDocRef(option.id || option.ref || "");
  }
  // EU dataset works with CELEX-like refs.
  return normalizeDocRef(option.ref || option.id || "");
}

function previewLabelFromOption(option: LawSearchResult): string {
  const base = (option.title || option.ref || option.id || "").trim();
  if (!base) return "";
  const words = base.split(/\s+/).filter(Boolean);
  if (words.length <= 10) return base;
  return `${words.slice(0, 10).join(" ")}...`;
}

function scoreTone(v?: number): { bg: string; fg: string } {
  if (typeof v !== "number") {
    return { bg: "hsl(var(--surface-muted))", fg: "hsl(var(--text-muted))" };
  }
  const pct = Math.round(v * 100);
  if (pct >= 70) {
    return { bg: "#d8f5de", fg: "#1f8f43" };
  }
  if (pct >= 40) {
    return { bg: "#fff2cc", fg: "#9a6700" };
  }
  return { bg: "#ffe1e1", fg: "#c03636" };
}

export default function ComparePage() {
  const { user: authUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<CompareTab>("cross");

  const [sourceA, setSourceA] = useState<SourceId>("eu_law");
  const [sourceB, setSourceB] = useState<SourceId>("eu_law");
  const [docARef, setDocARef] = useState("");
  const [docBRef, setDocBRef] = useState("");
  const [focus, setFocus] = useState("");
  const [docAResolvedRef, setDocAResolvedRef] = useState<string | null>(null);
  const [docBResolvedRef, setDocBResolvedRef] = useState<string | null>(null);

  const [singleSource, setSingleSource] = useState<SourceId>("eu_law");
  const [singleDocRef, setSingleDocRef] = useState("");
  const [singleResolvedRef, setSingleResolvedRef] = useState<string | null>(null);

  const [lawOptionsA, setLawOptionsA] = useState<LawSearchResult[]>([]);
  const [lawOptionsB, setLawOptionsB] = useState<LawSearchResult[]>([]);
  const [lawOptionsSingle, setLawOptionsSingle] = useState<LawSearchResult[]>([]);
  const [lawLoadingA, setLawLoadingA] = useState(false);
  const [lawLoadingB, setLawLoadingB] = useState(false);
  const [lawLoadingSingle, setLawLoadingSingle] = useState(false);

  const [loadingRun, setLoadingRun] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [runError, setRunError] = useState<string | null>(null);
  const [currentReport, setCurrentReport] = useState<ReportEnvelope | null>(null);
  const [currentExpanded, setCurrentExpanded] = useState<string | false>(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [openHistoryId, setOpenHistoryId] = useState<number | null>(null);
  const [historyReports, setHistoryReports] = useState<Record<number, ReportEnvelope>>({});
  const [historyExpanded, setHistoryExpanded] = useState<Record<number, string | false>>({});

  const userForHeader = authUser ? { id: authUser.id || "", email: authUser.email || "" } : undefined;

  const ensureJwtToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    const existing = localStorage.getItem("jwt_token");
    if (existing) return existing;
    try {
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "michael", password: "IUsedToBeAStrongPass__" }),
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
  }, []);

  const authedFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const token = await ensureJwtToken();
      if (!token) throw new Error("Missing JWT token.");
      return fetch(url, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(init?.headers || {}),
        },
      });
    },
    [ensureJwtToken]
  );

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await authedFetch("/api/compare?action=history");
      const payload = (await response.json()) as HistoryItem[] | { detail?: string };
      if (!response.ok) {
        throw new Error((payload as { detail?: string }).detail || "Failed to load history.");
      }
      setHistory(Array.isArray(payload) ? payload : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const onTokenReady = () => loadHistory();
    window.addEventListener("jwtTokenUpdated", onTokenReady);
    return () => window.removeEventListener("jwtTokenUpdated", onTokenReady);
  }, [loadHistory]);

  const runComparison = useCallback(
    async (action: "cross" | "amendment" | "replacement", body: Record<string, unknown>) => {
      setLoadingRun(true);
      setLoadingSeconds(0);
      setRunError(null);
      try {
        const response = await authedFetch(`/api/compare?action=${action}`, {
          method: "POST",
          body: JSON.stringify(body),
        });
        const payload = (await response.json()) as ReportEnvelope & { detail?: string };
        if (!response.ok) throw new Error(payload.detail || "Compare request failed.");
        if (!payload.report) {
          throw new Error(payload.error || payload.detail || "No comparison report was returned by backend.");
        }
        setCurrentReport(payload);
        setCurrentExpanded(false);
        await loadHistory();
      } catch (error: unknown) {
        setRunError(error instanceof Error ? error.message : "Compare request failed.");
      } finally {
        setLoadingRun(false);
      }
    },
    [authedFetch, loadHistory]
  );

  useEffect(() => {
    if (!loadingRun) return;
    const timer = setInterval(() => {
      setLoadingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [loadingRun]);

  const searchLaws = useCallback(
    async (query: string, source: SourceId): Promise<LawSearchResult[]> => {
      const q = query.trim().slice(0, 180);
      if (q.length < 2) return [];
      const response = await authedFetch(
        `/api/compare?action=search-laws&q=${encodeURIComponent(q)}&source=${encodeURIComponent(source)}&limit=8`
      );
      const payload = (await response.json()) as { results?: LawSearchResult[]; detail?: string };
      if (!response.ok) throw new Error(payload.detail || "Search failed.");
      return Array.isArray(payload.results) ? payload.results : [];
    },
    [authedFetch]
  );

  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (activeTab !== "cross" || docARef.trim().length < 2) {
        if (active) setLawOptionsA([]);
        return;
      }
      setLawLoadingA(true);
      try {
        const results = await searchLaws(docARef, sourceA);
        if (active) setLawOptionsA(results);
      } catch {
        if (active) setLawOptionsA([]);
      } finally {
        if (active) setLawLoadingA(false);
      }
    }, 220);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [activeTab, docARef, searchLaws, sourceA]);

  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (activeTab !== "cross" || docBRef.trim().length < 2) {
        if (active) setLawOptionsB([]);
        return;
      }
      setLawLoadingB(true);
      try {
        const results = await searchLaws(docBRef, sourceB);
        if (active) setLawOptionsB(results);
      } catch {
        if (active) setLawOptionsB([]);
      } finally {
        if (active) setLawLoadingB(false);
      }
    }, 220);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [activeTab, docBRef, searchLaws, sourceB]);

  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (activeTab === "cross" || singleDocRef.trim().length < 2) {
        if (active) setLawOptionsSingle([]);
        return;
      }
      setLawLoadingSingle(true);
      try {
        const results = await searchLaws(singleDocRef, singleSource);
        if (active) setLawOptionsSingle(results);
      } catch {
        if (active) setLawOptionsSingle([]);
      } finally {
        if (active) setLawLoadingSingle(false);
      }
    }, 220);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [activeTab, searchLaws, singleDocRef, singleSource]);

  const openHistoryItem = useCallback(
    async (id: number) => {
      if (openHistoryId === id) {
        setOpenHistoryId(null);
        return;
      }
      setOpenHistoryId(id);
      if (historyReports[id]) return;
      try {
        const response = await authedFetch(`/api/compare?action=report&report_id=${id}`);
        const payload = (await response.json()) as ReportEnvelope & { detail?: string };
        if (!response.ok) throw new Error(payload.detail || "Failed to load report.");
        setHistoryReports((prev) => ({ ...prev, [id]: payload }));
      } catch {
        setHistoryReports((prev) => ({
          ...prev,
          [id]: { report: { title: "Failed to load report", summary: "Please try again." } },
        }));
      }
    },
    [authedFetch, historyReports, openHistoryId]
  );

  const renderReport = (
    envelope: ReportEnvelope,
    expanded: string | false,
    onChangeExpanded: (next: string | false) => void
  ) => {
    const report = envelope.report;
    const sections = report?.sections || [];
    if (!report) return null;

    return (
      <Box sx={{ mb: 1.3 }}>
        <Paper sx={{ p: 1.8, borderRadius: 1.6, mb: 1.1 }}>
          <Typography sx={{ fontSize: "1.7rem", fontWeight: 700, lineHeight: 1.25, mb: 0.85 }}>{report.title || "Comparison Report"}</Typography>
          <Typography sx={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))", lineHeight: 1.6 }}>{report.summary || "No summary provided."}</Typography>
          <Box sx={{ mt: 1.1, display: "flex", alignItems: "center", gap: 1 }}>
            {envelope.cached ? <Chip label="Cached" size="small" sx={{ bgcolor: "#d8f5de", color: "#1f8f43", fontWeight: 600 }} /> : null}
            <Typography sx={{ fontSize: "0.84rem", color: "hsl(var(--text-muted))" }}>
              {envelope.created_at ? `Created (${formatDate(envelope.created_at)})` : ""}
            </Typography>
          </Box>
        </Paper>

        {sections.map((section, idx) => {
          const title = section.theme || `Section ${idx + 1}`;
          const sectionTone = scoreTone(section.alignment_score);
          return (
            <Accordion
              key={`${title}-${idx}`}
              expanded={expanded === title}
              onChange={(_, isExpanded) => onChangeExpanded(isExpanded ? title : false)}
              sx={{ borderRadius: "10px !important", mb: 0.8, "&:before": { display: "none" } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", pr: 1.5 }}>
                  <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
                  <Typography sx={{ color: sectionTone.fg, fontWeight: 600 }}>{scorePercent(section.alignment_score)}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.2 }}>
                  <Paper variant="outlined" sx={{ p: 1.2 }}>
                    <Typography sx={{ color: "hsl(var(--primary))", fontWeight: 700, mb: 0.5 }}>{sourceLabel(envelope.source_a)}</Typography>
                    <Typography sx={{ fontSize: "0.92rem", color: "hsl(var(--text-muted))" }}>{section.side_a?.summary || "No details."}</Typography>
                    {(section.side_a?.key_provisions || []).length > 0 ? (
                      <Typography component="ul" sx={{ mt: 0.6, mb: 0, pl: 2.2, fontSize: "0.85rem", color: "hsl(var(--text-muted))" }}>
                        {section.side_a?.key_provisions?.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
                      </Typography>
                    ) : null}
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 1.2 }}>
                    <Typography sx={{ color: "hsl(var(--primary))", fontWeight: 700, mb: 0.5 }}>{sourceLabel(envelope.source_b)}</Typography>
                    <Typography sx={{ fontSize: "0.92rem", color: "hsl(var(--text-muted))" }}>{section.side_b?.summary || "No details."}</Typography>
                    {(section.side_b?.key_provisions || []).length > 0 ? (
                      <Typography component="ul" sx={{ mt: 0.6, mb: 0, pl: 2.2, fontSize: "0.85rem", color: "hsl(var(--text-muted))" }}>
                        {section.side_b?.key_provisions?.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
                      </Typography>
                    ) : null}
                  </Paper>
                </Box>
                <Paper variant="outlined" sx={{ mt: 1, p: 1 }}>
                  <Typography sx={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))" }}>
                    <strong>Key Differences:</strong> {section.differences || "No differences text provided."}
                  </Typography>
                </Paper>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar
        items={[]}
        selectedItem="compare"
        user={{ name: authUser?.name || "User", email: authUser?.email || "user@deputeti.ai" }}
      />

      <Box component="main" sx={{ flexGrow: 1, minHeight: "100vh" }}>
        <DashboardLayout header={<PageHeader breadcrumbItems={[{ label: "Asistenti Ligjor" }]} user={userForHeader} onLogout={logout} />}>
          <Box sx={{ px: { xs: 1, sm: 2 }, pb: 2 }}>
            <Typography sx={{ fontSize: "2rem", fontWeight: 700, mb: 1.7 }}>Law Comparison</Typography>

            <Paper sx={{ p: 0.6, borderRadius: 1.8, mb: 1.5 }}>
              <Tabs value={activeTab} onChange={(_, value: CompareTab) => setActiveTab(value)} variant="fullWidth" sx={{ minHeight: 42, "& .MuiTabs-indicator": { display: "none" } }}>
                {[
                  { label: "Cross-Jurisdiction", value: "cross" },
                  { label: "Amendment Diff", value: "amendment" },
                  { label: "Replacement", value: "replacement" },
                ].map((item) => (
                  <Tab
                    key={item.value}
                    label={item.label}
                    value={item.value}
                    sx={{
                      minHeight: 38,
                      borderRadius: 1.2,
                      textTransform: "none",
                      fontWeight: 500,
                      color: "hsl(var(--text-muted))",
                      "&.Mui-selected": { bgcolor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" },
                    }}
                  />
                ))}
              </Tabs>
            </Paper>

            {activeTab === "cross" && (
              <Box sx={{ mb: 2.2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.2 }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", fontWeight: 600, mb: 0.4 }}>SIDE A - LAW</Typography>
                    <TextField select fullWidth size="small" value={sourceA} onChange={(e) => setSourceA(e.target.value as SourceId)}>
                      {SOURCE_OPTIONS.map((option) => <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>)}
                    </TextField>
                    <Autocomplete
                      freeSolo
                      options={lawOptionsA}
                      loading={lawLoadingA}
                      filterOptions={(x) => x}
                      inputValue={docARef}
                      onInputChange={(_, value, reason) => {
                        if (reason === "input" || reason === "clear") {
                          setDocARef(normalizeDocRef(value));
                          setDocAResolvedRef(null);
                        }
                      }}
                      onChange={(_, value) => {
                        if (typeof value === "string") {
                          setDocARef(normalizeDocRef(value));
                          setDocAResolvedRef(null);
                        } else if (value) {
                          setDocARef(previewLabelFromOption(value));
                          setDocAResolvedRef(pickDocRefFromOption(value, sourceA));
                        }
                      }}
                      getOptionLabel={(option) => (typeof option === "string" ? option : option.title || option.ref || option.id)}
                      renderOption={(props, option) => {
                        const { key, ...optionProps } = props;
                        return (
                        <Box key={key} component="li" {...optionProps} sx={{ display: "block !important", py: "10px !important" }}>
                          <Typography
                            sx={{
                              fontSize: "1rem",
                              color: "hsl(var(--text-primary))",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              lineHeight: 1.35,
                            }}
                          >
                            {option.title || option.ref || option.id}
                          </Typography>
                          <Typography sx={{ fontSize: "0.84rem", color: "hsl(var(--text-muted))" }}>
                            {option.ref || option.id} · {option.doc_type || "doc"} {option.date ? `· ${option.date}` : ""}
                          </Typography>
                        </Box>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField {...params} size="small" fullWidth placeholder="Search by name or number..." sx={{ mt: 0.75 }} />
                      )}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", fontWeight: 600, mb: 0.4 }}>SIDE B - LAW</Typography>
                    <TextField select fullWidth size="small" value={sourceB} onChange={(e) => setSourceB(e.target.value as SourceId)}>
                      {SOURCE_OPTIONS.map((option) => <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>)}
                    </TextField>
                    <Autocomplete
                      freeSolo
                      options={lawOptionsB}
                      loading={lawLoadingB}
                      filterOptions={(x) => x}
                      inputValue={docBRef}
                      onInputChange={(_, value, reason) => {
                        if (reason === "input" || reason === "clear") {
                          setDocBRef(normalizeDocRef(value));
                          setDocBResolvedRef(null);
                        }
                      }}
                      onChange={(_, value) => {
                        if (typeof value === "string") {
                          setDocBRef(normalizeDocRef(value));
                          setDocBResolvedRef(null);
                        } else if (value) {
                          setDocBRef(previewLabelFromOption(value));
                          setDocBResolvedRef(pickDocRefFromOption(value, sourceB));
                        }
                      }}
                      getOptionLabel={(option) => (typeof option === "string" ? option : option.title || option.ref || option.id)}
                      renderOption={(props, option) => {
                        const { key, ...optionProps } = props;
                        return (
                        <Box key={key} component="li" {...optionProps} sx={{ display: "block !important", py: "10px !important" }}>
                          <Typography
                            sx={{
                              fontSize: "1rem",
                              color: "hsl(var(--text-primary))",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              lineHeight: 1.35,
                            }}
                          >
                            {option.title || option.ref || option.id}
                          </Typography>
                          <Typography sx={{ fontSize: "0.84rem", color: "hsl(var(--text-muted))" }}>
                            {option.ref || option.id} · {option.doc_type || "doc"} {option.date ? `· ${option.date}` : ""}
                          </Typography>
                        </Box>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField {...params} size="small" fullWidth placeholder="Search by name or number..." sx={{ mt: 0.75 }} />
                      )}
                    />
                  </Box>
                </Box>
                <Box sx={{ mt: 1.4, display: "grid", gridTemplateColumns: "1fr auto", gap: 1, alignItems: "end" }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", fontWeight: 600, mb: 0.4 }}>FOCUS (OPTIONAL)</Typography>
                    <TextField fullWidth size="small" placeholder="e.g., data subject rights, penalties" value={focus} onChange={(e) => setFocus(e.target.value)} />
                  </Box>
                  <Button
                    variant="contained"
                    onClick={() =>
                      runComparison("cross", {
                        doc_a_ref: docAResolvedRef || normalizeDocRef(docARef),
                        doc_b_ref: docBResolvedRef || normalizeDocRef(docBRef),
                        source_a: sourceA,
                        source_b: sourceB,
                        focus: focus.trim(),
                      })
                    }
                    disabled={loadingRun || !docARef.trim() || !docBRef.trim()}
                    sx={{ minWidth: 120, height: 38, borderRadius: 1.2, textTransform: "none", fontWeight: 600 }}
                  >
                    {loadingRun ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.9 }}>
                        <CircularProgress size={15} sx={{ color: "hsl(var(--primary-foreground))" }} />
                        Duke krahasuar...
                      </Box>
                    ) : (
                      "Compare"
                    )}
                  </Button>
                </Box>
              </Box>
            )}

            {activeTab !== "cross" && (
              <Box sx={{ mb: 2.2, display: "grid", gridTemplateColumns: "260px 1fr auto", gap: 1, alignItems: "end" }}>
                <Box>
                  <Typography sx={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", fontWeight: 600, mb: 0.4 }}>JURISDICTION</Typography>
                  <TextField select fullWidth size="small" value={singleSource} onChange={(e) => setSingleSource(e.target.value as SourceId)}>
                    {SOURCE_OPTIONS.map((option) => <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>)}
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", fontWeight: 600, mb: 0.4 }}>
                    {activeTab === "amendment" ? "DOCUMENT REFERENCE (CELEX / LAW NO.)" : "REPEALED DOCUMENT REFERENCE"}
                  </Typography>
                  <Autocomplete
                    freeSolo
                    options={lawOptionsSingle}
                    loading={lawLoadingSingle}
                    filterOptions={(x) => x}
                    inputValue={singleDocRef}
                    onInputChange={(_, value, reason) => {
                      if (reason === "input" || reason === "clear") {
                        setSingleDocRef(normalizeDocRef(value));
                        setSingleResolvedRef(null);
                      }
                    }}
                    onChange={(_, value) => {
                      if (typeof value === "string") {
                        setSingleDocRef(normalizeDocRef(value));
                        setSingleResolvedRef(null);
                      } else if (value) {
                        setSingleDocRef(previewLabelFromOption(value));
                        setSingleResolvedRef(pickDocRefFromOption(value, singleSource));
                      }
                    }}
                    getOptionLabel={(option) => (typeof option === "string" ? option : option.title || option.ref || option.id)}
                    renderOption={(props, option) => {
                      const { key, ...optionProps } = props;
                      return (
                      <Box key={key} component="li" {...optionProps} sx={{ display: "block !important", py: "10px !important" }}>
                        <Typography
                          sx={{
                            fontSize: "1rem",
                            color: "hsl(var(--text-primary))",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: 1.35,
                          }}
                        >
                          {option.title || option.ref || option.id}
                        </Typography>
                        <Typography sx={{ fontSize: "0.84rem", color: "hsl(var(--text-muted))" }}>
                          {option.ref || option.id} · {option.doc_type || "doc"} {option.date ? `· ${option.date}` : ""}
                        </Typography>
                      </Box>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size="small"
                        placeholder={activeTab === "amendment" ? "e.g., 32016R0679 or Law No. 7961" : "e.g., 31995L0046"}
                      />
                    )}
                  />
                </Box>
                <Button
                  variant="contained"
                  onClick={() =>
                    runComparison(activeTab === "amendment" ? "amendment" : "replacement", {
                      doc_ref: singleResolvedRef || normalizeDocRef(singleDocRef),
                      source: singleSource,
                    })
                  }
                  disabled={loadingRun || !singleDocRef.trim()}
                  sx={{ minWidth: 160, height: 38, borderRadius: 1.2, textTransform: "none", fontWeight: 600 }}
                >
                  {loadingRun ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.9 }}>
                      <CircularProgress size={15} sx={{ color: "hsl(var(--primary-foreground))" }} />
                      Duke ngarkuar...
                    </Box>
                  ) : activeTab === "amendment" ? (
                    "Find Amendments"
                  ) : (
                    "Find Replacement"
                  )}
                </Button>
              </Box>
            )}

            {loadingRun && (
              <Paper
                sx={{
                  mb: 1.2,
                  p: 2.2,
                  borderRadius: 1.6,
                  display: "grid",
                  placeItems: "center",
                  gap: 1.1,
                  textAlign: "center",
                }}
              >
                <CircularProgress size={30} />
                <Typography sx={{ fontSize: "1.02rem", fontWeight: 600, color: "hsl(var(--text-primary))" }}>
                  Generating comparison report...
                </Typography>
                <Typography sx={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))" }}>
                  This may take 30-60 seconds for larger laws
                </Typography>
              </Paper>
            )}
            {runError && <Typography sx={{ mb: 1.2, color: "hsl(var(--text-muted))" }}>{runError}</Typography>}
            {currentReport ? renderReport(currentReport, currentExpanded, setCurrentExpanded) : null}

            <Typography sx={{ fontSize: "1rem", fontWeight: 600, mb: 0.75 }}>Past Comparisons</Typography>
            {historyLoading ? (
              <Box sx={{ py: 2, display: "grid", placeItems: "center" }}><CircularProgress size={20} /></Box>
            ) : (
              <Box sx={{ display: "grid", gap: 0.8 }}>
                {history.map((item) => (
                  <Box key={item.id}>
                    {(() => {
                      const historyTone = scoreTone(item.overall_alignment);
                      return (
                    <Paper
                      component="button"
                      type="button"
                      onClick={() => openHistoryItem(item.id)}
                      sx={{
                        p: 1.25,
                        borderRadius: 1.4,
                        width: "100%",
                        border: "1px solid hsl(var(--border-soft))",
                        textAlign: "left",
                        bgcolor: "hsl(var(--surface))",
                        cursor: "pointer",
                        transition: "background-color 150ms ease, border-color 150ms ease",
                        "&:hover": { bgcolor: "hsl(var(--surface-muted))", borderColor: "hsl(var(--text-muted))" },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.4 }}>
                        <Box>
                          <Typography sx={{ fontSize: "1rem", fontWeight: 600, mb: 0.35 }}>{item.title || `Comparison #${item.id}`}</Typography>
                          <Box sx={{ display: "flex", gap: 1.1, alignItems: "center", color: "hsl(var(--text-muted))", fontSize: "0.85rem" }}>
                            <Typography sx={{ fontSize: "0.85rem" }}>{sourceLabel(item.source_a)} vs {sourceLabel(item.source_b)}</Typography>
                            <Chip label={scorePercent(item.overall_alignment)} size="small" sx={{ bgcolor: historyTone.bg, color: historyTone.fg, fontWeight: 600, height: 22 }} />
                            <Typography sx={{ fontSize: "0.85rem" }}>{formatDate(item.created_at)}</Typography>
                          </Box>
                        </Box>
                        <ExpandMoreIcon sx={{ color: "hsl(var(--text-muted))", transform: openHistoryId === item.id ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 180ms ease" }} />
                      </Box>
                    </Paper>
                      );
                    })()}
                    {openHistoryId === item.id && historyReports[item.id] ? (
                      <Box sx={{ mt: 0.9 }}>
                        {renderReport(historyReports[item.id], historyExpanded[item.id] || false, (next) =>
                          setHistoryExpanded((prev) => ({ ...prev, [item.id]: next }))
                        )}
                      </Box>
                    ) : null}
                  </Box>
                ))}
                {history.length === 0 ? (
                  <Paper sx={{ p: 1.2, borderRadius: 1.2 }}>
                    <Typography sx={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem" }}>No comparisons yet.</Typography>
                  </Paper>
                ) : null}
              </Box>
            )}
          </Box>
        </DashboardLayout>
      </Box>
    </Box>
  );
}
