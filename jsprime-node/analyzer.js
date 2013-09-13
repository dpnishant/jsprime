var source = ["location"];
var sink = ["document.write", "eval", "innerHTML", "location.replace"];
var sinkWithConstantParam = ["eval"];
var conditionalSink = [".setAttribute(href|src"];
var blackList = [];
var blackListObj = [];
var semiBlackList = [];
var semiSource = [];
var redLine = [];
var isXSS = false;
var sourceData = [];
var sourceDataOld = [];
var isSource = true;
var sinkResultArguments = [];
var sinkResultArgumentsObj = [];
var sourceList = [];
var sourceListObj = [];
var sourceListNames = [];
var convertedFunction = [];
var win;

var real_func_names = [];
var real_func_call = [];
var real_variable_const = [];
var real_variable_var = [];
var real_variable_obj = [];

var startScope = [];
var endScope = [];

var res;

exports.sink = sink;
exports.analyzeArrays = analyzeArrays;

function analyzeArrays(var1, var2, var3, var4, var5, var6, var7, sData, response) {
  real_func_names = var1;
  real_func_call = var2;
  real_variable_const = var3;
  real_variable_var = var4;
  real_variable_obj = var5;
  startScope = var6;
  endScope = var7;
  res = response;

  //console.log(JSON.stringify(sink));
  //win=window.open("result.html", '_blank');
  //var sData=document.getElementById('editor').value;
  //sData=htmlEncode(sData);

  sourceData = sData.split(/\n\r?/g);
  sourceDataOld = sData.split(/\n\r?/g);

  for (var i = 0; i < source.length; i++) {
    blackList = [];
    blackListObj = [];
    isXSS = false;
    isSource = true;
    checkAsignValue(real_variable_const, source[i], source[i], null);
    checkAsignValue(real_variable_var, source[i], source[i], null);
    //checkAsignValue(real_variable_obj,source[i],source[i],null);

    if (blackList.length > 0) {
      checkSink();
    }
    checkSinkWithDirectSource(source[i]);
  }
  traverseHighLightsVariable();
  //traverseHighLightsObject();
  traverseHighLightsFunction();
  traverseHighLightsFunctionReturn();

  traverseHighLightsVariable();
  traverseHighLightsFunction();
  //traverseHighLightsObject();

  removeUnusedSource();
  //console.log(JSON.stringify(blackList));
  writeColorCode();
  writeResult();
}

function htmlEncode(string) {
  var HTML_CHARS = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;'
  };
  return (string + '').replace(/[&<>"'\/`]/g, function (match) {
    return HTML_CHARS[match];
  });
};

function writeColorCode() {
  res.write('<span style="background: none repeat scroll 0% 0% orange;width:300px;height:25px;">&nbsp;&nbsp;&nbsp;&nbsp;Source that reached the Sink&nbsp;&nbsp;&nbsp;&nbsp;</span>');
  res.write('&nbsp;&nbsp;&nbsp;&nbsp;<span style="background: none repeat scroll 0% 0% yellow;width:300px;height:25px;">&nbsp;&nbsp;&nbsp;&nbsp;Active Source asigned to variables&nbsp;&nbsp;&nbsp;&nbsp;</span>');
  res.write('&nbsp;&nbsp;&nbsp;&nbsp;<span style="background: none repeat scroll 0% 0% LightPink;width:300px;height:25px;">&nbsp;&nbsp;&nbsp;&nbsp;Active Source passed through a function&nbsp;&nbsp;&nbsp;&nbsp;</span>');
  res.write('&nbsp;&nbsp;&nbsp;&nbsp;<span style="background: none repeat scroll 0% 0% BurlyWood;width:300px;height:25px;">&nbsp;&nbsp;&nbsp;&nbsp;Source that missed the Sink&nbsp;&nbsp;&nbsp;&nbsp;</span>');
  res.write('&nbsp;&nbsp;&nbsp;&nbsp;<span style="background: none repeat scroll 0% 0% grey;width:300px;height:25px;">&nbsp;&nbsp;&nbsp;&nbsp;Non-Active Source asigned to variables&nbsp;&nbsp;&nbsp;&nbsp;</span>');
  res.write('&nbsp;&nbsp;&nbsp;&nbsp;<span style="background: none repeat scroll 0% 0% red;width:300px;height:25px;">&nbsp;&nbsp;&nbsp;&nbsp;Active Source reached the Sink&nbsp;&nbsp;&nbsp;&nbsp;</span>');
}

