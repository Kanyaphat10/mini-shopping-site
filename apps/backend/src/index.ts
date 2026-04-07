import openapi from "@elysiajs/openapi";
import { Elysia } from "elysia";
import logixlysia from "logixlysia";

const app = new Elysia()
 .use(logixlysia({
      config: {
        showStartupMessage: true,
        startupMessageFormat: 'simple',
        timestamp: {
          translateTime: 'yyyy-mm-dd HH:MM:ss.SSS',
        },
        ip: true,
        customLogFormat:
          '{method} {status} {level} {duration} {pathname} {message} {ip}',
      },
    })
  )
    .use(openapi({
      path: '/docs',
      provider: 'scalar',
      scalar:{
        version: '1.44.15',
      },
      documentation: {
        info: {
          title: 'Mini Shopping Site API',
          version: '1.0.0',
          description: 'API documentation for mini Shopping Site',
        },
        tags: []
      },
    })
  )
.get("/", () => "Hello Elysia").listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
