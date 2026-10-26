import type { Server } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';

const app = createApp();
const server: Server = app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      health: `http://localhost:${env.PORT}/health/ready`,
    },
    'IT Incident Hub API iniciada',
  );
});

server.requestTimeout = 30_000;
server.headersTimeout = 35_000;
server.keepAliveTimeout = 30_000;

server.on('error', (error) => {
  logger.fatal({ err: error }, 'No se pudo iniciar el servidor HTTP');
  process.exit(1);
});

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Cerrando servidor');

  const forcedExit = setTimeout(() => {
    logger.error('Cierre forzado: quedaron conexiones activas');
    server.closeAllConnections();
    process.exit(1);
  }, 10_000);
  forcedExit.unref();

  server.close((error) => {
    void (async () => {
      if (error) {
        logger.error({ err: error }, 'Error al cerrar el servidor HTTP');
      }

      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        logger.error({ err: disconnectError }, 'Error al desconectar Prisma');
      } finally {
        clearTimeout(forcedExit);
        logger.info('Servidor cerrado correctamente');
        process.exit(error ? 1 : 0);
      }
    })();
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Promesa rechazada sin manejar');
  shutdown('SIGTERM');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Excepción no capturada');
  shutdown('SIGTERM');
});
