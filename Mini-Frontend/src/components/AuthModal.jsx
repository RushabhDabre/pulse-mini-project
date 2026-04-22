import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, Tabs, Tab,
  TextField, Button, Typography, Box, Alert
} from "@mui/material";

export default function AuthModal({ open, onClose, onLogin, API }) {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const endpoint = tab === 0 ? "/auth/login" : "/auth/register";
      const body = tab === 0
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) return setError(data.message);

      if (tab === 1) {
        setTab(0);
        setError("");
        setForm({ name: "", email: "", password: "" });
        return;
      }

      onLogin(data?.data?.user, data?.data?.accessToken);
    } catch {
      setError("Server error. Is backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3, bgcolor: "background.paper" } }}>
      <DialogTitle sx={{ pb: 0 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(""); }}>
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {tab === 1 && (
            <TextField label="Name" name="name" value={form.name}
              onChange={handleChange} fullWidth size="small" />
          )}
          <TextField label="Email" name="email" value={form.email}
            onChange={handleChange} fullWidth size="small" />
          <TextField label="Password" name="password" type="password"
            value={form.password} onChange={handleChange} fullWidth size="small" />

          <Button variant="contained" fullWidth onClick={handleSubmit}
            disabled={loading} sx={{ borderRadius: 2 }}>
            {loading ? "Please wait..." : tab === 0 ? "Login" : "Register"}
          </Button>

          {tab === 1 && (
            <Typography variant="caption" color="text.secondary" textAlign="center">
              After registering, switch to Login tab to sign in.
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}