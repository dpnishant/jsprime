real_func_names = [];
real_func_call = [];
real_variable_const = [];
real_variable_var = [];
real_variable_obj = [];

var startScope = [];
var endScope = [];


options = {
  loc: true,
  comment: false,
  raw: false,
  range: false,
  tolerant: false
};


function adjustRegexLiteral(key, value) {
  if (key === 'value' && value instanceof RegExp) {
    value = value.toString();
  }
  return value;
}

function analyze(str_result) {
  //Global Variables	
  anon_func_names = [];

  /*
	var d = document;
	var code = d.getElementById('editor').value; //alert(code);
	var result = esprima.parse(code,options);
	var str_result = JSON.stringify(result, adjustRegexLiteral, 4);
	//d.getElementById('result').value = str_result;
	*/
  rslt = JSON.parse(str_result); //only for debugging purpose

  startScope.push(rslt.loc.start.line);
  endScope.push(rslt.loc.end.line);

  traverse(rslt, function (node) {
    //console.log(JSON.stringify(node));
    if (node.loc && node.body && (node.type == "FunctionDeclaration")) {
      startScope.push(node.loc.start.line);
      endScope.push(node.loc.end.line);
    }
    getFunctions(node);
    getVariables(node);
  });
  //asignFunctionReturnValue();

  //console.log("Function Name: "+JSON.stringify(real_func_names));
  //console.log("Function call: "+JSON.stringify(real_func_call));
  //console.log("Constant Variable value: "+JSON.stringify(real_variable_const));
  //console.log("Dynamic Variable value: "+JSON.stringify(real_variable_var));
  //console.log("Object Variable value: "+JSON.stringify(real_variable_obj));
  //console.time("time");
  //analyzeArrays();
  //console.timeEnd("time");
}

function traverse(node, func) {
  func(node); //1
  for (var key in node) { //2
    if (node.hasOwnProperty(key)) { //3
      var child = node[key];
      if (typeof child === 'object' && child !== null) { //4

        if (Array.isArray(child)) {
          child.forEach(function (node) { //5
            traverse(node, func);
          });
        } else {
          traverse(child, func); //6
        }
      }
    }
  }
}

function traverseMini(node, func) {
  func(node); //1
  for (var key in node) { //2
    if (node.hasOwnProperty(key)) { //3
      var child = node[key];
      if (typeof child === 'object' && child !== null) { //4

        if (Array.isArray(child)) {
          child.forEach(function (node) { //5
            traverseMini(node, func);
          });
        } else {
          traverseMini(child, func); //6
        }
      }
    }
  }
}

function makeRandomName() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 7; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function asignFunctionReturnValue(sink) {
  for (var i = 0; i < real_variable_var.length; i++) {
    var val = real_variable_var[i].value;
    var name = real_variable_var[i].name;
    var line = real_variable_var[i].line;
    var startScope = real_variable_var[i].startScope;
    var endScope = real_variable_var[i].endScope;

    for (var j = 0; j < real_func_names.length; j++) {
      if (val == real_func_names[j].name) {
        if (real_variable_var[i].startScope >= real_func_names[j].startScope && real_variable_var[i].endScope <= real_func_names[j].endScope) {
          var objName = real_variable_var[i].name.split(".");
          for (var t = 0; t < real_func_names[j].returns.variables.length; t++) {
            var returnValue = (real_func_names[j].returns.variables[t] || "").replace("#THIS#", objName[0]);
            real_variable_var[i].value = returnValue;

            for (var k = 0; k < sink.length; k++) {
              if (returnValue.indexOf(sink[k]) != -1) {
                sink.push(real_variable_var[i].name);
                real_variable_var[i].name = "#CHANGED_TO_SINK#";
              }
            }
          }
        } else {
          var isSink = false;
          for (var k = 0; k < sink.length; k++) {
            if (real_variable_var[i].name.indexOf(sink[k]) != -1) {
              isSink = true;
              break;
            }
          }
          if (isSink == false) {
            var newFunction = clone(real_func_names[j]);
            newFunction.name = name;
            //real_variable_var[i].name="#CHANGED_TO_FUNCTION#";
            real_func_names.push(newFunction);
            var newFunction2 = clone(real_variable_var[i]);
            convertedFunction.push(newFunction2);
          }
        }

      }
    }

    for (var j = 0; j < sink.length; j++) {
      if (val == sink[j]) {
        var newFunction = clone(sink[j]);
        newFunction = name;
        real_variable_var[i].name = "#CHANGED_TO_SINK#";
        sink.push(newFunction);
        if (sinkWithConstantParam && (sinkWithConstantParam.indexOf(sink[j]) != -1)) {
          sinkWithConstantParam.push(newFunction);
        }
      }
    }
  }

  for (var i = 0; i < real_func_call.length; i++) {
    for (var j = 0; j < real_func_names.length; j++) {
      if (real_func_call[i].name == real_func_names[j].name) {
        if (real_func_names[j].returns.functions.length > 0) {
          var newFunction = clone(real_func_call[i]);
          newFunction.name = real_func_names[j].returns.functions[0];

          for (var k = 0; k < real_func_names[j].returns.variables.length; k++) {
            newFunction.arguments.variables.push(real_func_names[j].returns.variables[k]);
          }
          real_func_call.push(newFunction);
        }
      }
    }
  }
}

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}

