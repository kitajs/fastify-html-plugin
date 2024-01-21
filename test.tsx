//@ts-nocheck

import { Html } from '@kitajs/html';
import { Suspense } from '@kitajs/html/suspense';
import fastify from 'fastify';
import fastifyKitaHtml from './';

const app = fastify();

app.register(fastifyKitaHtml);

// 3x faster than React, ~71.61 µs to generate entire MDN homepage (66.7Kb)
app.get('/', (req, res) =>
  res.streamHtml(
    <html>
      <head>
        <title>@kitajs/html + fastify</title>
      </head>
      <body>
        <h1>Hello world from JSX!</h1>

       

        <div hx-get='/htmx' hx-trigger='load' hx-swap='outerHTML'></div>
      </body>
    </html>
  )
);

app.get('/htmx', (_, res) => res.html(<div>Hello from Htmx!</div>));

app.listen().then(console.log);

















