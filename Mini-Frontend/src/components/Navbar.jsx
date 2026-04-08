import {
  AppBar, Toolbar, Typography, InputBase, Button,
  Box, Avatar, Chip, Tooltip, IconButton
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

export default function Navbar({ user, search, onSearch, onLoginClick, onLogout, onAdminPanel }) {
  return (
    <AppBar position="sticky" sx={{ bgcolor: "background.paper", borderBottom: "1px solid #2a2a2a" }} elevation={0}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" fontWeight={700} color="primary" sx={{ minWidth: 100 }}>
          VideoTube
        </Typography>

        <Box sx={{ flex: 1, display: "flex", alignItems: "center", bgcolor: "#2a2a2a", borderRadius: 2, px: 2, py: 0.5 }}>
          <SearchIcon sx={{ color: "text.secondary", mr: 1, fontSize: 20 }} />
          <InputBase
            placeholder="Search videos..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            sx={{ color: "text.primary", width: "100%" }}
          />
        </Box>

        {user ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14 }}>
              {user.name[0].toUpperCase()}
            </Avatar>
            <Typography variant="body2" color="text.secondary">Hi, {user.name}</Typography>

            {user.role === "admin" && (
              <>
                <Chip label="Admin" size="small" color="primary" />
                <Tooltip title="Manage Users">
                  <IconButton size="small" color="primary" onClick={onAdminPanel}>
                    <AdminPanelSettingsIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}

            <Button variant="outlined" size="small" onClick={onLogout} sx={{ borderRadius: 2 }}>
              Logout
            </Button>
          </Box>
        ) : (
          <Button variant="contained" size="small" onClick={onLoginClick} sx={{ borderRadius: 2, minWidth: 100 }}>
            Login / Sign up
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}