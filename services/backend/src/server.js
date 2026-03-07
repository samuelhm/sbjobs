import { buildApp } from './app.js';

const start = async () => {
  let app;

  try {
    app = await buildApp();
    const port = Number(process.env.BACKEND_PORT || 4000);
    await app.listen({ port: port, host: '0.0.0.0' });
    app.log.info('Servidor levantado y listo para recibir peticiones.');
  } catch (err) {
    if (app) {
      app.log.error(err);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
};

start();
