import { Request, Response } from "express";
import pool from "../services/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email=$1", [
    email,
  ]);
  const user = result.rows[0];
  if (!user) return res.status(400).json({ message: "User not found" });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(400).json({ message: "Invalid credentials" });
  const token = jwt.sign({ userId: user.id }, "secret123");
  res.json({ token });
};

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
      [email, hashedPassword]
    );
    const userId = result.rows[0].id;
    const token = jwt.sign({ userId }, "secret123");
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
}
