const { h } = require('@kitajs/html');
const { Suspense } = require('@kitajs/html/suspense');
const fastify = require('fastify');
const fastifyKitaHtml = require('./');

const app = fastify();

app.register(fastifyKitaHtml);

// 3x faster than React, ~71.61 µs to generate entire MDN homepage (66.7Kb)
app.get('/', (req, res) =>
  res.streamHtml(
    h(
      'html',
      null,
      h('head', null, h('title', null, '@kitajs/html + fastify')),
      h(
        'body',
        null,
        h('h1', null, 'Hello world from JSX!'),

        h('div', { 'hx-get': '/htmx', 'hx-trigger': 'load', 'hx-swap': 'outerHTML' })
      )
    )
  )
);

app.get('/htmx', (_, res) =>
  res.html(Html.createElement('div', null, 'Hello from Htmx!'))
);

app.listen().then(console.log);
