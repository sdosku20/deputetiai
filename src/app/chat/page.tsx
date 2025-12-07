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
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import CssBaseline from "@mui/material/CssBaseline";
import Drawer from "@mui/material/Drawer";
import useMediaQuery from "@mui/material/useMediaQuery";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentSession } from "@/hooks/useAgentSession";
import { useConversationSessions } from "@/hooks/useConversationSessions";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import DeleteOutline from "@mui/icons-material/DeleteOutline";

const theme = createTheme({
  typography: {
    fontFamily: "'Space Grotesk', sans-serif",
  },
});

function ChatPageContent() {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");

  const [input, setInput] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();
  const { user: authUser, logout, isAuthenticated } = useAuth();

  const isMobile = useMediaQuery("(max-width:768px)");

  const sessionId = useMemo(() => {
    return sessionParam || null;
  }, [sessionParam]);

  const { messages: agentMessages, loading, sendMessage, deleteConversation } =
    useAgentSession(sessionId);
  const { sessions, deleteSession, refreshSessions } = useConversationSessions();

  // COMMENTED OUT: Login requirement removed
  // Redirect if not authenticated
  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.push("/login");
  //   }
  // }, [isAuthenticated, router]);

  // Refresh sessions when component mounts or when route changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshSessions();
    }
  }, [isAuthenticated, refreshSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentMessages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessageText = input.trim();
    setInput("");

    let activeSessionId = sessionId;
    let isNewConversation = false;

    if (!activeSessionId) {
      activeSessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      isNewConversation = true;
    }

    const response = await sendMessage(userMessageText, activeSessionId);

    if (isNewConversation && response?.success) {
      router.replace(`/chat?session=${activeSessionId}`, { scroll: false });
    }

    if (response?.success) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("conversationCreated"));
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSend();
    }
  };

  const handleNewChat = () => {
    router.push("/chat");
    // Close mobile drawer when starting new chat
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/chat?session=${sessionId}`);
    // Close mobile drawer when session is clicked
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteSession(sessionId);
    if (sessionParam === sessionId) {
      router.push("/chat");
    }
  };

  if (!isAuthenticated) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ display: "flex", height: "100vh" }}>
        {/* Sidebar */}
        {!isMobile && (
          <Drawer
            variant="permanent"
            sx={{
              width: 260,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                width: 260,
                boxSizing: "border-box",
                backgroundColor: "#ffffff",
                borderRight: "1px solid #e5e7eb",
              },
            }}
          >
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: "16px",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  Deputeti AI
                </Typography>
              </Box>

              {/* New Chat Button */}
              <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb" }}>
                <Paper
                  component="button"
                  onClick={handleNewChat}
                  sx={{
                    width: "100%",
                    p: 1.5,
                    textAlign: "left",
                    cursor: "pointer",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#ffffff",
                    "&:hover": {
                      backgroundColor: "#f9fafb",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 500,
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    + New Chat
                  </Typography>
                </Paper>
              </Box>

              {/* Chat History */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  px: 2,
                  py: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    px: 1,
                    py: 0.5,
                    color: "#6b7280",
                    fontSize: "12px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                  }}
                >
                  Previous Chats
                </Typography>
                <List dense>
                  {sessions.map((session) => (
                    <ListItem
                      key={session.session_id}
                      disablePadding
                      sx={{ mb: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          "& .delete-btn": {
                            opacity: 0,
                            transition: "opacity 120ms ease",
                          },
                          "&:hover .delete-btn": { opacity: 1 },
                        }}
                      >
                        <ListItemButton
                          onClick={() => handleSessionClick(session.session_id)}
                          selected={sessionParam === session.session_id}
                          sx={{
                            borderRadius: 1,
                            flex: 1,
                            "&.Mui-selected": {
                              backgroundColor: "#f3f4f6",
                            },
                            "&:hover": {
                              backgroundColor: "#f9fafb",
                            },
                          }}
                        >
                          <ListItemText
                            primary={session.preview || "New conversation"}
                            primaryTypographyProps={{
                              sx: {
                                fontSize: "14px",
                                fontWeight: 400,
                                fontFamily: "'Space Grotesk', sans-serif",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              },
                            }}
                          />
                        </ListItemButton>
                        <IconButton
                          className="delete-btn"
                          size="small"
                          onClick={(e) =>
                            handleDeleteSession(session.session_id, e)
                          }
                          sx={{
                            color: "#6b7280",
                            "&:hover": { color: "#ef4444" },
                          }}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* User Info */}
              <Box
                sx={{
                  p: 2,
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "12px",
                    color: "#6b7280",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {authUser?.email || "User"}
                </Typography>
                <Typography
                  component="button"
                  onClick={logout}
                  sx={{
                    display: "block",
                    mt: 0.5,
                    fontSize: "12px",
                    color: "#ef4444",
                    cursor: "pointer",
                    border: "none",
                    background: "none",
                    fontFamily: "'Space Grotesk', sans-serif",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Logout
                </Typography>
              </Box>
            </Box>
          </Drawer>
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <Drawer
            anchor="left"
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            sx={{
              "& .MuiDrawer-paper": {
                width: 280,
                maxWidth: "85vw",
              },
            }}
          >
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: "16px",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  Deputeti AI
                </Typography>
              </Box>

              {/* New Chat Button */}
              <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb" }}>
                <Paper
                  component="button"
                  onClick={handleNewChat}
                  sx={{
                    width: "100%",
                    p: 1.5,
                    textAlign: "left",
                    cursor: "pointer",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#ffffff",
                    "&:hover": {
                      backgroundColor: "#f9fafb",
                    },
                    "&:active": {
                      backgroundColor: "#f3f4f6",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 500,
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    + New Chat
                  </Typography>
                </Paper>
              </Box>

              {/* Chat History */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  px: 2,
                  py: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    px: 1,
                    py: 0.5,
                    color: "#6b7280",
                    fontSize: "12px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                  }}
                >
                  Previous Chats
                </Typography>
                <List dense>
                  {sessions.map((session) => (
                    <ListItem
                      key={session.session_id}
                      disablePadding
                      sx={{ mb: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <ListItemButton
                          onClick={() => handleSessionClick(session.session_id)}
                          selected={sessionParam === session.session_id}
                          sx={{
                            borderRadius: 1,
                            flex: 1,
                            minHeight: 48,
                            "&.Mui-selected": {
                              backgroundColor: "#f3f4f6",
                            },
                            "&:hover": {
                              backgroundColor: "#f9fafb",
                            },
                            "&:active": {
                              backgroundColor: "#f3f4f6",
                            },
                          }}
                        >
                          <ListItemText
                            primary={session.preview || "New conversation"}
                            primaryTypographyProps={{
                              sx: {
                                fontSize: "14px",
                                fontWeight: 400,
                                fontFamily: "'Space Grotesk', sans-serif",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              },
                            }}
                          />
                        </ListItemButton>
                        <IconButton
                          size="small"
                          onClick={(e) =>
                            handleDeleteSession(session.session_id, e)
                          }
                          sx={{
                            color: "#6b7280",
                            minWidth: 40,
                            minHeight: 40,
                            "&:hover": { color: "#ef4444", backgroundColor: "#fef2f2" },
                            "&:active": { backgroundColor: "#fee2e2" },
                          }}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* User Info */}
              <Box
                sx={{
                  p: 2,
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "12px",
                    color: "#6b7280",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {authUser?.email || "User"}
                </Typography>
                <Typography
                  component="button"
                  onClick={logout}
                  sx={{
                    display: "block",
                    mt: 0.5,
                    fontSize: "12px",
                    color: "#ef4444",
                    cursor: "pointer",
                    border: "none",
                    background: "none",
                    fontFamily: "'Space Grotesk', sans-serif",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                    "&:active": {
                      opacity: 0.8,
                    },
                  }}
                >
                  Logout
                </Typography>
              </Box>
            </Box>
          </Drawer>
        )}

        {/* Main Chat Area */}
        <main
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f9fafb",
            height: "100vh",
          }}
        >
          {/* Mobile Menu Button */}
          {isMobile && (
            <Box
              sx={{
                position: "fixed",
                top: 12,
                left: 12,
                zIndex: 1100,
              }}
            >
              <IconButton
                onClick={() => setMobileMenuOpen(true)}
                sx={{
                  bgcolor: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  width: 44,
                  height: 44,
                  "&:active": {
                    backgroundColor: "#f3f4f6",
                  },
                }}
                aria-label="Open menu"
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 3 },
              display: "flex",
              flexDirection: "column",
              gap: 2,
              alignItems: "center",
              mt: isMobile ? 6 : 0,
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", sm: 768 },
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {agentMessages.length === 0 && (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 8,
                    color: "#6b7280",
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 1,
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    Welcome to Deputeti AI
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    Ask me anything about EU law!
                  </Typography>
                </Box>
              )}

              {agentMessages.map((msg, idx) => (
                <Box
                  key={idx}
                  sx={{
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    bgcolor: msg.role === "user" ? "#111827" : "white",
                    color: msg.role === "user" ? "white" : "#111827",
                    p: 2,
                    borderRadius: 2,
                    maxWidth: { xs: "90%", sm: "85%" },
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  }}
                >
                  {msg.role === "user" ? (
                    <Typography
                      sx={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: "15px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.content}
                    </Typography>
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p style={{ margin: "0.5em 0" }}>{children}</p>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>
          </Box>

          {/* Input */}
          <Box
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  display: "flex",
                  justifyContent: "center",
                  borderTop: "1px solid #e5e7eb",
                  backgroundColor: "white",
                  // Prevent input area from being hidden by mobile browser UI
                  paddingBottom: { xs: "calc(1.5rem + env(safe-area-inset-bottom))", sm: 2 },
                }}
          >
            <Paper
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) handleSend();
              }}
              sx={{
                flex: 1,
                maxWidth: { xs: "100%", sm: 768 },
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1.5,
                borderRadius: 3,
                border: "1px solid #e5e7eb",
              }}
            >
              <TextField
                multiline
                maxRows={4}
                placeholder="Ask a question..."
                variant="standard"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                sx={{
                  flex: 1,
                  "& .MuiInputBase-root": {
                    border: "none",
                  },
                }}
                InputProps={{ disableUnderline: true }}
              />
              <IconButton
                type="submit"
                disabled={!input.trim() || loading}
                sx={{
                  bgcolor: input.trim() ? "black" : "#9ca3af",
                  color: "white",
                  "&:hover": {
                    bgcolor: input.trim() ? "#111" : "#9ca3af",
                  },
                  "&.Mui-disabled": {
                    bgcolor: "#9ca3af",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  <SendIcon />
                )}
              </IconButton>
            </Paper>
          </Box>
        </main>
      </div>
    </ThemeProvider>
  );
}

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

const ChatPage = dynamic(() => Promise.resolve({ default: ChatPageWrapper }), {
  ssr: false,
});

export default ChatPage;