function getVariables(node) {
  var data = {
    name: '',
    value: '',
    line: 0,
    startScope: 0,
    endScope: 0,
    arguments: {
      variables: [],
      literals: [],
    }
  };
  if (node.type == "AssignmentExpression" && node.left && node.right) {
    var varVal = "";
    var varName = "";
    var lineNumber = 0;
    var funcArgs = "";
    var varObj = [];
    var lineObj = [];
    if (node.right.value)
      varVal = node.right.value + "#type#const";
    else if (node.right.name)
      varVal = node.right.name + "#type#var";
    else {
      var varVal = "";
      var node2;
      node2 = node.right;
      var discardFirstParam = false;

      var binaryNode = node2;
      while (binaryNode.type == "BinaryExpression") {
        if (binaryNode.left.name != undefined)
          varVal = varVal + "+" + binaryNode.left.name;
        if (binaryNode.left.value != undefined && binaryNode.right.name != undefined)
          varVal = varVal + "+" + binaryNode.right.name;
        else if (binaryNode.right.name != undefined && binaryNode.left != undefined)
          varVal = varVal + "+" + binaryNode.right.name;

        var varName2 = "";
        var nodeValue = "";
        var binaryNode2 = null;

        if (binaryNode.right.type == "MemberExpression")
          binaryNode2 = binaryNode.right;
        else
          binaryNode2 = binaryNode.left;

        while (binaryNode2.type == "MemberExpression") {
          if (binaryNode2.property) {
            var nodeValue = "";
            if (binaryNode2.property.name)
              nodeValue = binaryNode2.property.name
            else if (binaryNode2.property.value)
              nodeValue = binaryNode2.property.value

            if (varName2 == "")
              varName2 = nodeValue + varName2;
            else
              varName2 = nodeValue + "." + varName2;
          }
          if (binaryNode2.object.name) {
            varName2 = binaryNode2.object.name + "." + varName2;
          }
          binaryNode2 = binaryNode2.object;
        }
        if (varName2 != "") {
          varVal = varVal + "+" + varName2;
        }

        binaryNode = binaryNode.left;
      }
      if (varVal != "") {
        varVal = varVal.substring(1);
        varVal = varVal + "#type#var";
      }

      if (node2.callee) {
        if (node2.callee.name) {
          varVal = node2.callee.name
        }
        for (var j = 0; j < node2.arguments.length; j++) {
          var multipleArgs = "";
          var node4 = node2.arguments[j];
          if (node2.arguments[j].name)
            data.arguments.variables.push(node2.arguments[j].name);
          if (node2.arguments[j].value) {
            data.arguments.literals.push(node2.arguments[j].value);
            data.arguments.variables.push("#CONSTANT_VAL#");
          }

          while (node4.type == "BinaryExpression") {
            if (node4.left.name != undefined)
              multipleArgs = node4.left.name + multipleArgs;
            else if (node4.left.value != undefined && node4.right.name != undefined)
              multipleArgs = node4.right.name + multipleArgs;
            else if (node4.right.name != undefined && node4.left != undefined)
              multipleArgs = node4.operator + node4.right.name + multipleArgs;

            node4 = node4.left;
          }
          if (multipleArgs != "")
            data.arguments.variables.push(multipleArgs);
        }
        node2 = node2.callee;
        //discardFirstParam=true;
      }

      while (node2.type == "MemberExpression") {
        if (node2.property) {
          var nodeValue = "";
          if (node2.property.name)
            nodeValue = node2.property.name;
          else if (node2.property.value)
            nodeValue = node2.property.value;

          if (varVal == "" && discardFirstParam == true) {
            nodeValue = "";
            discardFirstParam = false;
          }
          if (varVal == "")
            varVal = nodeValue + varVal;
          else
            varVal = nodeValue + "." + varVal;
        }
        if (node2.object.name) {
          if (varVal != "")
            varVal = node2.object.name + "." + varVal;
          else
            varVal = node2.object.name;
        }

        if (node2.object.callee) {
          var node5 = node2;
          node2 = node2.object;
          //varVal="";
          for (var j = 0; j < node2.arguments.length; j++) {
            var multipleArgs = "";
            var node4 = node2.arguments[j];
            if (node2.arguments[j].name)
              data.arguments.variables.push(node2.arguments[j].name);
            if (node2.arguments[j].value) {
              data.arguments.literals.push(node2.arguments[j].value);
              data.arguments.variables.push("#CONSTANT_VAL#");
            }

            while (node4.type == "BinaryExpression") {
              if (node4.left.name != undefined)
                multipleArgs = node4.left.name + multipleArgs;
              else if (node4.left.value != undefined && node4.right.name != undefined)
                multipleArgs = node4.right.name + multipleArgs;
              else if (node4.right.name != undefined && node4.left != undefined)
                multipleArgs = node4.operator + node4.right.name + multipleArgs;

              node4 = node4.left;
            }
            if (multipleArgs != "")
              data.arguments.variables.push(multipleArgs);
          }
          node2 = node5.object.callee;
        } else {
          node2 = node2.object;
        }
      }
      if (node2.type == "ObjectExpression" && node2.properties) {
        for (i = 0; i < node2.properties.length; i++) {
          if (node2.properties[i].type === 'Property') {
            if (node2.properties[i].key.name) {
              lineObj.push(node2.properties[i].key.loc.start.line);
              if (node2.properties[i].value.value != undefined)
                varObj.push(node2.properties[i].key.name + "#prop#" + node2.properties[i].value.value + "#type#const");
              else if (node2.properties[i].value.name != undefined)
                varObj.push(node2.properties[i].key.name + "#prop#" + node2.properties[i].value.name + "#type#var");
              else {
                var node4 = node2.properties[i].value;
                varName2 = "";
                while (node4.type == "MemberExpression") {
                  if (node4.property) {
                    var nodeValue = "";
                    if (node4.property.name)
                      nodeValue = node4.property.name
                    else if (node4.property.value)
                      nodeValue = node4.property.value

                    if (varName2 == "")
                      varName2 = nodeValue + varName2;
                    else
                      varName2 = nodeValue + "." + varName2;
                  }
                  if (node4.object.name) {
                    varName2 = node4.object.name + "." + varName2;
                  }
                  node4 = node4.object;
                }

                if (node4.type == "FunctionExpression") {
                  if (node4.body.type == "BlockStatement") {
                    for (var b1 = 0; b1 < node4.body.body.length; b1++) {
                      if (node4.body.body[b1].type = "ReturnStatement" && node4.body.body[b1].argument) {
                        var bNode = node4.body.body[b1].argument;
                        var nodeValue = "";
                        var funcName4 = "";
                        while (bNode.type == "MemberExpression") {
                          if (bNode.property.name)
                            nodeValue = bNode.property.name
                          else if (bNode.property.value)
                            nodeValue = bNode.property.value

                          if (funcName4 == "")
                            funcName4 = nodeValue + funcName4;
                          else
                            funcName4 = nodeValue + "." + funcName4;
                          if (bNode.object.name) {
                            funcName4 = bNode.object.name + "." + funcName4;
                          }
                          if (bNode.object) {
                            bNode = bNode.object;
                          }

                          if (bNode.type == "ThisExpression") {
                            funcName4 = "#THIS#" + "." + funcName4;
                          }

                        }
                        varName2 = funcName4;
                      }
                    }
                  }
                }
                varObj.push(node2.properties[i].key.name + "#prop#" + varName2 + "#type#obj");
              }
            }
          }
        }
      }
      varVal = varVal + "#type#obj";
    }
    if (node.left.loc) {
      if (lineNumber == 0) {
        lineNumber = node.left.loc.start.line;
      }
    }

    if (node.left.name) {
      varName = node.left.name;
    } else {
      node = node.left;
      while (node.type == "MemberExpression") {
        if (node.property) {
          var nodeValue = "";
          if (node.property.name)
            nodeValue = node.property.name
          else if (node.property.value)
            nodeValue = node.property.value

          if (varName == "")
            varName = nodeValue + varName;
          else
            varName = nodeValue + "." + varName;
        }
        if (node.object.name) {
          var nodeValue = "";
          if (node.object.name)
            nodeValue = node.object.name
          else if (node.object.value)
            nodeValue = node.object.value

          varName = nodeValue + "." + varName;

          lineNumber = node.object.loc.start.line;
        }
        node = node.object;
      }
    }
    if (varObj.length > 0) {
      for (i = 0; i < varObj.length; i++) {
        var data = {
          name: '',
          value: '',
          line: 0,
          arguments: {
            variables: [],
            literals: [],
          }
        };
        varObj[i] = varObj[i].replace("#THIS#", varName);
        var type = varObj[i].split("#type#");
        var prop = type[0].split("#prop#");
        var varValue = type[0];
        var varName2 = varName;
        if (prop[1] != undefined) {
          varName2 = varName2 + "." + prop[0];
          varValue = prop[1];
        }
        data.line = lineObj[i];

        if ((startScope[startScope.length - 1] < data.line && data.line < endScope[endScope.length - 1]) || startScope.length < 2) {
          data.startScope = startScope[startScope.length - 1];
          data.endScope = endScope[endScope.length - 1];
        } else {
          startScope.pop();
          endScope.pop();
          data.startScope = startScope[startScope.length - 1];
          data.endScope = endScope[endScope.length - 1];
        }

        switch (type[1]) {
        case "const":
          data.name = varName2;
          data.value = varValue;
          real_variable_const.push(data);
          break;
        case "var":
          data.name = varName2;
          data.value = varValue;
          real_variable_var.push(data);
          break;
        case "obj":
          data.name = varName2;
          data.value = varValue;
          real_variable_var.push(data);
        }
      }
    } else {
      var type = varVal.split("#type#");
      data.line = lineNumber;

      if ((startScope[startScope.length - 1] < data.line && data.line < endScope[endScope.length - 1]) || startScope.length < 2) {
        data.startScope = startScope[startScope.length - 1];
        data.endScope = endScope[endScope.length - 1];
      } else {
        startScope.pop();
        endScope.pop();
        data.startScope = startScope[startScope.length - 1];
        data.endScope = endScope[endScope.length - 1];
      }

      switch (type[1]) {
      case "const":
        data.name = varName;
        data.value = type[0];
        real_variable_const.push(data);
        break;
      case "var":
        data.name = varName;
        data.value = type[0];
        real_variable_var.push(data);
        break;
      case "obj":
        data.name = varName;
        data.value = type[0];
        real_variable_var.push(data);
      }
    }
  } else if (node.type == "VariableDeclarator" && node.id && node.init) {
    var varVal = "";
    var varName = "";
    var funcArgs = "";
    var varObj = [];
    var lineObj = [];
    var lineNumber = 0;
    if (node.init.value)
      varVal = node.init.value + "#type#const";
    else if (node.init.name)
      varVal = node.init.name + "#type#var";
    else {
      var varVal = "";
      var node2;
      node2 = node.init;
      var discardFirstParam = false;

      var binaryNode = node2;
      while (binaryNode.type == "BinaryExpression") {
        if (binaryNode.left.name != undefined)
          varVal = varVal + "+" + binaryNode.left.name;
        if (binaryNode.left.value != undefined && binaryNode.right.name != undefined)
          varVal = varVal + "+" + binaryNode.right.name;
        if (binaryNode.right.name != undefined && binaryNode.left != undefined)
          varVal = varVal + "+" + binaryNode.right.name;

        var varName2 = "";
        var nodeValue = "";
        var binaryNode2 = null;

        if (binaryNode.right.type == "MemberExpression")
          binaryNode2 = binaryNode.right;
        else
          binaryNode2 = binaryNode.left;

        while (binaryNode2.type == "MemberExpression") {
          if (binaryNode2.property) {
            var nodeValue = "";
            if (binaryNode2.property.name)
              nodeValue = binaryNode2.property.name
            else if (binaryNode2.property.value)
              nodeValue = binaryNode2.property.value

            if (varName2 == "")
              varName2 = nodeValue + varName2;
            else
              varName2 = nodeValue + "." + varName2;
          }
          if (binaryNode2.object.name) {
            varName2 = binaryNode2.object.name + "." + varName2;
          }
          binaryNode2 = binaryNode2.object;
        }
        if (varName2 != "") {
          varVal = varVal + "+" + varName2;
        }

        binaryNode = binaryNode.left;
      }
      if (varVal != "") {
        varVal = varVal.substring(1);
        varVal = varVal + "#type#var";
      }

      if (node2.callee) {
        if (node2.callee.name) {
          varVal = node2.callee.name
        }

        for (var j = 0; j < node2.arguments.length; j++) {
          var multipleArgs = "";
          var node4 = node2.arguments[j];
          if (node2.arguments[j].name)
            data.arguments.variables.push(node2.arguments[j].name);
          if (node2.arguments[j].value) {
            data.arguments.literals.push(node2.arguments[j].value);
            data.arguments.variables.push("#CONSTANT_VAL#");
          }

          while (node4.type == "BinaryExpression") {
            if (node4.left.name != undefined)
              multipleArgs = node4.left.name + multipleArgs;
            else if (node4.left.value != undefined && node4.right.name != undefined)
              multipleArgs = node4.right.name + multipleArgs;
            else if (node4.right.name != undefined && node4.left != undefined)
              multipleArgs = node4.operator + node4.right.name + multipleArgs;

            node4 = node4.left;
          }
          if (multipleArgs != "")
            data.arguments.variables.push(multipleArgs);

        }
        node2 = node2.callee;
        //discardFirstParam=true;
      }

      while (node2.type == "MemberExpression") {
        if (node2.property) {
          var nodeValue = "";
          if (node2.property.name) {
            nodeValue = node2.property.name;
            lineNumber = node2.property.loc.start.line;
          } else if (node2.property.value)
            nodeValue = node2.property.value;
          else if (node2.callee && node2.callee.name)
            nodeValue = node2.callee.name;

          if (varVal == "" && discardFirstParam == true) {
            nodeValue = "";
            discardFirstParam = false;
          }
          if (varVal == "")
            varVal = nodeValue + varVal;
          else
            varVal = nodeValue + "." + varVal;
        }
        if (node2.object.name) {
          if (varVal != "")
            varVal = node2.object.name + "." + varVal;
          else
            varVal = node2.object.name;
          lineNumber = node2.object.loc.start.line;
        } else if (node2.object.callee && node2.object.callee.name) {
          varVal = node2.object.callee.name + "." + varVal;
          for (j = 0; j < node2.object.arguments.length; j++) {
            if (node2.object.arguments[j].value)
              funcArgs = funcArgs + "#args#" + node2.object.arguments[j].value;
            else if (node2.object.arguments[j].name)
              funcArgs = funcArgs + "#args#" + node2.object.arguments[j].name;
          }
        }
        if (node2.object.callee) {
          var node5 = node2;
          node2 = node2.object;
          //varVal="";
          for (var j = 0; j < node2.arguments.length; j++) {
            var multipleArgs = "";
            var node4 = node2.arguments[j];
            if (node2.arguments[j].name)
              data.arguments.variables.push(node2.arguments[j].name);
            if (node2.arguments[j].value) {
              data.arguments.literals.push(node2.arguments[j].value);
              data.arguments.variables.push("#CONSTANT_VAL#");
            }

            while (node4.type == "BinaryExpression") {
              if (node4.left.name != undefined)
                multipleArgs = node4.left.name + multipleArgs;
              else if (node4.left.value != undefined && node4.right.name != undefined)
                multipleArgs = node4.right.name + multipleArgs;
              else if (node4.right.name != undefined && node4.left != undefined)
                multipleArgs = node4.operator + node4.right.name + multipleArgs;

              node4 = node4.left;
            }
            if (multipleArgs != "")
              data.arguments.variables.push(multipleArgs);
          }
          node2 = node5.object.callee;
        } else {
          node2 = node2.object;
        }
      }

      if (node2.type == "ObjectExpression" && node2.properties) {
        for (i = 0; i < node2.properties.length; i++) {
          if (node2.properties[i].type === 'Property') {
            if (node2.properties[i].key.name) {
              lineObj.push(node2.properties[i].key.loc.start.line);
              if (node2.properties[i].value.value != undefined)
                varObj.push(node2.properties[i].key.name + "#prop#" + node2.properties[i].value.value + "#type#const");
              else if (node2.properties[i].value.name != undefined)
                varObj.push(node2.properties[i].key.name + "#prop#" + node2.properties[i].value.name + "#type#var");
              else {
                var node4 = node2.properties[i].value;
                varName2 = "";
                while (node4.type == "MemberExpression") {
                  if (node4.property) {
                    var nodeValue = "";
                    if (node4.property.name)
                      nodeValue = node4.property.name
                    else if (node4.property.value)
                      nodeValue = node4.property.value

                    if (varName2 == "")
                      varName2 = nodeValue + varName2;
                    else
                      varName2 = nodeValue + "." + varName2;
                  }
                  if (node4.object.name) {
                    varName2 = node4.object.name + "." + varName2;
                  }
                  node4 = node4.object;
                }
                if (node4.type == "FunctionExpression") {
                  if (node4.body.type == "BlockStatement") {
                    for (var b1 = 0; b1 < node4.body.body.length; b1++) {
                      if (node4.body.body[b1].type = "ReturnStatement" && node4.body.body[b1].argument) {
                        var bNode = node4.body.body[b1].argument;
                        var nodeValue = "";
                        var funcName4 = "";
                        while (bNode.type == "MemberExpression") {
                          if (bNode.property.name)
                            nodeValue = bNode.property.name
                          else if (bNode.property.value)
                            nodeValue = bNode.property.value

                          if (funcName4 == "")
                            funcName4 = nodeValue + funcName4;
                          else
                            funcName4 = nodeValue + "." + funcName4;
                          if (bNode.object.name) {
                            funcName4 = bNode.object.name + "." + funcName4;
                          }
                          if (bNode.object) {
                            bNode = bNode.object;
                          }

                          if (bNode.type == "ThisExpression") {
                            funcName4 = "#THIS#" + "." + funcName4;
                          }

                        }
                        varName2 = funcName4;
                      }
                    }
                  }
                }

                varObj.push(node2.properties[i].key.name + "#prop#" + varName2 + "#type#obj");
              }
            }
          }
        }
      }
      varVal = varVal + "#type#obj";
    }

    if (node.id.loc) {
      if (lineNumber == 0) {
        lineNumber = node.id.loc.start.line;
      }
    }
    if (node.id.name) {
      varName = node.id.name;
    } else {
      node = node.id;
      while (node.type == "MemberExpression") {
        if (node.property) {
          var nodeValue = "";
          if (node.property.name)
            nodeValue = node.property.name
          else if (node.property.value)
            nodeValue = node.property.value

          if (varName == "")
            varName = nodeValue + varName;
          else
            varName = nodeValue + "." + varName;
        }
        if (node.object.name) {
          var nodeValue = "";
          if (node.object.name)
            nodeValue = node.object.name
          else if (node.object.value)
            nodeValue = node.object.value

          varName = nodeValue + "." + varName;
        }
        node = node.object;
      }
    }
    if (varObj.length > 0) {
      for (i = 0; i < varObj.length; i++) {
        var data = {
          name: '',
          value: '',
          line: 0,
          arguments: {
            variables: [],
            literals: [],
          }
        };
        varObj[i] = varObj[i].replace("#THIS#", varName);
        var type = varObj[i].split("#type#");
        var prop = type[0].split("#prop#");
        var varValue = type[0];
        var varName2 = varName;
        if (prop[1] != undefined) {
          varName2 = varName2 + "." + prop[0];
          varValue = prop[1];
        }
        data.line = lineObj[i];

        if ((startScope[startScope.length - 1] < data.line && data.line < endScope[endScope.length - 1]) || startScope.length < 2) {
          data.startScope = startScope[startScope.length - 1];
          data.endScope = endScope[endScope.length - 1];
        } else {
          startScope.pop();
          endScope.pop();
          data.startScope = startScope[startScope.length - 1];
          data.endScope = endScope[endScope.length - 1];
        }

        switch (type[1]) {
        case "const":
          data.name = varName2;
          data.value = varValue;
          real_variable_const.push(data);
          break;
        case "var":
          data.name = varName2;
          data.value = varValue;
          real_variable_var.push(data);
          break;
        case "obj":
          data.name = varName2;
          data.value = varValue;
          real_variable_var.push(data);
        }
      }
    } else {
      var type = varVal.split("#type#");
      data.line = lineNumber;
      if ((startScope[startScope.length - 1] < data.line && data.line < endScope[endScope.length - 1]) || startScope.length < 2) {
        data.startScope = startScope[startScope.length - 1];
        data.endScope = endScope[endScope.length - 1];
      } else {
        startScope.pop();
        endScope.pop();
        data.startScope = startScope[startScope.length - 1];
        data.endScope = endScope[endScope.length - 1];
      }

      switch (type[1]) {
      case "const":
        data.name = varName;
        data.value = type[0];
        real_variable_const.push(data);
        break;
      case "var":
        data.name = varName;
        data.value = type[0];
        real_variable_var.push(data);
        break;
      case "obj":
        data.name = varName;
        data.value = type[0];
        real_variable_var.push(data);
      }
    }
  } else if (node.type == "VariableDeclarator" && node.id) {
    if (node.id.name) {
      var data = {
        name: '',
        value: '',
        line: 0,
        startScope: 0,
        endScope: 0,
        arguments: {
          variables: [],
          literals: [],
        }
      };
      data.name = node.id.name;
      data.line = node.id.loc.start.line;
      data.startScope = startScope;
      data.endScope = endScope;
      real_variable_var.push(data);
    }
  }
}

