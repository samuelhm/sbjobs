const Fastify = require('fastify');
const fastify = Fastify({
  logger: true
});
// Ruta principal (raíz /)
fastify.get('/', async (request, reply) => {
  return { 
    status: 'ok', 
    message: '¡El servicio backend de sbjobs está funcionando perfectamente2!' 
  };
});

const start = async () => {
  try {
    const port = Number(process.env.BACKEND_PORT || 4000);
    await fastify.listen({ port: port, host: '0.0.0.0' });
    fastify.log.info('Servidor levantado y listo para recibir peticiones.');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
