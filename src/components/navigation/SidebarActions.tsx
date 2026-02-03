"use client";

import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import { useRouter } from "next/navigation";
import { useConversationSessions } from "@/hooks/useConversationSessions";
import { SidebarSectionHeader } from "./SidebarSectionHeader";

interface SidebarActionsProps {
  actions?: Array<{ id: string; label: string; onClick?: () => void }>;
}

export function SidebarActions({ actions }: SidebarActionsProps) {
  const router = useRouter();
  const { sessions, deleteSession } = useConversationSessions();

  // Handle new query - go to chat page with no session ID (fresh start)
  const handleNewQuery = () => {
    router.push("/chat");
  };

  // Handle session click - go to chat page with session ID to load conversation
  const handleSessionClick = (sessionId: string) => {
    router.push(`/chat?session=${sessionId}`);
  };

  // Handle delete session
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await deleteSession(sessionId);
    if (success) {
      // Session removed from state automatically by the hook
      // If we're currently viewing this session, redirect to a fresh chat
      const currentUrl = window.location.href;
      if (currentUrl.includes(`session=${sessionId}`)) {
        router.push("/chat");
      }
    }
  };

  // If custom actions are provided, use them
  if (actions && actions.length > 0) {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "auto", px: 2 }}>
        <List dense sx={{ mb: 0, pl: 0 }}>
          {actions.map((action) => (
            <ListItem key={action.id} disablePadding>
              <ListItemButton
                onClick={action.onClick}
                sx={{
                  px: 1,
                  borderRadius: 1.5,
                  minHeight: 36,
                  fontFamily: "'Space Grotesk', sans-serif",
                  "&:hover": {
                    backgroundColor: "#f9f8f6",
                  },
                }}
              >
                <ListItemText
                  primary={action.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: "14px",
                        fontWeight: 400,
                        color: "#111827",
                        fontFamily: "'Space Grotesk', sans-serif",
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }

  // Default: Show New Query button and Queries section with clean design
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0, px: 0 }}>
      {/* New Query Section */}
      <Box sx={{ px: 3, mt: 1 }}>
        {/* ChatGPT-style New Query button with pencil-in-square icon */}
        <Box
          onClick={handleNewQuery}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            px: 0,
            py: 1,
            borderRadius: 1.5,
            cursor: "pointer",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "#111827",
            mb: 1,
            backgroundColor: "#ffffff",
            transition: "background-color 120ms ease",
          }}
        >
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <Box
              component="img"
              src="https://img.icons8.com/forma-regular/50/create-new.png"
              alt="create-new"
              sx={{ width: 16, height: 16, display: "block" }}
            />
          </Box>
          Bëni një pyetje të re
        </Box>
      </Box>

      {/* Queries Section Header */}
      <SidebarSectionHeader title="Bisedat e mëparshme" />

      {/* Conversations Section - Clean Design */}
      <Box sx={{ px: 3, mt: 0.25 }}>
        {/* Past Conversations List - ChatGPT-style, no inner scrollbar (outer sidebar scrolls) */}
        {sessions.length > 0 ? (
          <List dense sx={{ mb: 0.75, pl: 0 }}>
            {sessions.map((session, index) => (
              <ListItem key={`session-${session.session_id}-${index}`} disablePadding sx={{ mb: 0.125 }}>
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    "& .delete-btn": { opacity: 0, transition: "opacity 120ms ease" },
                    "&:hover .delete-btn": { opacity: 1 },
                  }}
                >
                  <ListItemButton
                    onClick={() => handleSessionClick(session.session_id)}
                    sx={{
                      px: 0,
                      py: 0.25,
                      borderRadius: 1.5,
                      flex: 1,
                      "&:hover": {
                        backgroundColor: "#f9f8f6",
                      },
                    }}
                  >
                    <ListItemText
                      primary={session.preview || "New conversation"}
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize: "14px",
                            fontWeight: 400,
                            color: "#111827",
                            fontFamily: "'Space Grotesk', sans-serif",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                  <Box
                    className="delete-btn"
                    onClick={(e) => handleDeleteSession(session.session_id, e)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 24,
                      height: 24,
                      borderRadius: 1,
                      cursor: "pointer",
                      color: "#6b7280",
                      "&:hover": { backgroundColor: "#f3f4f6", color: "#111827" },
                    }}
                    title="Delete conversation"
                    aria-label={`Delete conversation`}
                    role="button"
                  >
                    <DeleteOutline sx={{ fontSize: 18 }} />
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ py: 2, textAlign: "center", color: "#9ca3af" }}>
            <Typography sx={{ fontSize: "13px", fontFamily: "'Space Grotesk', sans-serif" }}>
              Ende nuk ka biseda!
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
