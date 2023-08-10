import { config } from 'dotenv';
config();

import express, { Express } from 'express';
import routes from './routes';

const PORT = process.env.PORT;

function createApp(): Express {
    const app = express();
    app.use('/api', routes);

    return app;
}

async function main() {
    try {
        const app = createApp();
        app.listen(PORT, () => console.log(`Dashboard is running on port ${PORT}.`));
    } catch (err) {
        console.error(err);
    }
}

main();