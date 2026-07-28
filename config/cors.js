const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const corsOptions = {
    origin(origin, callback) {
        // Allow non-browser clients (no Origin header), e.g. Postman/curl
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} is not allowed by CORS`));
        }
    },
    credentials: true,
};

export default corsOptions;
