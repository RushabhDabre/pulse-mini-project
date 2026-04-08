import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Chip, Typography, Box, Tooltip, Avatar
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonIcon from "@mui/icons-material/Person";
import { API } from "../config";

export default function AdminPanel({ open, onClose, token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) loadUsers();
  }, [open]);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data);
    } catch {
      console.error("Could not load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, currentRole) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`Change role to ${newRole}?`)) return;
    try {
      const res = await fetch(`${API}/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message);
      loadUsers();
    } catch {
      alert("Failed to change role");
    }
  }

  async function handleDelete(userId, userName) {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message);
      loadUsers();
    } catch {
      alert("Failed to delete user");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, bgcolor: "background.paper" } }}>

      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AdminPanelSettingsIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>User Management</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {users.length} registered users
        </Typography>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            Loading users...
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "background.default" }}>
                  <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Joined</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {users.map((u) => (
                  <TableRow key={u._id} hover>

                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 13 }}>
                          {u.name[0].toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>{u.name}</Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={u.role}
                        size="small"
                        color={u.role === "admin" ? "primary" : "default"}
                        sx={{ fontSize: 11, fontWeight: 500 }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                        <Tooltip title={u.role === "admin" ? "Demote to User" : "Promote to Admin"}>
                          <IconButton size="small" onClick={() => handleRoleChange(u._id, u.role)}
                            sx={{ "&:hover": { bgcolor: "primary.dark" } }}>
                            {u.role === "admin"
                              ? <PersonIcon fontSize="small" />
                              : <AdminPanelSettingsIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete User">
                          <IconButton size="small" onClick={() => handleDelete(u._id, u.name)}
                            sx={{ "&:hover": { bgcolor: "error.dark" } }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}