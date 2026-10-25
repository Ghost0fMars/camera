import dotenv from 'dotenv';
import express from 'express';
import analyseHandler from './api/analyse';
import decoupageHandler from './api/decoupage';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.post('/api/analyse', analyseHandler);
app.post('/api/decoupage', decoupageHandler);

const PORT = 3102;
app.listen(PORT, () => console.log(`API locale sur http://localhost:${PORT}`));
