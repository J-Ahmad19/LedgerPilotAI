import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { createWorkspace } from "../controllers/workspace.controller.js";

const router = Router();

router.post("/", authenticateToken as any, createWorkspace as any);

export default router;
