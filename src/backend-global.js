
// See https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html
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
        const {demoString1, demoString2} = ctx.globalStorage.extensionProperties;
        const testQueryParam = ctx.request.getParameter('test');
        const {name} = ctx.settings;

        ctx.response.json({
          test: true,
          scope: 'global',
          name,
          testQueryParam,
          val1: demoString1,
          val2: demoString2
        });
      }
    },
    {
      method: 'POST',
      path: 'demo',
      handle: function handle(ctx) {
        const {name} = ctx.settings;
        const body = ctx.request.json();
        ctx.globalStorage.extensionProperties.demoString1 = body.val1;
        ctx.globalStorage.extensionProperties.demoString2 = body.val2;
        // eslint-disable-next-line no-console
        console.log('Updated storage', body);

        ctx.response.json({test: true, name, scope: 'global', method: 'POST', receiveBody: body});
      }
    }
  ]
};
