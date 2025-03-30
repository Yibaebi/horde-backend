import express from 'express';
import ENV from '@/config/env';
import setupAppRoutes from '@/config/routes';
import startDB from '@/config/db';

const app = express();

startDB();
setupAppRoutes(app);

app.listen(ENV.PORT, () => console.log(`App is listening on PORT ${ENV.PORT}...`));

export default app;
