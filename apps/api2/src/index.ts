import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './utils/logger.js';
import { initDB } from './db/database.js';
import filesRouter from './routes/files.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/v1/files', filesRouter);

// Initialize database and start server
async function start(): Promise<void> {
  try {
    await initDB();
    app.listen(PORT, () => {
      log.info(`API2 server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    log.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();