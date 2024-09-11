
// See https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html
// eslint-disable-next-line no-undef
exports.httpHandler = {
  endpoints: [
    {
      scope: 'user',
      method: 'GET',
      path: 'demo',
      handle: function handle(ctx) {
        ctx.response.json({test: true, scope: 'user', userName: ctx.user.name});
      }
    },
    {
      method: 'GET',
      path: 'demo',
      handle: function handle(ctx) {
        const val1 = ctx.request.getParameter('val1');
        const {name} = ctx.settings;
        ctx.response.json({test: true, scope: 'global', name, val1});
      }
    },
    {
      method: 'POST',
      path: 'demo',
      handle: function handle(ctx) {
        const {name} = ctx.settings;
        ctx.response.json({test: true, name, scope: 'global', method: 'POST'});
      }
    }
  ]
};
