function response(response, data) {
  response.response = JSON.stringify(data);
  response.addHeader("Content-Type", "application/json");
}

exports.httpHandler = {
  endpoints: [{
        scope: 'issue',
        method: 'GET', 
        path: 'demo',
        handle: function (ctx) {
          response(ctx.response, {test: true, scope: 'issue'});
        }
      },

      {
        scope: 'article',
        method: 'GET', 
        path: 'demo',
        handle: function (ctx) {
          response(ctx.response, {test: true, scope: 'article'});
        }
      },
      {
        scope: 'project',
        method: 'GET', 
        path: 'demo',
        handle: function (ctx) {
          response(ctx.response, {test: true, scope: 'project'});
        }
      },
      {
        scope: 'user',
        method: 'GET', 
        path: 'demo',
        handle: function (ctx) {
          response(ctx.response, {test: true, scope: 'user'});
        }
      },
      {
        method: 'GET', 
        path: 'demo',
        handle: function (ctx) {
          response(ctx.response, {test: true, scope: 'global'});
        }
      }
    ]
};