import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma from "./prisma";

const app = express();
app.use(cors()); // <-- Fixes browser blocking frontend-to-backend requests
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/todos", async (req, res) => {
  try {
    const { text, priority, dueDate } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // 1. Ensure a default test user exists in the database so foreign key doesn't fail
    const defaultUser = await prisma.user.upsert({
      where: { email: "test@example.com" },
      update: {},
      create: {
        id: "default-user-id",
        email: "test@example.com",
        passwordHash: "placeholder",
      },
    });

    // 2. Create the todo linked to that user
    const newTodo = await prisma.todo.create({
      data: {
        text,
        priority: priority || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: defaultUser.id,
      },
    });

    res.status(201).json(newTodo);
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({ error: "Internal server error", details: String(error) });
  }
});

app.get("/api/todos", async (_req, res) => {
  try {
    const user  = await prisma.user.findUnique({
      where: { email: "test@example.com" }
    });

    if (!user) 
    {
      return res.status(404).json({ error: "Default user not found" });
    }

    const todos = await prisma.todo.findMany({
      where: { userId: user.id },
      orderBy: [{ createdAt: "desc" }],
    });
    res.json(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Internal server error", details: String(error) });
  }
});

app.delete("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.todo.delete({
      where: { id },
    });
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ error: "Internal server error", details: String(error) });
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));