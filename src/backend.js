exports.httpHandler = {
  endpoints: [{
        scope: 'issue',
        method: 'GET', 
        path: 'demo',
        handle: function (ctx) {
          ctx.response.json({test: true, scope: 'issue'});
        }
      },

      {
        scope: 'article',
        method: 'GET', 
        path: 'demo',
        handle: function (ctx) {
          ctx.response.json({test: true, scope: 'article'});
        }
      },
      {
        scope: 'project',
        method: 'GET', 
        path: 'demo',
        handle: function (ctx) {
          ctx.response.json({test: true, scope: 'project'});
        }
      },
      {
        scope: 'user',
        method: 'GET', 
        path: 'demo',
        handle: function (ctx) {
          ctx.response.json({test: true, scope: 'user'});
        }
      },
      {
        method: 'GET', 
        path: 'demo',
        handle: function (ctx) {
          const {name} = ctx.settings;
          ctx.response.json({test: true, scope: 'global', name});
        }
      }
    ]
};