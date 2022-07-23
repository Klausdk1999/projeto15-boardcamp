import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import postsRouter from './routes/postsRouter.js';
import usersRouter from './routes/usersRouter.js';

dotenv.config();

const app = express();

// Aqui tb são middlewares
app.use(express.json());
app.use(cors());

app.use(usersRouter);
app.use(postsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Servidor rodou deboas'));