function writeResult() {
  res.write("</br></br>FULL CODE</br>------------------</br></br>");

  for (var i = 0; i < sourceData.length; i++) {
    res.write((i + 1) + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + sourceData[i] + "</br>");
  }
}

function doHighlight(color, line) {
  sourceData[line - 1] = '<span style="background: none repeat scroll 0% 0% ' + color + ';">' + sourceDataOld[line - 1] + "</span>";
  //win.document.writeln(sourceData[line-1]+" ---- "+(line-1)+"</br>");
}

function traverseHighLightsVariable() {
  for (var i = 0; i < real_variable_var.length; i++) {
    for (var j = 0; j < sinkResultArguments.length; j++) {
      if (sinkResultArguments[j] == real_variable_var[i].name && sourceListNames.indexOf(sinkResultArguments[j]) == -1) {
        doHighlight("yellow", real_variable_var[i].line);
        var args = real_variable_var[i].value.split("+");
        var isSink = false;
        for (var k = 0; k < args.length; k++) {
          if (sinkResultArguments.indexOf(args[k]) == -1) {
            isSink = true;
            sinkResultArguments.push(args[k]);
            sinkResultArgumentsObj.push(real_variable_var[i]);
          }

        }
        if (isSink == true)
          traverseHighLightsVariable();
      }
    }
  }

}

function traverseHighLightsFunction() {
  for (var i = 0; i < real_func_names.length; i++) {
    for (var j = 0; j < sinkResultArguments.length; j++) {
      for (var k = 0; k < real_func_names[i].arguments.variables.length; k++) {
        if (sinkResultArguments[j] == real_func_names[i].arguments.variables[k]) {
          //sinkResultArguments.push(real_func_names[i].name);
          //doHighlight("blue",real_func_names[i].line);
          traverseHighLightsFunctionCall(real_func_names[i].name, real_func_names[i].arguments.variables[k], k);

        }
      }

    }
  }

  for (var i = 0; i < real_func_call.length; i++) {
    for (var j = 0; j < sinkResultArguments.length; j++) {
      for (var k = 0; k < sinkResultArgumentsObj[j].arguments.variables.length; k++) {
        if (real_func_call[i].name == sinkResultArgumentsObj[j].arguments.variables[k]) {
          if (sinkResultArgumentsObj.indexOf(real_func_call[i]) == -1) {
            sinkResultArguments.push(real_func_call[i].name);
            sinkResultArgumentsObj.push(real_func_call[i]);
            traverseHighLightsFunction();
          }
        }
      }

    }
  }

}

function traverseHighLightsFunctionCall(funcName, varName, pos) {
  for (var i = 0; i < real_func_call.length; i++) {
    if (real_func_call[i].name == funcName) {
      if (redLine.indexOf(real_func_call[i].line) == -1) {
        doHighlight("LightPink", real_func_call[i].line);
        for (var j = 0; j < convertedFunction.length; j++) {
          if (convertedFunction[j].name == real_func_call[i].name && convertedFunction[j].startScope == real_func_call[i].startScope && convertedFunction[j].endScope == real_func_call[i].endScope) {
            doHighlight("LightPink", convertedFunction[j].line);
            traverseConvertedFunction(convertedFunction[j]);
          }
        }
      }
      if (sinkResultArguments.indexOf(real_func_call[i].arguments.variables[pos]) == -1) {
        sinkResultArguments.push(real_func_call[i].arguments.variables[pos]);
        sinkResultArgumentsObj.push(real_func_call[i]);
        traverseHighLightsFunction();
      }
    }
  }
}

function traverseConvertedFunction(obj) {
  for (var i = 0; i < convertedFunction.length; i++) {
    if (obj.value == convertedFunction[i].name && obj.startScope == convertedFunction[i].startScope && obj.endScope == convertedFunction[i].endScope) {
      doHighlight("LightPink", convertedFunction[i].line);
      traverseConvertedFunction(convertedFunction[i]);
    }
  }
}

