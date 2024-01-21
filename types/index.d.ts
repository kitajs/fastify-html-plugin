import { type FastifyPluginCallback } from 'fastify';

declare module 'fastify' {
  interface FastifyReply {
    /**
     * Returns a response with the given HTML.
     *
     * **This is a sync operation, all async components will be resolved before
     * sending the response, please use `Suspense` components and
     * `reply.streamHtml` if you want to stream the response.**
     *
     * If the HTML does not start with a doctype and `opts.autoDoctype` is
     * enabled, it will be added automatically.
     *
     * The correct `Content-Type` header will also be defined.
     *
     * @example
     *
     * ```tsx
     * app.get('/', (req, reply) => {
     *  reply.html(
     *    <html lang="en">
     *      <body>
     *        <h1>Hello, world!</h1>
     *      </body>
     *    </html>
     *   );
     * });
     * ```
     * @param html The HTML to send.
     * @returns The response.
     */
    html(
      this: this,
      html: JSX.Element
    ): ReturnType<this['send']> | Promise<ReturnType<this['send']>>;

    /**
     * Sends a HTML stream to the client, fully supporting `@kitajs/html`
     * `Suspense` components.
     *
     * **You must use `request.id` as the `Suspense`'s `rid` parameter.**
     *
     * This method hijacks the response, as the html stream is just a single
     * continuous stream in the http body, you cannot add/change the status
     * code, headers or trailers after calling this method.
     *
     * If the HTML does not start with a doctype and `opts.autoDoctype` is
     * enabled, it will be added automatically.
     *
     * The correct `Content-Type` header will also be defined.
     *
     * @example
     *
     * ```tsx
     * app.get('/', (req, reply) => {
     *  reply.streamHtml(
     *    <Suspense rid={req.id} fallback={<div>Loading...</div>}>
     *      <MyAsyncComponent />
     *    </Suspense>
     *   );
     * });
     * ```
     *
     * @param html The HTML to send.
     * @returns The response.
     */
    streamHtml(
      this: this,
      html: JSX.Element
    ): ReturnType<this['send']> | Promise<ReturnType<this['send']>>;
  }
}

type FastifyKitaHtmlPlugin = FastifyPluginCallback<
  NonNullable<Partial<fastifyKitaHtml.FastifyKitaHtmlOptions>>
>;

declare namespace fastifyKitaHtml {
  /**
   * Options for @kitajs/fastify-html-plugin plugin.
   */
  export interface FastifyKitaHtmlOptions {
    /**
     * The content-type of the response.
     *
     * @default 'text/html; charset=utf8'
     */
    contentType: string;

    /**
     * Whether to automatically detect HTML content and set the content-type.
     *
     * @default true
     */
    autoDetect: boolean;

    /**
     * Whether to automatically add `<!doctype html>` to a response starting with <html>, if not found.
     *
     * ```tsx
     * // With autoDoctype: true you can just return the html
     * app.get('/', () => <html></html>)
     *
     * // With autoDoctype: false you must use rep.html
     * app.get('/', (req, rep) => rep.html(<html></html>)
     * ```
     *
     * @default true
     */
    autoDoctype: boolean;

    /**
     * The function used to detect if a string is a html or not when `autoDetect`
     * is enabled. Default implementation if length is greater than 3, starts
     * with `<` and ends with `>`.
     *
     * There's no real way to validate HTML, so this is a best guess.
     *
     * @see https://stackoverflow.com/q/1732348
     * @see https://stackoverflow.com/q/11229831
     */
    isHtml: (this: void, value: string) => boolean;
  }

  export const fastifyKitaHtml: FastifyKitaHtmlPlugin;

  export { fastifyKitaHtml as default };
}

export = fastifyKitaHtml;
