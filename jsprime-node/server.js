/*
var http = require("http");

function onRequest(request, response) {
console.log(request);
var esprima = require('/Users/nishantp/Desktop/jsprime-demo/jsprime-node/esprima.js');
console.log(JSON.stringify(esprima.parse('var answer = 42'), null, 4));
  console.log("Request received.");
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.write("Sarathi");
  response.end();
}

http.createServer(onRequest).listen(8888);
*/
var http = require('http'),
    fs = require('fs');	
var querystring = require('querystring');
var esprima = require('/Users/nishantp/Desktop/jsprime-demo/jsprime-node/esprima.js');
var engine = require('/Users/nishantp/Desktop/jsprime-demo/jsprime-node/engine.js');
var analyzer = require('/Users/nishantp/Desktop/jsprime-demo/jsprime-node/analyzer.js');


fs.readFile('/Users/nishantp/Desktop/jsprime-demo/jsprime-node/test.html', function (err, html) {
    if (err) {
        throw err; 
    }       
    http.createServer(function(req, res) {
	
	switch(req.url) {
	case '/':
		res.writeHeader(200, {"Content-Type": "text/html"});
		res.write(html);
		res.end(); 
		break;
	case '/result':	
		if (req.method == 'POST') {
			var fullBody = '';
			 req.on('data', function(chunk) {
			 fullBody += chunk.toString();
			 });
			 req.on('end', function() {
				res.writeHead(200, "OK", {'Content-Type': 'text/html'});
				var decodedBody = querystring.parse(fullBody);
				var code = decodedBody.editor;
				var options = {
				loc: true,
				comment: false,
				raw: false,
				range: false,
				tolerant: false
				};
				
				var result = esprima.parse(code,options);
				var str_result = JSON.stringify(result, null, 4);
				engine.analyze(str_result);
				engine.asignFunctionReturnValue(analyzer.sink);
				analyzer.analyzeArrays(engine.real_func_names,engine.real_func_call,engine.real_variable_const,engine.real_variable_var,engine.real_variable_obj,engine.startScope,engine.endScope,code,res);
				res.end(); 
			 });
		}
		break;
	}
	/*
if (request.method == 'POST') {
		var esprima = require('/Users/nishantp/Desktop/jsprime-demo/jsprime-node/esprima.js');
        var body = '';
        request.on('data', function (data) {
            body += data;
        });
        request.on('end', function () {

            var code = qs.parse(body);
			
			options = {
			loc: true,
			comment: false,
            raw: false,
            range: false,
            tolerant: false
			};
		console.log("SSSS");	
		console.log(request);
		
            //var result = esprima.parse(code,options);
			//var str_result = JSON.stringify(result, null, 4);
			//response.write(str_result);

        });
}	
else
{
        response.writeHeader(200, {"Content-Type": "text/html"});  
        response.write(html);  
}		
        
*/	  	
    }).listen(8888);
});
