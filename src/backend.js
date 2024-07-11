exports.httpHandler = {
  endpoints: [{
        scope: 'issue',
        method: 'GET', 
        path: 'demo',
        handle: function (ctx) {
          ctx.response.json({test: true, scope: 'issue', issueSummary: ctx.issue.summary});
        }
      },

      {
        scope: 'article',
        method: 'GET', 
        path: 'demo',
        handle: function (ctx) {
          ctx.response.json({test: true, scope: 'article', articleSummary: ctx.article.summary});
        }
      },
      {
        scope: 'project',
        method: 'GET', 
        path: 'demo',
        handle: function (ctx) {
          ctx.response.json({test: true, scope: 'project', projectName: ctx.project.name});
        }
      }
    ]
};