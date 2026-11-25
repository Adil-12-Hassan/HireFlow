import app from "./app.js";
import { env } from "./config/env.js";

// Importing env already checks all variables at startup.
// If .env is missing or wrong, the server stops here with a clear
// Zod error, instead of starting and failing later.

app.listen(env.PORT, () => {
    console.log(`HireFlow API running on http://localhost:${env.PORT}`);
    console.log(`Frontend allowed: ${env.ALLOWED_ORIGINS.join(", ")}`);
    console.log(`Environment: ${env.NODE_ENV}`);
});
