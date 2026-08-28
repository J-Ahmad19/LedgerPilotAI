import { Router } from "express";
import { getCashPosition } from "../controllers/cash.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.use(authenticateToken as any);

router.get("/", getCashPosition);

export default router;
