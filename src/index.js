import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import dotenv from "dotenv";
import confessionRouter from './routes/confession.js';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Ghostboard is alive!");
});

app.use("/confessions", confessionRouter);

app.listen(3000, () => {
    console.log('Server is running on port 3000 for Ghostboard');
});