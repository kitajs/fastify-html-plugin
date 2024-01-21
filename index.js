/// <reference path="./types/index.d.ts" />
/* global SUSPENSE_ROOT */
'use strict';

const fp = require('fastify-plugin');
const { pipeHtml } = require('@kitajs/html/suspense');
const { prependDoctype } = require('./lib/prepend-doctype');
const { isHtml } = require('./lib/is-html');
const { CONTENT_TYPE_HEADER } = require('./lib/constants');

/**
 * @type {import('fastify').FastifyPluginCallback<import('./types').FastifyKitaHtmlOptions>}
 */
function fastifyKitaHtml(fastify, opts, next) {
  // Good defaults
  opts.autoDetect ??= false;
  opts.autoDoctype ??= true;
  opts.contentType ??= 'text/html; charset=utf8';
  opts.isHtml ??= isHtml;

  // Enables suspense if it's not enabled yet
  SUSPENSE_ROOT.enabled ||= true;

  // The normal .html handler is much simpler than the streamHtml one
  fastify.decorateReply('html', html);

  // As JSX is evaluated from the inside out, renderToStream() method requires
  // a function to be able to execute some code before the JSX calls gets to
  // render, it can be avoided by simply executing the code in the
  // streamHtml getter method.
  fastify.decorateReply('streamHtml', {
    getter() {
      SUSPENSE_ROOT.requests.set(this.request.id, {
        // As reply.raw is a instance of Writable, we can use it instead of
        // creating a our own new stream.
        stream: new WeakRef(this.raw),
        running: 0,
        sent: false
      });

      return streamHtml;
    }
  });

  // The onSend hook is only used by autoDetect, so we can
  // skip adding it if it's not enabled.
  if (opts.autoDetect) {
    fastify.addHook('onSend', onSend);
  }

  return next();

  /**
   * @type {import('fastify').FastifyReply['html']}
   */
  function html(html) {
    this.header(CONTENT_TYPE_HEADER, opts.contentType);

    if (opts.autoDoctype) {
      // Handles possibility of html being a promise
      if (html instanceof Promise) {
        html = html.then(prependDoctype);
      } else {
        html = prependDoctype(html);
      }
    }

    return this.send(html);
  }

  /**
   * @type {import('fastify').FastifyReply['streamHtml']}
   */
  function streamHtml(html) {
    this.header(CONTENT_TYPE_HEADER, opts.contentType);

    if (opts.autoDoctype) {
      // Handles possibility of html being a promise
      if (html instanceof Promise) {
        html = html.then(prependDoctype);
      } else {
        html = prependDoctype(html);
      }
    }

    // Hijacks the reply stream, so we can control when the stream is ended.
    this.hijack();

    // When the .streamHtml is called, the fastify decorator's getter method
    // already created the request data at the SUSPENSE_ROOT for us, so we
    // can simply pipe the first html wave to the reply stream.
    pipeHtml(html, this.raw, this.request.id);

    // The reply stream will be ended when the suspense root is resolved.
    return this;
  }

  /**
   * @type {import('fastify').onSendHookHandler}
   */
  function onSend(_request, reply, payload, done) {
    // Streamed html should also return false here, because it's not a string,
    // and already was handled by the streamHtml method.
    if (opts.isHtml(payload)) {
      reply.header(CONTENT_TYPE_HEADER, opts.contentType);

      if (opts.autoDoctype) {
        // Payload will never be a promise here, because the content was already
        // serialized.
        payload = prependDoctype(payload);
      }
    }

    return done(null, payload);
  }
}

module.exports = fp(fastifyKitaHtml, {
  fastify: '4.x',
  name: '@kitajs/fastify-html-plugin'
});
module.exports.default = fastifyKitaHtml;
module.exports.fastifyKitaHtml = fastifyKitaHtml;