function traverseHighLightsFunctionReturn() {
  for (var i = 0; i < real_func_names.length; i++) {
    if (real_func_names[i].returns.variables[0] != undefined) {
      var returnValue = real_func_names[i].returns.variables[0];
      for (var j = 0; j < sinkResultArguments.length; j++) {
        if (sinkResultArguments[j] == real_func_names[i].name && sinkResultArguments.indexOf(returnValue) == -1) {
          sinkResultArguments.push(returnValue);
          sinkResultArgumentsObj.push(real_func_names[i]);
        }
      }
    }
  }

}

function removeUnusedSource() {
  for (var i = 0; i < sourceList.length; i++) {
    var isSink = false;
    var line;
    var sinkObj = sourceList[i].split("#line#");
    line = sinkObj[1];
    for (var j = 0; j < sinkResultArguments.length; j++) {
      var aVal = sinkResultArguments[j].split(".");
      var sinkVal = "";
      for (var k = 0; k < aVal.length; k++) {
        if (semiSource.indexOf(aVal[k]) != -1) {
          sinkVal = aVal[k];
        }
      }

      if ((sinkResultArguments[j] == sinkObj[0] || sinkVal == sinkObj[0]) && (sinkResultArgumentsObj[j].startScope >= sourceListObj[i].startScope && sinkResultArgumentsObj[j].endScope <= sourceListObj[i].endScope)) {
        isSink = true;
      } else {
        for (var k = 0; k < real_func_names.length; k++) {
          if (real_func_names[k].line == sinkResultArgumentsObj[j].startScope) {
            for (var t = 0; t < real_func_call.length; t++) {
              if (real_func_names[k].name == real_func_call[t].name) {
                for (var m = 0; m < sinkResultArgumentsObj.length; m++) {
                  if (sinkResultArgumentsObj[m].value == real_func_call[t].name && sinkResultArgumentsObj[m].startScope == real_func_call[t].startScope && sinkResultArgumentsObj[m].endScope == real_func_call[t].endScope) {
                    isSink = true;
                    break;
                  }
                  if (real_func_call[t].arguments.variables.indexOf(sinkResultArgumentsObj[m].name) != -1 && sinkResultArgumentsObj[m].startScope == real_func_call[t].startScope && sinkResultArgumentsObj[m].endScope == real_func_call[t].endScope) {
                    isSink = true;
                    break;
                  }
                }
              }
              if (isSink == true) {
                break;
              }
            }
          }
          if (isSink == true) {
            break;
          }
        }
      }
    }
    if (isSink == false) {
      doHighlight("BurlyWood", line);
    }
  }
}

