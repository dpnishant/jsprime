var msg="DOM XSS Confirmed !!";
var domInject=[];
var domInjectSource=[];
function executeJSPrime()
{  
	var sOrangeData=document.getElementById('aOrangeData').value;
	var sOtherData=document.getElementById('aOtherData').value;
	var sRedData=document.getElementById('aRedData').value;
	var sSink=document.getElementById('aSink').value;
	var sSource=document.getElementById('aSource').value;

	var aOrangeData=sOrangeData.split(",");
	var aOtherData=sOtherData.split(",");
	var aRedData=sRedData.split(",");
	domInject=sSink.split(",");
	domInjectSource=sSource.split(",");

	var aScr=document.getElementsByTagName('script')[0].innerHTML.split("\n");

	var aDuplicate=[];
	for(var i=0;i<aOrangeData.length-1;i++)
	{
		var tempData;
		try
		{
			if(aDuplicate.indexOf(sOtherData[i])!=-1)
				continue;
			aDuplicate.push(sOtherData[i]);
			
			var data=aScr[parseInt(aOrangeData[i])];
			var aSource=data.split("=");			
			aSource[1]="\"alert('"+msg+"');//<img src='1' onerror='alert(msg)' />\"";
			
			data=aSource.join("="); 
			tempData=data;
			eval(data);
		}
		catch(err)
		{
			try
			{
				if(err.message.indexOf("is not defined")!=-1)
				{
					var newVar=err.message.replace(" is not defined","");
					eval("var "+newVar);
					eval(tempData);
				}
			}
			catch(err2)
			{
				//alert(err2);
			}
		}
	}

	for(var j=0;j<2;j++)
	{
		var tempData;
		var aDuplicate=[];
		for(var i=0;i<aOtherData.length-1;i++)
		{
			try
			{
				if(aDuplicate.indexOf(aOtherData[i])!=-1)
					continue;
				aDuplicate.push(aOtherData[i]);
				
				var data=aScr[parseInt(aOtherData[i])];				
				if(eval(data)==undefined);
				{
					if(j==1)
					{
						var aSource=data.split("=");
						aSource[1]="\"alert('"+msg+"');//<img src='1' onerror='alert(msg)' />\"";
						data=aSource.join("=");
						eval(data);
					}
				}
				tempData=data;
			}
			catch(err)
			{
				try
				{
					if(err.message.indexOf("is not defined")!=-1)
					{
						var newVar=err.message.replace(" is not defined","");
						eval("var "+newVar);
						eval(tempData);
					}
				}
				catch(err2)
				{
					//alert(err2);
				}
			}
		}
	}	
		
	for(var i=0;i<aRedData.length-1;i++)
	{
		var tempData;
		try
		{
			var data=aScr[parseInt(aRedData[i])];
			var aSource=data.split("=");
			for(var j=0;j<domInject.length;j++)
			{
				if(aSource[0].indexOf(domInject[j])!=-1)
				{
					aSource[0]="document.getElementsByTagName('body')[0].innerHTML";
					for(var k=0;k<domInjectSource.length;k++)
					{
						if(aSource[1].indexOf(domInjectSource[k])!=-1)
						{
							aSource[1]="\"alert('"+msg+"');//<img src='1' onerror='alert(msg)' />\"";
						}
					}
					data=aSource.join("=");
				}
			}
			tempData=data;
			eval(data);
		}
		catch(err)
		{
			try
			{
				if(err.message.indexOf("is not defined")!=-1)
				{
					var newVar=err.message.replace(" is not defined","");
					eval("var "+newVar);
					eval(tempData);
				}
			}
			catch(err2)
			{
				//alert(err2);
			}
		}
	}

	/*
	try
	{
		eval(aScr[7]);
	}
	catch(err)
	{
		alert(err);
	}
	*/

}
