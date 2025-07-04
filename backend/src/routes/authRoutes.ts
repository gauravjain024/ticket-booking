import express from "express";
import { login, register } from "../controllers/authController";
import { asyncHandler } from "../middlewares/asyncHandler";

const router = express.Router();

router.post("/login", asyncHandler(login));
router.post("/register", asyncHandler(register));

export default router;
