import { PrismaClient } from "../generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";
import crypto from "crypto";
import express from "express";
import bodyParser from "body-parser";
import { Request, Response } from "express";
import cors from 'cors';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = 5000;

const prisma = new PrismaClient().$extends(withAccelerate());

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  console.log("GET /");
  res.send("Welcome to the Card Game API!");
});

app.post("/api/login", async (req, res) => {
  console.log("POST /api/login", req.body);
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
        where: {
        email: email,
        },
    });
    if (!user) {
        res.status(401).json({ success: false, message: "Invalid credentials" });
        return;
    }
    const hashedPassword = crypto
        .pbkdf2Sync(password, user.salt, 1000, 64, "sha512")
        .toString("hex");
    if (hashedPassword !== user.password) {
        res.status(401).json({ success: false, message: "Invalid credentials" });
        return;
    }
    res.json({ success: true,  user: { id: user.id, name: user.name, email: user.email } });
})

app.post("/api/user", async (req, res) => {
  console.log("POST /api/user", req.body);
  console.log(req.body);
  const { name, email, password } = req.body;

  const salt = crypto.randomBytes(16).toString("hex");
  const hashedPassword = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  const user = await prisma.user.create({
    data: {
      email: email,
      name: name,
      password: hashedPassword,
      salt:salt
    },
  });
  res.send(user);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.post('/api/game/create', async (req, res) => {
  console.log('POST /api/game/create', req.body);
  let deck = ["1-1","1-1","1-2","1-2","1-3","1-3","1-4","1-4","1-5","1-5","1-6","1-6","1-7","1-7","1-8","1-8","1-9","1-9","1-10","1-10","1-11","1-11","1-12","1-12","1-13","1-13","1-14","1-14","1-15","1-15","2-1","2-1","2-2","2-2","2-3","2-3","2-4","2-4","2-5","2-5","2-6","2-6","2-7","2-7","2-8","2-8","2-9","2-9","2-10","2-10","2-11","2-11","2-12","2-12","2-13","2-13","2-14","2-14","2-15","2-15","3-1","3-1","3-2","3-2","3-3","3-3","3-4","3-4","3-5","3-5","3-6","3-6","3-7","3-7","3-8","3-8","3-9","3-9","3-10","3-10","3-11","3-11","3-12","3-12","3-13","3-13","3-14","3-14","3-15","3-15","4-1","4-1","4-2","4-2","4-3","4-3","4-4","4-4","4-5","4-5","4-6","4-6","4-7","4-7","4-8","4-8","4-9","4-9","4-10","4-10","4-11","4-11","4-12","4-12","4-13","4-13","4-14","4-14","4-15","4-15","5-1","5-1","5-2","5-2","5-3","5-3","5-4","5-4","5-5","5-5","5-6","5-6","5-7","5-7","5-8","5-8","5-9","5-9","5-10","5-10","5-11","5-11","5-12","5-12","5-13","5-13","5-14","5-14","5-15","5-15","6","6","6","6","6","6","6","6","6","6","7","7","7","7","7","7","7","7","7","7","8","8","8","8","8","8","8","8","8","8","9","9","9","9","9","9","9","9","9","9","10","10","10","10","10","10","10","10","10","10"];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const game = await prisma.game.create({
    data: {
      deck: deck
    },
  });
  res.send(game);
});

app.post('/api/game/join', async (req, res) => {
  console.log('POST /api/game/join', req.body);
  const { gameId, userId } = req.body;
  const game = await prisma.game.findUnique({
    where: {
      id: parseInt(gameId),
    },
  });
  if (!game) {
    res.status(404).json({ message: "Game not found" });
    return;
  }
  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(userId),
    },
  });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const newUser = await prisma.game.update({
    where: {
      id: parseInt(gameId),
    },
    data: {
      user: {
        connect: {
          id: parseInt(userId),
        },
      },
    },
  })

  res.send(newUser)
});

app.get('/api/game', async (req:Request<{id: string}>, res) => {
  console.log('GET /api/game', req.query);
  const gameId = req.query.gameId?.toString() || null; 
  if(!gameId) {
    res.status(400).json({ message: "Game ID is required" });
    return;
  }
  const game = await prisma.game.findUnique({
    where: {
      id: parseInt(gameId)
    },
  });
  res.send(game)
})