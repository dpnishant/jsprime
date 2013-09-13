var http = require('http'),
fs = require('fs');
var querystring = require('querystring');
var esprima = require('./esprima.js');
var engine = require('./engine.js');
var analyzer = require('./analyzer.js');


fs.readFile('./test.html', function (err, html) {
  if (err) {
    throw err;
  }
  http.createServer(function (req, res) {

    switch (req.url) {
    case '/':
      res.writeHeader(200, {
        "Content-Type": "text/html"
      });
      res.write(html);
      res.end();
      break;
    case '/result':
      if (req.method == 'POST') {
        var fullBody = '';
        req.on('data', function (chunk) {
          fullBody += chunk.toString();
        });
        req.on('end', function () {
          res.writeHead(200, "OK", {
            'Content-Type': 'text/html'
          });
          var decodedBody = querystring.parse(fullBody);
          var code = decodedBody.editor;
          var options = {
            loc: true,
            comment: false,
            raw: false,
            range: false,
            tolerant: false
          };

          var result = esprima.parse(code, options);
          var str_result = JSON.stringify(result, null, 4);
          engine.analyze(str_result);
          engine.asignFunctionReturnValue(analyzer.sink);
          analyzer.analyzeArrays(engine.real_func_names, engine.real_func_call, engine.real_variable_const, engine.real_variable_var, engine.real_variable_obj, engine.startScope, engine.endScope, code, res);
          res.end();
        });
      }
      break;
    }
  }).listen(8888);
});
