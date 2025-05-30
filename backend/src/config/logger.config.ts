import pino from 'pino';

export const getPinoConfig = () => {
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty', // Optional: for pretty logging in development
      options: {
        colorize: true,
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime, // Use ISO timestamp format
  });
};