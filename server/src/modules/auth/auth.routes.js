import { Router } from "express";
import { register, login, me, refresh, logout } from "./auth.controller.js";
import { requireAuth } from "../../middleware/requireAuth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
