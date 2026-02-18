import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { errorHandler } from './api/middleware/errorHandler.js';
import { drugsRouter } from './api/routes/drugs.js';
import { usersRouter } from './api/routes/users.js';
import { authRouter } from './api/routes/auth.js';
import { discussionsRouter } from './api/routes/discussions.js';
import { competitorsRouter } from './api/routes/competitors.js';
import { stateRegulationsRouter } from './api/routes/stateRegulations.js';
import { compoundingRouter } from './api/routes/compounding.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/drugs', drugsRouter);
app.use('/api/users', usersRouter);
app.use('/api/discussions', discussionsRouter);
app.use('/api/competitors', competitorsRouter);
app.use('/api/state-regulations', stateRegulationsRouter);
app.use('/api/compounding', compoundingRouter);

app.use(errorHandler);

// Serve static files in production
if (config.nodeEnv === 'production') {
  const staticPath = path.join(__dirname, '../../public');
  app.use(express.static(staticPath));

  // Handle Angular routes - serve index.html for non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
