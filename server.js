import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import router from './routes/routes.js';
import { connectDB } from './config/db.js';
import passport from './config/passport.js'
import { corsOptions } from './config/cors.js';
import authRoutes from './routes/auth.js';
import swaggerUi from 'swagger-ui-express';
import swaggerFile from './swagger.json' with { type: 'json' };

const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

var options = {
    explorer: true
};

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: NODE_ENV === 'Production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());


/**
 * Middleware
 */
app.use(cors(corsOptions));

/**
  * Routes
  */
app.use('/auth', authRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
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