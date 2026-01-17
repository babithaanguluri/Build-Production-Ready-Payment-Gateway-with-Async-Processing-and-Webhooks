import express from "express";
import { getJobStatus } from "../controllers/test.controller.js";

const router = express.Router();

router.get("/api/v1/test/jobs/status", getJobStatus);

export default router;
