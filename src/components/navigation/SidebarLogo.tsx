// Optimized: Direct import instead of barrel import
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface SidebarLogoProps {
  logoSrc?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export function SidebarLogo({
  logoSrc = "/Albanian_eagle.png",
  alt = "Albanian Eagle Logo",
  width = 40,
  height = 30,
}: SidebarLogoProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", pt: 3, pb: 3, px: 2 }}>
      <Box sx={{ width, height, ml: 1 }}>
        <img src={logoSrc} alt={alt} width={width} height={height} style={{ objectFit: "contain" }} />
      </Box>
    </Box>
  );
}
