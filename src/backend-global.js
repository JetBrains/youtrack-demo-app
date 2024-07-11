exports.httpHandler = {
  endpoints: [
      {
        scope: 'user',
        method: 'GET', 
        path: 'demo',
        handle: function (ctx) {
          ctx.response.json({test: true, scope: 'user', userName: ctx.user.name});
        }
      },
      {
        method: 'GET', 
        path: 'demo',
        handle: function (ctx) {
          const {name} = ctx.settings;
          ctx.response.json({test: true, scope: 'global', name});
        }
      },
      {
        method: 'POST', 
        path: 'demo',
        handle: function (ctx) {
          const {name} = ctx.settings;
          ctx.response.json({test: true, scope: 'global', method: 'POST'});
        }
      }
    ]
};