function checkAsignValue(obj, source, actualSource, sourceObj) {
  for (var i = 0; i < obj.length; i++) {
    if (obj[i].value != undefined) {
      var multipleValue = obj[i].value.split("+");
      var isPass = false;

      for (var j = 0; j < multipleValue.length; j++) {
        var aVal = multipleValue[j].split(".");
        for (var k = 0; k < aVal.length; k++) {
          if (semiSource.indexOf(aVal[k]) != -1 && sourceObj != null) {
            semiSource.push(obj[i].name);
            isPass = true;
            break;
          }
        }
      }

      if (obj[i].value.indexOf(actualSource) != -1 || multipleValue.indexOf(source) != -1 || isPass == true) {
        var isScope = true;
        for (var j = 0; j < multipleValue.length; j++) {
          if (multipleValue[j] == source && sourceObj != null) {
            if (sourceObj.startScope && obj[i].line) {
              if (obj[i].line >= sourceObj.startScope && obj[i].line <= sourceObj.endScope) {
                for (var k = i - 1; k >= 0; k--) {
                  if (obj[k].name == multipleValue[j]) {
                    if (obj[k] != sourceObj) {
                      isScope = false;
                    }
                  }
                }
              } else {
                isScope = false;
              }
              if (isScope == true) {
                for (var k = 0; k < real_func_names.length; k++) {
                  if (real_func_names[k].line == obj[i].startScope) {
                    for (var p = 0; p < real_func_names[k].arguments.variables.length; p++) {
                      if (real_func_names[k].arguments.variables[p] == multipleValue[j]) {
                        isScope = false;
                        for (var m = 0; m < real_func_call.length; m++) {
                          if (real_func_call[m].name == real_func_names[k].name) {
                            for (var n = 0; n < real_func_call[m].arguments.variables.length; n++) {
                              if (blackList.indexOf(real_func_call[m].arguments.variables[n]) != -1) {
                                isScope = true;
                                break;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }

        }
        if (isScope == false) {
          continue;
        }
        if (obj[i].value.indexOf(actualSource) != -1) {
          isSource = true;
        }
        if (blackList.indexOf(obj[i].name) == -1) {
          blackList.push(obj[i].name);
          blackListObj.push(obj[i]);

          if (isSource == true) {
            doHighlight("orange", obj[i].line);
            sourceList.push(obj[i].name + "#line#" + obj[i].line);
            sourceListNames.push(obj[i].name);
            sourceListObj.push(obj[i]);
            semiSource.push(obj[i].name);
          } else {
            doHighlight("grey", obj[i].line);
          }

          isSource = false;
          checkAsignValue(real_variable_const, obj[i].name, actualSource, obj[i]);
          checkAsignValue(real_variable_var, obj[i].name, actualSource, obj[i]);
          //checkAsignValue(real_variable_obj,obj[i].name,actualSource,obj[i]);
          checkFunctionCallee(obj[i].name, actualSource, obj[i]);
          checkFunctionReturnValue(obj[i].name, actualSource, obj[i]);

        }
        isSource = false;
      }
    }
  }
}

function checkFunctionCallee(val, actualSource, sourceObj) {
  for (var i = 0; i < real_func_call.length; i++) {
    for (var j = 0; j < real_func_call[i].arguments.variables.length; j++) {
      var args = (real_func_call[i].arguments.variables[j] || "").split("+");
      for (var k = 0; k < args.length; k++) {
        if (args[k] == val) {
          checkPassValueToFunction(real_func_call[i].name, args[k], j, actualSource, sourceObj);
        }
      }
    }
  }
}

function checkPassValueToFunction(name, val, pos, actualSource, sourceObj) {
  for (var i = 0; i < real_func_names.length; i++) {

    if (name == real_func_names[i].name) {
      blackList.push(real_func_names[i].arguments.variables[pos]);
      blackListObj.push(real_func_names[i]);
      //checkAsignValue(real_variable_obj,real_func_names[i].arguments.variables[pos],actualSource,sourceObj);
      checkAsignValue(real_variable_var, real_func_names[i].arguments.variables[pos], actualSource, sourceObj);
    }
  }
}

function checkFunctionReturnValue(val, actualSource, sourceObj) {
  for (var i = 0; i < real_func_names.length; i++) {
    var returnValue = "";
    if (real_func_names[i].returns.variables[0] != undefined) {
      returnValue = real_func_names[i].returns.variables[0];
    }
    if (returnValue != "") {
      if (blackList.indexOf(returnValue) != -1 && blackList.indexOf(real_func_names[i].name) == -1) {
        blackList.push(real_func_names[i].name);
        blackListObj.push(real_func_names[i]);
        //checkAsignValue(real_variable_obj,real_func_names[i].name,actualSource,real_func_names[i]);
        checkAsignValue(real_variable_var, real_func_names[i].name, actualSource, real_func_names[i]);
      }
    }
  }

}

function checkSinkWithDirectSource(source) {
  for (var i = 0; i < sink.length; i++) {
    for (var j = 0; j < real_func_call.length; j++) {
      if (real_func_call[j].name.indexOf(sink[i]) != -1) {
        for (var k = 0; k < real_func_call[j].arguments.variables.length; k++) {
          var args = real_func_call[j].arguments.variables[k].split("+");
          for (var l = 0; l < args.length; l++) {
            if (args[l].indexOf(source) != -1) {
              doHighlight("red", real_func_call[j].line);
              isXSS = true;
            }
          }
        }

        if (sinkWithConstantParam.indexOf(sink[i]) != -1) {
          for (var k = 0; k < real_func_call[j].arguments.literals.length; k++) {
            var args = real_func_call[j].arguments.literals[k].split("+");
            for (var l = 0; l < args.length; l++) {
              if (args[l].indexOf(source) != -1) {
                doHighlight("red", real_func_call[j].line);
                redLine.push(real_func_call[j].line);
                isXSS = true;
              }
            }
          }
        }
      }
    }

    for (var j = 0; j < real_variable_var.length; j++) {
      if (real_variable_var[j].name.indexOf(sink[i]) != -1) {
        var multipleValue = real_variable_var[j].value.split("+");
        for (var k = 0; k < multipleValue.length; k++) {
          if (multipleValue[k].indexOf(source) != -1) {
            doHighlight("red", real_variable_var[j].line);
            redLine.push(real_variable_var[j].line);
            sinkResultArguments.push(real_variable_var[j].name);
            sinkResultArgumentsObj.push(real_variable_var[j]);
            isXSS = true;
          }
        }
      }
    }

  }
}

function checkSink() {
  for (var i = 0; i < sink.length; i++) {
    for (var j = 0; j < blackList.length; j++) {
      checkInFunctionCall(sink[i], blackList[j], blackListObj[j]);
      checkInAssignToSink(sink[i], blackList[j], blackListObj[j]);
    }
  }

  for (var i = 0; i < conditionalSink.length; i++) {
    for (var j = 0; j < blackList.length; j++) {
      checkInFunctionCall(conditionalSink[i], blackList[j], blackListObj[j]);
    }
  }
}

function checkInFunctionCall(sink, val, sinkObj) {
  var conditionalSinkObj = sink.split("(");
  sink = conditionalSinkObj[0];

  for (var i = 0; i < real_func_call.length; i++) {
    if (real_func_call[i].name) {
      if (real_func_call[i].name.indexOf(sink) != -1) {
        for (var j = 0; j < real_func_call[i].arguments.variables.length; j++) {
          var args = real_func_call[i].arguments.variables[j].split("+");
          for (var k = 0; k < args.length; k++) {
            if (args[k] == val) {
              var isScope = true;
              for (var p = 0; p < real_variable_var.length; p++) {
                if (real_variable_var[p].line <= real_func_call[i].line && real_variable_var[p].line > sinkObj.line) {
                  if (real_variable_var[p].name == args[k]) {
                    var obj = real_variable_var[p].value.split(".")
                    if (obj[0] != real_variable_var[p].name && blackList.indexOf(obj[0]) == -1) {
                      isScope = false;
                      break;
                    }
                  }
                }

                if (sinkObj.name == real_variable_var[p].name) {
                  if (sinkObj != real_variable_var[p] && !(sinkObj.startScope == real_variable_var[p].startScope && sinkObj.endScope == real_variable_var[p].endScope)) {
                    isScope = false;
                  } else {
                    isScope = true;
                  }
                }
                if (real_variable_var[p].line == real_func_call[i].line) {
                  break;
                }
              }

              if (isScope == true) {
                if (real_func_call[i].line > sinkObj.endScope || real_func_call[i].line < sinkObj.startScope) {
                  isScope = false;
                }
              }
              //if(isScope==true)
              //{
              for (var t = 0; t < real_func_names.length; t++) {
                if (real_func_names[t].line == real_func_call[i].startScope || real_func_names[t].line == (real_func_call[i].startScope - 1)) {
                  for (var p = 0; p < real_func_names[t].arguments.variables.length; p++) {
                    if (real_func_names[t].arguments.variables[p] == args[k]) {
                      isScope = false;
                    }
                  }
                  if (isScope == false) {
                    for (var p = 0; p < real_func_call.length; p++) {
                      if (real_func_call[p].name == real_func_names[t].name) {
                        for (var x = 0; x < real_func_call[p].arguments.variables.length; x++) {
                          if (blackList.indexOf(real_func_call[p].arguments.variables[x]) != -1) {
                            isScope = true;
                            sinkResultArguments.push(real_func_call[p].arguments.variables[x]);
                            sinkResultArgumentsObj.push(real_func_call[p]);
                          }
                        }
                      }
                    }
                  }
                  if (isScope == true) {
                    break;
                  }
                }
              }
              //}
              if (isScope == true) {
                if (conditionalSinkObj[1]) {
                  isScope = false;
                  var expectedValue = conditionalSinkObj[1].split("|");
                  var params = real_func_call[i].arguments.literals;
                  for (var e1 = 0; e1 < expectedValue.length; e1++) {
                    if (params.indexOf(expectedValue[e1]) != -1) {
                      isScope = true;
                      break;
                    }
                  }
                }
              }

              if (isScope == true) {
                doHighlight("red", real_func_call[i].line);
                redLine.push(real_func_call[i].line);
                sinkResultArguments.push(args[k]);
                sinkResultArgumentsObj.push(real_func_call[i]);
                isXSS = true;
              }
            }
          }
        }
        if (sinkWithConstantParam.indexOf(sink) != -1) {
          for (var j = 0; j < real_func_call[i].arguments.literals.length; j++) {
            var args = real_func_call[i].arguments.literals[j].split("+");
            for (var k = 0; k < args.length; k++) {
              if (args[k] == val) {
                doHighlight("red", real_func_call[i].line);
                redLine.push(real_func_call[i].line);
                sinkResultArguments.push(args[k]);
                sinkResultArgumentsObj.push(real_func_call[i]);
                isXSS = true;
              }
            }
          }
        }
      }
    }
  }
}

function checkInAssignToSink(sink, val, sinkObj) {
  for (var i = 0; i < real_variable_var.length; i++) {
    if (real_variable_var[i].name.indexOf(sink) != -1) {
      var multipleValue = real_variable_var[i].value.split("+");
      for (var j = 0; j < multipleValue.length; j++) {
        if (multipleValue[j] == val) {
          var isScope = true;
          for (var p = 0; p < real_variable_var.length; p++) {
            if (sinkObj.name == real_variable_var[p].name) {

              if (real_variable_var[p].line <= real_variable_var[i].line && real_variable_var[p].line > sinkObj.line) {
                var obj = real_variable_var[p].value.split(".")
                if (obj[0] != real_variable_var[p].name && blackList.indexOf(obj[0]) == -1) {
                  isScope = false;
                  break;
                }
              }

              if (sinkObj != real_variable_var[p] && !(sinkObj.startScope == real_variable_var[p].startScope && sinkObj.endScope == real_variable_var[p].endScope)) {
                isScope = false;
              } else {
                isScope = true;
              }
            }
            if (real_variable_var[p].line == real_variable_var[i].line) {
              break;
            }
          }
          if (isScope == true) {
            for (var k = 0; k < real_func_names.length; k++) {
              if (real_func_names[k].line == real_variable_var[i].startScope || real_func_names[k].line == (real_variable_var[i].startScope - 1)) {
                for (var p = 0; p < real_func_names[k].arguments.variables.length; p++) {
                  if (real_func_names[k].arguments.variables[p] == multipleValue[j]) {
                    isScope = false;
                  }
                }

                if (isScope == false) {
                  for (var p = 0; p < real_func_call.length; p++) {
                    if (real_func_call[p].name == real_func_names[k].name) {
                      for (var x = 0; x < real_func_call[p].arguments.variables.length; x++) {
                        if (blackList.indexOf(real_func_call[p].arguments.variables[x]) != -1) {
                          isScope = true;
                          sinkResultArguments.push(real_func_call[p].arguments.variables[x]);
                          sinkResultArgumentsObj.push(real_func_call[p]);
                        }
                      }
                    }
                  }
                }
              }
            }
          }

          if (isScope == true) {
            if (real_variable_var[i].line > sinkObj.endScope || real_variable_var[i].line < sinkObj.startScope) {
              isScope = false;
            }
          }
          if (isScope == true) {
            doHighlight("red", real_variable_var[i].line);
            redLine.push(real_variable_var[i].line);
            sinkResultArguments.push(val);
            sinkResultArgumentsObj.push(real_variable_var[i]);
            isXSS = true;
          }
          break;
        }
      }
    }
  }
}
