"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import Fab from "@mui/material/Fab";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import CssBaseline from "@mui/material/CssBaseline";
import Drawer from "@mui/material/Drawer";
import useMediaQuery from "@mui/material/useMediaQuery";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentSession } from "@/hooks/useAgentSession";
import { Sidebar } from "@/components/navigation/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { NavigationItem } from "@/types/dashboard";

// ===== MUI theme forcing Space Grotesk =====
const theme = createTheme({
  typography: {
    fontFamily: "'Space Grotesk', sans-serif",
  },
});

function ChatPageContent() {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");

  const [displayMessages, setDisplayMessages] = useState([
    { id: 1, text: "Hello! How can I help you today?", fromUser: false },
  ]);
  const [input, setInput] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();
  const { user: authUser, logout } = useAuth();

  // Responsive breakpoints
  const isMobile = useMediaQuery('(max-width:768px)');

  // ChatGPT-style session management:
  // - If URL has session param, use it (viewing existing conversation)
  // - If no session param, we're in "new chat" mode (sessionId = null)
  // - Session ID is created only when first message is sent
  const sessionId = React.useMemo(() => {
    return sessionParam || null; // null means "new conversation not yet started"
  }, [sessionParam]);
  
  const { messages: agentMessages, loading, sendMessage } = useAgentSession(sessionId);

  // Build navigation items (empty for now - no dashboard needed)
  const navigationItems = useMemo<NavigationItem[]>(() => [], []);

  // Format user for PageHeader
  const userForHeader = authUser ? {
    id: authUser.id || '',
    email: authUser.email || '',
  } : undefined;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  // Sync agent messages to display messages
  // This ensures displayMessages always reflects the backend state
  useEffect(() => {
    // Convert all agent messages to display format (no welcome message in the list)
    const converted = agentMessages.map((msg, idx) => ({
      id: idx + 1,
      text: msg.content,
      fromUser: msg.role === "user",
    }));
    
    // Always update to ensure we show the latest messages
    setDisplayMessages(converted);
  }, [agentMessages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessageText = input.trim();
    setInput("");

    // ChatGPT-style behavior: Create session ID on first message
    let activeSessionId = sessionId;
    let isNewConversation = false;
    
    if (!activeSessionId) {
      // First message in new conversation - generate session ID now
      activeSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      isNewConversation = true;
    }

    // Send message with the session ID (new or existing)
    const response = await sendMessage(userMessageText, activeSessionId);

    // Update URL only after successful send for new conversations
    if (isNewConversation && response?.success) {
      router.replace(`/chat?session=${activeSessionId}`, { scroll: false });
    }

    // ChatGPT behavior: Refresh sidebar after ANY successful message
    if (response?.success) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('conversationCreated'));
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSend();
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ display: "flex" }}>
        {/* Desktop Sidebar */}
        {!isMobile && <Sidebar items={navigationItems} selectedItem="chat" user={{
          name: authUser?.name || "User",
          email: authUser?.email || "user@deputeti.ai",
        }} />}
        
        {/* Mobile Drawer */}
        {isMobile && (
          <Drawer
            anchor="left"
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            sx={{
              '& .MuiDrawer-paper': {
                width: 240,
              },
            }}
          >
            <Sidebar items={navigationItems} selectedItem="chat" user={{
              name: authUser?.name || "User",
              email: authUser?.email || "user@deputeti.ai",
            }} />
          </Drawer>
        )}
        
        <main
          style={{
            flexGrow: 1,
            minHeight: "100vh",
            overflow: "auto",
            backgroundColor: "#F5F4F1",
            width: isMobile ? "100%" : "auto",
          }}
        >
          <DashboardLayout
            header={
              <PageHeader
                breadcrumbItems={[{ label: "AI Insights" }]}
                user={userForHeader}
                onLogout={handleLogout}
              />
            }
          >
            {/* Mobile Menu Button */}
            {isMobile && (
              <Box
                sx={{
                  position: "fixed",
                  top: 16,
                  left: 16,
                  zIndex: 1100,
                }}
              >
                <IconButton
                  onClick={() => setMobileMenuOpen(true)}
                  sx={{
                    bgcolor: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    "&:hover": {
                      bgcolor: "#f5f5f5",
                    },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            )}

            <Box
              sx={{
                height: {
                  xs: "calc(100vh - 60px)",
                  sm: "calc(100vh - 70px)",
                  md: "calc(100vh - 80px)",
                },
                display: "flex",
                flexDirection: "column",
                bgcolor: "#f5f4f1",
              }}
            >
              {/* Chat area */}
              <Box
                aria-busy={loading}
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1.5, sm: 2 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  alignItems: "center",
                  fontFamily: "'Space Grotesk', sans-serif",
                  mt: isMobile ? 7 : 0, // Add margin top for mobile menu button
                }}
              >
                <Box sx={{ 
                  width: "100%", 
                  maxWidth: { xs: "100%", sm: 600, md: 770 },
                  display: "flex", 
                  flexDirection: "column", 
                  gap: { xs: 1.5, sm: 2 }
                }}>
                  {displayMessages.map((msg) => (
                    <Box
                      key={msg.id}
                      sx={{
                        alignSelf: msg.fromUser ? "flex-end" : "flex-start",
                        bgcolor: msg.fromUser ? "#e5e7eb" : "transparent",
                        color: "#111",
                        p: msg.fromUser ? { xs: 1.25, sm: 1.5 } : 0,
                        borderRadius: msg.fromUser ? { xs: 16, sm: 20 } : 0,
                        maxWidth: msg.fromUser ? { xs: "85%", sm: "fit-content" } : "100%",
                        boxShadow: msg.fromUser ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                        fontSize: { xs: "0.9375rem", sm: "1rem" },
                        fontFamily: "'Space Grotesk', sans-serif",
                        wordBreak: "break-word",
                        "& h1, & h2, & h3, & h4, & h5, & h6": {
                          fontSize: "inherit",
                          fontWeight: 600,
                          marginTop: "0.5em",
                          marginBottom: "0.5em",
                        },
                        "& p": {
                          marginTop: "0.5em",
                          marginBottom: "0.5em",
                        },
                        "& strong": {
                          fontWeight: 600,
                        },
                        "& em": {
                          fontStyle: "italic",
                        },
                        "& ul, & ol": {
                          marginLeft: "1.25em",
                          marginTop: "0.5em",
                          marginBottom: "0.5em",
                        },
                        "& code": {
                          backgroundColor: "rgba(0,0,0,0.05)",
                          padding: "0.125em 0.25em",
                          borderRadius: "0.25em",
                          fontFamily: "'Courier New', monospace",
                          fontSize: "0.9em",
                        },
                      }}
                    >
                      {msg.fromUser ? (
                        msg.text
                      ) : (
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p style={{ margin: "0.5em 0" }}>{children}</p>,
                            strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                            em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      )}
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Box>
              </Box>

              {/* Welcome Message - Only show when no messages, positioned at bottom center */}
              {displayMessages.length === 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    px: { xs: 2, sm: 3 },
                    pb: { xs: 2, sm: 3 },
                    mt: "auto",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
                      fontWeight: 400,
                      color: "#000000",
                      fontFamily: "'Space Grotesk', sans-serif",
                      textAlign: "center",
                    }}
                  >
                    Hello! How can I help you today?
                  </Typography>
                </Box>
              )}

              {/* Input */}
              <Box
                component="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!loading) handleSend();
                }}
                sx={{
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 2, sm: 3 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    maxWidth: { xs: "100%", sm: 600, md: 771 },
                    display: "flex",
                    alignItems: "flex-end",
                    gap: { xs: 0.5, sm: 1 },
                    borderRadius: { xs: 5, sm: 7 },
                    bgcolor: "#ffffff",
                    border: "1px solid #dbdbdbff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    px: { xs: 1, sm: 1.25 },
                    py: { xs: 0.75, sm: 0.85 },
                  }}
                >
                  <TextField
                    multiline
                    minRows={1}
                    maxRows={isMobile ? 4 : 6}
                    placeholder="Ask a question..."
                    variant="standard"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      pl: 1,
                      '& .MuiInputBase-root': {
                        bgcolor: "transparent",
                        alignItems: "flex-end",
                      },
                      '& .MuiInputBase-input': {
                        px: 0,
                        py: 0,
                        fontSize: { xs: '0.92rem', sm: '0.95rem' },
                        lineHeight: 1.5,
                        color: '#111',
                        fontFamily: "'Space Grotesk', sans-serif",
                      },
                    }}
                    InputProps={{ disableUnderline: true }}
                  />

                  <IconButton
                    type="submit"
                    disabled={!input.trim() || loading}
                    sx={{
                      alignSelf: "flex-end",
                      borderRadius: "50%",
                      p: { xs: 0.75, sm: 0.9 },
                      transition: "all 0.2s ease",
                      bgcolor: input.trim() ? "black" : "#9ca3af",
                      color: "white",
                      "&.Mui-disabled": {
                        bgcolor: "#9ca3af",
                        color: "white",
                        opacity: 1,
                        cursor: "not-allowed",
                        border: "none",
                        boxShadow: "none",
                      },
                      ":hover": { bgcolor: input.trim() ? "#111" : "#9ca3af" },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={isMobile ? 16 : 18} thickness={5} sx={{ color: "white" }} />
                    ) : (
                      <SendIcon sx={{ fontSize: { xs: "1.15rem", sm: "1.3rem" } }} />
                    )}
                  </IconButton>
                </Paper>
              </Box>
            </Box>
          </DashboardLayout>
        </main>

        {/* Mobile quick logout / clear chats button */}
        {isMobile && (
          <Box
            sx={{
              position: "fixed",
              bottom: 16,
              right: 16,
              zIndex: 1300,
            }}
          >
            <Fab
              size="medium"
              onClick={handleLogout}
              sx={{
                bgcolor: "#111",
                color: "white",
                boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
                "&:hover": { bgcolor: "#000" },
              }}
              aria-label="Clear chats"
            >
              <LogoutIcon sx={{ fontSize: 22 }} />
            </Fab>
          </Box>
        )}
      </div>
    </ThemeProvider>
  );
}

// Wrapper component with Suspense for useSearchParams
function ChatPageWrapper() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f4f1",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}

// Export with dynamic import to prevent SSR hydration issues
const ChatPage = dynamic(
  () => Promise.resolve({ default: ChatPageWrapper }),
  {
    ssr: false,
    loading: () => (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f4f1",
        }}
      >
        <CircularProgress />
      </Box>
    ),
  },
);

export default ChatPage;
