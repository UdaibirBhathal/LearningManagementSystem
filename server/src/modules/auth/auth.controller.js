import bcrypt from "bcrypt";
import { z } from "zod";
import User from "../users/user.model.js";
import { signAccess, signRefresh, verifyRefresh } from "../../utils/jwt.js";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["INSTRUCTOR", "STUDENT"]).optional().default("STUDENT")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function register(req, res) {
  try {
    const data = registerSchema.parse(req.body);

    const exists = await User.findOne({ email: data.email });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({ ...data, passwordHash });

    // Issue tokens
    const payload = { sub: user._id.toString(), email: user.email, role: user.role };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);

    return res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ message: "Validation error", issues: err.issues });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const payload = { sub: user._id.toString(), email: user.email, role: user.role };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ message: "Validation error", issues: err.issues });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function me(req, res) {
  return res.json({ user: req.user });
}

export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ message: "Missing refreshToken" });

    const payload = verifyRefresh(refreshToken);
    const newAccess = signAccess({ sub: payload.sub, email: payload.email, role: payload.role });
    return res.json({ accessToken: newAccess });
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
}

export function logout(_req, res) {
  return res.json({ message: "Logged out" });
}
