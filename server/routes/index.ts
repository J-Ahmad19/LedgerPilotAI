import { Router } from "express";
import multer from "multer";
import { uploadImport } from "../controllers/import.controller.js";
import { startReconciliationRun, getRuns, getRunDetails } from "../controllers/reconciliation.controller.js";
import { queryAgent } from "../controllers/agent.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/imports", upload.single("file"), uploadImport);

router.post("/agent/query", queryAgent);

router.post("/runs", startReconciliationRun);
router.get("/runs", getRuns);
router.get("/runs/:id", getRunDetails);

import { getExceptions } from "../controllers/exceptions.controller.js";
router.get("/exceptions", getExceptions);

export default router;
