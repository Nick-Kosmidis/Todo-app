  import "dotenv/config";
  import express from "express";
  import cors from "cors";
  import prisma from "./prisma.js";
  import bcrypt from "bcryptjs";
  import jwt from "jsonwebtoken";
  import type { Request, Response, NextFunction } from "express";

  const JWT_SECRET: string = process.env.JWT_SECRET || "";
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in .env");

  interface AuthRequest extends Request {
    userId?: string;
  }



  function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = payload.userId;
      next();
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  }

  function signToken(userId: string) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
  }

  const app = express();
  app.use(
  cors({
    origin: ["http://localhost:5173", "https://todo-app-xi-orcin.vercel.app"],
  })
);
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (typeof email !== "string" || typeof password !== "string" || !email.trim()) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) return res.status(409).json({ error: "Email already registered" });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email: normalizedEmail, passwordHash },
      });

      res.status(201).json({ token: signToken(user.id), user: { id: user.id, email: user.email } });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
      if (!user || !valid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      res.json({ token: signToken(user.id), user: { id: user.id, email: user.email } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/todos", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const todos = await prisma.todo.findMany({
        where: { userId },
        include: {subtasks: {orderBy: [{ createdAt: "asc" }]}},
        orderBy: [{ createdAt: "desc" }],
      });
      res.json(todos);
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/todos", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { text, priority, dueDate } = req.body;
      if (!text) return res.status(400).json({ error: "Text is required" });

      const newTodo = await prisma.todo.create({
        include: { subtasks: true },
        data: {
          text,
          priority: priority || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          userId: req.userId!,
        },
      });
      res.status(201).json(newTodo);
    } catch (error) {
      console.error("Error creating todo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/todos/:todoId/subtasks", requireAuth, async (req: AuthRequest, res) => {
    try{
      const userId = req.userId!;
      const todoId = String(req.params.todoId);
      const { text } = req.body;
      if (!text) 
        return res.status(400).json({ error: "Text is required" });

      const todo = await prisma.todo.findFirst({ where: { id: todoId, userId } });
      if (!todo) 
        return res.status(404).json({ error: "Todo not found" });

      const newSubtask = await prisma.subtask.create({
        data:{
          text: text.trim(),
          todoId,
        }
      });
      res.status(201).json(newSubtask);
    } catch (error) {
      console.error("Error creating subtask:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/subtasks/:id", requireAuth, async (req: AuthRequest, res) => {
      try{
        const userId = req.userId!;
        const id = String(req.params.id);
        await prisma.subtask.deleteMany({ where: { id, todo: { userId } } });
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting subtask:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

  app.patch("/api/subtasks/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const id = String(req.params.id);
      const { text, done } = req.body;

      const result = await prisma.subtask.updateMany({
        where: { id, todo: { userId } },
        data: {
          ...(text !== undefined && { text }),
          ...(done !== undefined && { done }),
        },
      });
      if (result.count === 0) return res.status(404).json({ error: "Subtask not found" });

      const subtask = await prisma.subtask.findUnique({ where: { id } });
      res.json(subtask);
    } catch (error) {
      console.error("Error updating subtask:", error);
      res.status(500).json({ error: "Failed to update subtask" });
    }
  });


  // "completed" stays ABOVE ":id"
  app.delete("/api/todos/completed", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      await prisma.todo.deleteMany({ where: { userId, done: true } });
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting completed todos:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/todos/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const id = String(req.params.id);
      await prisma.todo.deleteMany({ where: { id, userId } });
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting todo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/todos/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;;
      const id = String(req.params.id);
      const { text, done, priority, dueDate } = req.body;

      const result = await prisma.todo.updateMany({
        where: { id, userId }, 
        data: {
          ...(text !== undefined && { text }),
          ...(done !== undefined && { done }),
          ...(priority !== undefined && { priority }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        },
      });
      if (result.count === 0) return res.status(404).json({ error: "Todo not found" });

      const todo = await prisma.todo.findUnique({ where: { id }, include: { subtasks: true } });
      res.json(todo);
    } catch (error) {
      console.error("Error updating todo:", error);
      res.status(500).json({ error: "Failed to update todo" });
    }
  });

  const port = Number(process.env.PORT) || 3000;

  if (!process.env.VERCEL) {
    app.listen(port, () => console.log(`API running on http://localhost:${port}`));
  }

  export default app;