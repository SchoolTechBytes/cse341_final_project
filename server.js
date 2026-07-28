import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import router from './routes/routes.js';
import { connectDB } from './config/db.js';

const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

/**
  * Routes
  */
app.use(router);

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running at http://127.0.0.1:${PORT}`);
            console.log(`Environment: ${NODE_ENV}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    });