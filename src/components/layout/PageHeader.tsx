import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

interface PageHeaderProps {
  breadcrumbItems: Array<{
    label: string;
    href?: string;
  }>;
  user?: {
    id: string;
    email: string;
    company_name?: string;
    client_id?: string;
  };
  onLogout?: () => void;
}

export function PageHeader({
  breadcrumbItems,
}: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 1.2,
        px: { xs: 0.5, sm: 0 },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Breadcrumb items={breadcrumbItems} />
      </Box>

      <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            border: "1px solid hsl(var(--border-soft))",
            borderRadius: 8,
            px: 1,
            py: 0.3,
            backgroundColor: "hsl(var(--surface))",
          }}
        >
          <SearchIcon sx={{ fontSize: 18, color: "hsl(var(--text-muted))", mr: 0.5 }} />
          <InputBase
            placeholder="Search"
            sx={{
              width: 120,
              fontSize: "0.82rem",
              "& input::placeholder": { opacity: 1, color: "hsl(var(--text-muted))" },
            }}
          />
        </Box>
        <Box
          sx={{
            border: "1px solid hsl(var(--border-soft))",
            borderRadius: 8,
            px: 1.1,
            py: 0.65,
            fontSize: "0.82rem",
            color: "hsl(var(--text-primary))",
            backgroundColor: "hsl(var(--surface))",
          }}
        >
          EU Law
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Switch size="small" />
          <Typography sx={{ fontSize: "0.82rem", color: "hsl(var(--text-muted))" }}>Historical</Typography>
        </Box>
        <Typography sx={{ fontSize: "0.82rem", color: "hsl(var(--text-muted))" }}>Share:</Typography>
        <Box
          sx={{
            border: "1px solid hsl(var(--border-soft))",
            borderRadius: 8,
            px: 1.1,
            py: 0.65,
            fontSize: "0.82rem",
            color: "hsl(var(--text-primary))",
            backgroundColor: "hsl(var(--surface))",
          }}
        >
          Private
        </Box>
        <IconButton size="small">
          <TuneIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
