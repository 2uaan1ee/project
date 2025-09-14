import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRouter from './routes/auth.js';
import profileRouter from "./routes/profile.js";


const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', authRouter);
app.use("/api", profileRouter);
const { MONGODB_URI, PORT = 8080 } = process.env;
await mongoose.connect(MONGODB_URI);
console.log('✅ Mongo connected');

const User =
  mongoose.models.User ||
  mongoose.model(
    'User',
    new mongoose.Schema({
      username: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }),
    'user_account' // <-- đúng chỗ
  );

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date() }));
app.get('/api/users', async (_req, res) => res.json(await User.find().lean()));
app.post('/api/users', async (req, res) => {
  const u = await User.create({ username: req.body.username });
  res.status(201).json(u);
});

app.listen(PORT, () => console.log(`🚀 Backend on http://localhost:${PORT}`));
