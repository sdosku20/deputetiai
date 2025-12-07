// Optimized: Direct import instead of barrel import
import Typography from "@mui/material/Typography";

interface SidebarSectionHeaderProps {
  title: string;
}

export function SidebarSectionHeader({ title }: SidebarSectionHeaderProps) {
  return (
    <Typography
      variant="h6"
      sx={{
        fontSize: "14px",
        fontWeight: 400,
        color: "#6b7280",
        ml: 3,
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      {title}
    </Typography>
  );
}
