/*
JSPrime v0.1 beta
=================
The MIT License (MIT)

Copyright (c) 2013 Nishant Das Patnaik (nishant.dp@gmail.com)
Copyright (c) 2013 Sarathi Sabyasachi Sahoo (sarathisahoo@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
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
