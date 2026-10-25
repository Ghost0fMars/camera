import dotenv from 'dotenv';
import express from 'express';
import analyseHandler from './api/analyse.js';
import decoupageHandler from './api/decoupage.js';
import miseEnSceneHandler from './api/mise-en-scene.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.post('/api/analyse', analyseHandler);
app.post('/api/decoupage', decoupageHandler);
app.post('/api/mise-en-scene', miseEnSceneHandler);

const PORT = 3102;
app.listen(PORT, () => console.log(`API locale sur http://localhost:${PORT}`));