function getFunctions(node) {
  if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
    var data = {
      name: '',
      line: 0,
      arguments: {
        variables: [],
        functions: [],
        literals: [],
      },
      returns: {
        variables: [],
        literals: [],
        functions: [],
      }
    };
    if (node.id) {
      data.name = node.id.name;
      data.line = node.id.loc.start.line;
    } else {
      data.name = "#NONAME#" + makeRandomName();
    }

    for (i = 0; i < node.params.length; i++) {
      if (node.params[i].name)
        data.arguments.variables.push(node.params[i].name);
      else if (node.params[i].value) {
        data.arguments.literals.push(node.params[i].value);
        data.arguments.variables.push("#CONSTANT_VAL#");
      }
    }
    var body = node.body;
    if (data.line == 0) {
      if (body.loc.start.line) {
        data.line = body.loc.start.line;
        if (data.name.indexOf("#NONAME#") != -1) {
          for (var i1 = 0; i1 < real_func_call.length; i1++) {
            if (real_func_call[i1].line == data.line || real_func_call[i1].line == (data.line - 1)) {
              if (real_func_call[i1].name.indexOf("#NONAME#") != -1) {
                data.name = real_func_call[i1].name;
                data.startScope = real_func_call[i1].startScope;
                data.endScope = real_func_call[i1].endScope;
                break;
              }
            }
          }
        }
      }
    }
    traverseMini(body, function (node2) {
      if (node2.type == "ReturnStatement" && node2.argument) {
        var args = "";
        if (node2.argument.name)
          data.returns.variables.push(node2.argument.name);
        if (node2.argument.value) {
          data.returns.literals.push(node2.argument.value);
          data.arguments.variables.push("#CONSTANT_VAL#");
        }
        if (node2.argument.type == "CallExpression") {
          var node4 = node2.argument.callee;
          var funcName4 = "";
          var nodeValue = "";
          if (node4.name)
            funcName4 = node4.name;

          while (node4.type == "MemberExpression") {
            if (node4.property.name)
              nodeValue = node4.property.name
            else if (node4.property.value)
              nodeValue = node4.property.value

            if (funcName4 == "")
              funcName4 = nodeValue + funcName4;
            else
              funcName4 = nodeValue + "." + funcName4;
            if (node4.object.name) {
              funcName4 = node4.object.name + "." + funcName4;
            }
            node4 = node4.object;

          }
          var argValue = "";
          for (var j = 0; j < node2.argument.arguments.length; j++) {
            if (node2.argument.arguments[j].name)
              data.returns.variables.push(node2.argument.arguments[j].name);
            if (node2.argument.arguments[j].value) {
              data.returns.literals.push(node2.argument.arguments[j].value);
              data.returns.variables.push("#CONSTANT_VAL#");
            }
          }
          args = funcName4 + argValue;

          if (funcName4 != "") {
            data.returns.variables.push(funcName4);
          }
        }
        var nodeValue = "";
        var bReturnValue = "";
        var bNode = node2.argument;
        while (bNode.type == "MemberExpression") {
          if (bNode.property.name)
            nodeValue = bNode.property.name
          else if (bNode.property.value)
            nodeValue = bNode.property.value

          if (bReturnValue == "")
            bReturnValue = nodeValue + bReturnValue;
          else
            bReturnValue = nodeValue + "." + bReturnValue;
          if (bNode.object.name) {
            bReturnValue = bNode.object.name + "." + bReturnValue;
          }
          if (bNode.object) {
            bNode = bNode.object;
          }

          if (bNode.type == "ThisExpression") {
            bReturnValue = "#THIS#" + "." + bReturnValue;
          }
        }
        if (bReturnValue != "") {
          data.returns.variables.push(bReturnValue);
          //if(data.returns.variables.length==1)
          //{
          //startScope.pop();
          //endScope.pop();
          //}
          data.startScope = startScope[startScope.length - 1];
          data.endScope = endScope[endScope.length - 1];
        }

      }
    });
    real_func_names.push(data);
  } else if (node.type === 'CallExpression') {
    var data = {
      name: '',
      line: 0,
      startScope: 0,
      endScope: 0,
      arguments: {
        variables: [],
        functions: [],
        literals: [],
      },
      returns: {
        variables: [],
        literals: [],
        functions: [],
      }
    };
    var calleeName = node.callee.name;
    var lineNumber = node.callee.loc.start.line;
    for (i = 0; i < node.arguments.length; i++) {
      //var multipleArgs="";
      var node2 = node.arguments[i];
      if (node.arguments[i].name)
        data.arguments.variables.push(node.arguments[i].name);
      else if (node.arguments[i].value) {
        data.arguments.literals.push(node.arguments[i].value);
        data.arguments.variables.push("#CONSTANT_VAL#");
      }

      var node5 = node2;
      var nodeValue = "";
      var funcName4 = "";

      if (node5.type == "CallExpression") {
        node5 = node5.callee;
        if (node5.name) {
          funcName4 = node5.name;
        } else if (node5.type == "FunctionExpression") {
          if (node5.id) {
            funcName4 = node5.id.name;
          } else {
            funcName4 = "#NONAME#" + makeRandomName();
          }

          var data2 = {
            name: '',
            line: 0,
            startScope: 0,
            endScope: 0,
            arguments: {
              variables: [],
              functions: [],
              literals: [],
            },
            returns: {
              variables: [],
              literals: [],
              functions: [],
            }
          };
          data2.name = funcName4;
          data2.line = node5.loc.start.line;

          startScope.push(node5.loc.start.line);
          endScope.push(node5.loc.end.line);

          data2.startScope = startScope[startScope.length - 1];
          data2.endScope = endScope[endScope.length - 1];


          for (a1 = 0; a1 < node5.params.length; a1++) {
            if (node5.params[a1].name)
              data2.arguments.variables.push(node5.params[a1].name);
            else if (node5.params[a1].value) {
              data2.arguments.literals.push(node5.params[a1].value);
              data2.arguments.variables.push("#CONSTANT_VAL#");
            }
          }

          real_func_call.push(data2);

          node5 = node5.body;
          for (a2 = 0; a2 < node5.body.length; a2++) {
            if (node5.body[a2].type == "ReturnStatement" && node5.body[a2].argument) {
              if (node5.body[a2].argument.name) {
                funcName4 = node5.body[a2].argument.name;
              }
              if (node5.body[a2].argument.callee) {
                if (node5.body[a2].argument.callee.name) {
                  funcName4 = node5.body[a2].argument.callee.name;
                }
              }
            }
          }
          //node5=node5.id;
        }

        while (node5.type == "MemberExpression") {
          if (node5.property.name)
            nodeValue = node5.property.name
          else if (node5.property.value)
            nodeValue = node5.property.value

          if (funcName4 == "")
            funcName4 = nodeValue + funcName4;
          else
            funcName4 = nodeValue + "." + funcName4;
          if (node5.object.name) {
            funcName4 = node5.object.name + "." + funcName4;
          }
          node5 = node5.object;

          if (node5.type == "CallExpression") {
            node5 = node5.callee;
          }
        }

      }
      while (node5.type == "MemberExpression") {
        if (node5.property.name)
          nodeValue = node5.property.name
        else if (node5.property.value)
          nodeValue = node5.property.value

        if (funcName4 == "")
          funcName4 = nodeValue + funcName4;
        else
          funcName4 = nodeValue + "." + funcName4;
        if (node5.object.name) {
          funcName4 = node5.object.name + "." + funcName4;
        }
        node5 = node5.object;

        if (node5.type == "CallExpression") {
          node5 = node5.callee;
        }
      }

      if (funcName4 != "")
        data.arguments.variables.push(funcName4);

      while (node2.type == "BinaryExpression") {
        if (node2.left.name != undefined)
          data.arguments.variables.push(node2.left.name);
        if (node2.right.name != undefined)
          data.arguments.variables.push(node2.right.name);


        var node6 = node2;
        while (node6.type == "BinaryExpression") {
          node5 = node6;
          if (node6.left) {
            var nodeValue = "";
            var funcName4 = "";
            node5 = node5.left;
            while (node5.type == "MemberExpression") {
              if (node5.property.name)
                nodeValue = node5.property.name
              else if (node5.property.value)
                nodeValue = node5.property.value

              if (funcName4 == "")
                funcName4 = nodeValue + funcName4;
              else
                funcName4 = nodeValue + "." + funcName4;
              if (node5.object.name) {
                funcName4 = node5.object.name + "." + funcName4;
              }
              node5 = node5.object;

            }
            if (funcName4 != "" && data.arguments.variables.indexOf(funcName4) == -1)
              data.arguments.variables.push(funcName4);
          }
          node5 = node6;
          if (node6.right) {
            var nodeValue = "";
            var funcName4 = "";
            node5 = node5.right;
            while (node5.type == "MemberExpression") {
              if (node5.property.name)
                nodeValue = node5.property.name
              else if (node5.property.value)
                nodeValue = node5.property.value

              if (funcName4 == "")
                funcName4 = nodeValue + funcName4;
              else
                funcName4 = nodeValue + "." + funcName4;
              if (node5.object.name) {
                funcName4 = node5.object.name + "." + funcName4;
              }
              node5 = node5.object;

            }
            if (funcName4 != "" && data.arguments.variables.indexOf(funcName4) == -1)
              data.arguments.variables.push(funcName4);
          }
          node6 = node6.left;
        }
        node2 = node2.left;
      }
      //if(multipleArgs!="")
      //data.arguments.variables.push(multipleArgs);
    }
    var node4 = node.callee;
    var funcName4 = "";
    var nodeValue = "";

    while (node4.type == "MemberExpression") {
      if (node4.property.name)
        nodeValue = node4.property.name
      else if (node4.property.value)
        nodeValue = node4.property.value

      if (funcName4 == "")
        funcName4 = nodeValue + funcName4;
      else
        funcName4 = nodeValue + "." + funcName4;
      if (node4.object.name) {
        funcName4 = node4.object.name + "." + funcName4;
      }
      node4 = node4.object;
      calleeName = funcName4;

    }
    if (calleeName == undefined) {
      return;
    }
    data.name = calleeName;
    data.line = lineNumber;

    if ((startScope[startScope.length - 1] < data.line && data.line < endScope[endScope.length - 1]) || startScope.length < 2) {
      data.startScope = startScope[startScope.length - 1];
      data.endScope = endScope[endScope.length - 1];
    } else {
      //startScope.pop(); 
      //endScope.pop(); 
      data.startScope = startScope[startScope.length - 1];
      data.endScope = endScope[endScope.length - 1];
    }

    real_func_call.push(data);
  }
  if (node.type === 'VariableDeclarator' && node.init) {
    var data = {
      name: '',
      line: 0,
      arguments: {
        variables: [],
        functions: [],
        literals: [],
      },
      returns: {
        variables: [],
        literals: [],
        functions: [],
      }
    };
    if (node.init.type == "ObjectExpression" && node.init.properties) {
      for (i = 0; i < node.init.properties.length; i++) {
        if (node.init.properties[i].type === 'Property') {
          if (node.init.properties[i].key.name && node.init.properties[i].value.type == "FunctionExpression") {
            var funcName = node.id.name + "." + node.init.properties[i].key.name;
            for (j = 0; j < node.init.properties[i].value.params.length; j++) {
              if (node.init.properties[i].value.params[j].name)
                data.arguments.variables.push(node.init.properties[i].value.params[j].name);
              else if (node.init.properties[i].value.params[j].value) {
                data.arguments.literals.push(node.init.properties[i].value.params[j].value);
                data.arguments.variables.push("#CONSTANT_VAL#");
              }
            }
            data.name = funcName;
            data.line = node.id.loc.start.line;
            real_func_names.push(data);
          }
        }
      }
    } else if (node.init.type == "FunctionExpression") {
      data.name = node.id.name;
      data.line = node.id.loc.start.line;
      if (node.id.name) {
        data.name = node.id.name;
        data.line = node.id.loc.start.line;

        for (var j = 0; j < node.init.params.length; j++) {
          if (node.init.params[j].name)
            data.arguments.variables.push(node.init.params[j].name);
          else if (node.init.params[j].value) {
            data.arguments.literals.push(node.init.params[j].value);
            data.arguments.variables.push("#CONSTANT_VAL#");
          }
        }

        var body = node.init.body;
        traverseMini(body, function (node2) {
          if (node2.type == "ReturnStatement" && node2.argument != undefined) {
            var args = "";
            if (node2.argument.name != undefined)
              data.returns.variables.push(node2.argument.name);
            if (node2.argument.value != undefined) {
              data.returns.literals.push(node2.argument.value);
              data.returns.variables.push("#CONSTANT_VAL#");
            }

            if (node2.argument.type == "CallExpression") {
              var node4 = node2.argument.callee;
              var funcName4 = "";
              var nodeValue = "";
              if (node4.name)
                funcName4 = node4.name;
              while (node4.type == "MemberExpression") {
                if (node4.property.name)
                  nodeValue = node4.property.name
                else if (node4.property.value)
                  nodeValue = node4.property.value

                if (funcName4 == "")
                  funcName4 = nodeValue + funcName4;
                else
                  funcName4 = nodeValue + "." + funcName4;
                if (node4.object.name) {
                  funcName4 = node4.object.name + "." + funcName4;
                }
                node4 = node4.object;

              }
              var argValue = "";
              for (var j = 0; j < node2.argument.arguments.length; j++) {
                if (node2.argument.arguments[j].name)
                  data.arguments.variables.push(node2.argument.arguments[j].name);
                if (node2.argument.arguments[j].value) {
                  data.arguments.literals.push(node2.argument.arguments[j].value);
                  data.arguments.variables.push("#CONSTANT_VAL#");
                }
              }
              data.returns.functions.push(funcName4);
              args = funcName4 + argValue;
            } else {
              var node4 = node2.argument;
              var nodeValue = "";
              var funcName4 = "";
              while (node4.type == "MemberExpression") {
                if (node4.property.name)
                  nodeValue = node4.property.name
                else if (node4.property.value)
                  nodeValue = node4.property.value

                if (funcName4 == "")
                  funcName4 = nodeValue + funcName4;
                else
                  funcName4 = nodeValue + "." + funcName4;
                if (node4.object.name) {
                  funcName4 = node4.object.name + "." + funcName4;
                }
                node4 = node4.object;

              }
              if (funcName4 != "")
                data.returns.variables.push(funcName4);
            }

          }
        });
        real_func_names.push(data);
      }
      real_func_names.push(data);
    }
  }
  if (node.type === 'AssignmentExpression' && node.right) {
    var data = {
      name: '',
      line: 0,
      arguments: {
        variables: [],
        functions: [],
        literals: [],
      },
      returns: {
        variables: [],
        literals: [],
        functions: [],
      },
    };
    if (node.right.type == "ObjectExpression" && node.right.properties) {
      for (i = 0; i < node.right.properties.length; i++) {
        if (node.right.properties[i].type === 'Property') {
          if (node.right.properties[i].key.name && node.right.properties[i].value.type == "FunctionExpression") {
            var objName = node.left.name;
            data.name = node.left.name + "." + node.right.properties[i].key.name;
            data.line = node.left.loc.start.line;

            for (var j = 0; j < node.right.properties[i].value.params.length; j++) {
              if (node.right.properties[i].value.params[j].name) {
                data.arguments.variables.push(node.right.properties[i].value.params[j].name);
              }
            }

            if (node.right.properties[i].value.body) {
              for (var j = 0; j < node.right.properties[i].value.body.body.length; j++) {
                if (node.right.properties[i].value.body.body[j].type == "ReturnStatement") {
                  if (node.right.properties[i].value.body.body[j].argument) {
                    if (node.right.properties[i].value.body.body[j].argument.name) {
                      data.returns.variables.push(node.right.properties[i].value.body.body[j].argument.name);
                    }
                    var node4 = node.right.properties[i].value.body.body[j].argument;

                    var returnType = "";
                    if (node4.type == "CallExpression") {
                      for (var k = 0; k < node4.arguments.length; k++) {
                        if (node4.arguments[k].name) {
                          data.returns.variables.push(node4.arguments[k].name);
                        }
                      }
                      node4 = node4.callee;
                      returnType = "function";
                    }

                    var nodeValue = "";
                    var funcName4 = "";
                    while (node4.type == "MemberExpression") {
                      if (node4.property.name)
                        nodeValue = node4.property.name
                      else if (node4.property.value)
                        nodeValue = node4.property.value

                      if (funcName4 == "")
                        funcName4 = nodeValue + funcName4;
                      else
                        funcName4 = nodeValue + "." + funcName4;
                      if (node4.object.name) {
                        funcName4 = node4.object.name + "." + funcName4;
                      }
                      node4 = node4.object;

                      if (node4.type == "ThisExpression") {
                        funcName4 = objName + "." + funcName4;
                      }
                    }

                    if (funcName4 != "") {
                      if (returnType == "function") {
                        data.returns.functions.push(funcName4);
                      } else {
                        data.returns.variables.push(funcName4);
                      }
                    }
                  }
                }
              }
            }

            real_func_names.push(data);
          }
        }
      }
    } else if (node.right.type == "FunctionExpression") {
      if (node.left.name) {
        data.name = node.left.name;
        data.line = node.left.loc.start.line;

        for (var j = 0; j < node.right.params.length; j++) {
          if (node.right.params[j].name)
            data.arguments.variables.push(node.right.params[j].name);
          else if (node.right.params[j].value) {
            data.arguments.literals.push(node.right.params[j].value);
            data.arguments.variables.push("#CONSTANT_VAL#");
          }
        }

        var body = node.right.body;
        traverseMini(body, function (node2) {
          if (node2.type == "ReturnStatement") {
            var args = "";
            if (node2.argument.name != undefined)
              data.returns.variables.push(node2.argument.name);
            if (node2.argument.value != undefined) {
              data.returns.literals.push(node2.argument.value);
              data.returns.variables.push("#CONSTANT_VAL#");
            }

            if (node2.argument.type == "CallExpression") {
              var node4 = node2.argument.callee;
              var funcName4 = "";
              var nodeValue = "";
              if (node4.name)
                funcName4 = node4.name;
              while (node4.type == "MemberExpression") {
                if (node4.property.name)
                  nodeValue = node4.property.name
                else if (node4.property.value)
                  nodeValue = node4.property.value

                if (funcName4 == "")
                  funcName4 = nodeValue + funcName4;
                else
                  funcName4 = nodeValue + "." + funcName4;
                if (node4.object.name) {
                  funcName4 = node4.object.name + "." + funcName4;
                }
                node4 = node4.object;

              }
              var argValue = "";
              for (var j = 0; j < node2.argument.arguments.length; j++) {
                if (node2.argument.arguments[j].name)
                  data.arguments.variables.push(node2.argument.arguments[j].name);
                if (node2.argument.arguments[j].value) {
                  data.arguments.literals.push(node2.argument.arguments[j].value);
                  data.arguments.variables.push("#CONSTANT_VAL#");
                }
              }
              data.returns.functions.push(funcName4);
              args = funcName4 + argValue;
            } else {
              var node4 = node2.argument;
              var nodeValue = "";
              var funcName4 = "";
              while (node4.type == "MemberExpression") {
                if (node4.property.name)
                  nodeValue = node4.property.name
                else if (node4.property.value)
                  nodeValue = node4.property.value

                if (funcName4 == "")
                  funcName4 = nodeValue + funcName4;
                else
                  funcName4 = nodeValue + "." + funcName4;
                if (node4.object.name) {
                  funcName4 = node4.object.name + "." + funcName4;
                }
                node4 = node4.object;

              }
              if (funcName4 != "")
                data.returns.variables.push(funcName4);
            }

          }
        });
        real_func_names.push(data);
      } else {
        var funcName = "";
        var body = node.right.body;
        node = node.left;

        if (node.left)
          data.line = node.left.loc.start.line;

        while (node.type == "MemberExpression") {
          if (node.property) {
            if (funcName == "")
              funcName = node.property.name + funcName;
            else
              funcName = node.property.name + "." + funcName;
          }
          if (node.object.name) {
            funcName = node.object.name + "." + funcName;
          }
          node = node.object;
        }
        data.name = funcName;
        var funcName2 = "";
        traverseMini(body, function (node2) {
          if (node2.type == "ReturnStatement" && node2.argument) {
            var args = "";
            if (node2.argument.name != undefined)
              data.returns.variables.push(node2.argument.name);
            if (node2.argument.value != undefined) {
              data.returns.literals.push(node2.argument.value);
              data.returns.variables.push("#CONSTANT_VAL#");
            }
            if (node2.argument.type == "CallExpression") {
              var node4 = node2.argument.callee;
              var funcName4 = "";
              var nodeValue = "";
              if (node4.name)
                funcName4 = node4.name;
              while (node4.type == "MemberExpression") {
                if (node4.property.name)
                  nodeValue = node4.property.name
                else if (node4.property.value)
                  nodeValue = node4.property.value

                if (funcName4 == "")
                  funcName4 = nodeValue + funcName4;
                else
                  funcName4 = nodeValue + "." + funcName4;
                if (node4.object.name) {
                  funcName4 = node4.object.name + "." + funcName4;
                }
                node4 = node4.object;

              }
              var argValue = "";
              for (var j = 0; j < node2.argument.arguments.length; j++) {
                if (node2.argument.arguments[j].name)
                  data.arguments.variables.push(node2.argument.arguments[j].name);
                if (node2.argument.arguments[j].value) {
                  data.arguments.literals.push(node2.argument.arguments[j].value);
                  data.arguments.variables.push("#CONSTANT_VAL#");
                }
              }
              data.returns.functions.push(funcName4);
            } else {
              var node4 = node2.argument;
              var nodeValue = "";
              var funcName4 = "";
              while (node4.type == "MemberExpression") {
                if (node4.property.name)
                  nodeValue = node4.property.name
                else if (node4.property.value)
                  nodeValue = node4.property.value

                if (funcName4 == "")
                  funcName4 = nodeValue + funcName4;
                else
                  funcName4 = nodeValue + "." + funcName4;
                if (node4.object.name) {
                  funcName4 = node4.object.name + "." + funcName4;
                }
                node4 = node4.object;

              }
              if (funcName4 != "")
                data.returns.variables.push(funcName4);
            }

          }
        });
        real_func_names.push(data);
      }

    }
  }
}
exports.analyze = analyze;
exports.asignFunctionReturnValue = asignFunctionReturnValue;

exports.real_func_names = real_func_names;
exports.real_func_call = real_func_call;
exports.real_variable_const = real_variable_const;
exports.real_variable_var = real_variable_var;
exports.real_variable_obj = real_variable_obj;
exports.startScope = startScope;
exports.endScope = endScope;
