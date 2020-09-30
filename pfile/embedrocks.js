//In minified version, need to get name of var "$messagingOptions"
//Search for noResultPromiseHelper('api.RevertAllCommand',null,this.$1l)}

//Here $1j is the $messagingOptions for 2.3.0, 2.2.2, 2.2.1
//Here $1l is the $messagingOptions for 2.4.0
//Here $1m is the $messagingOptions for 2.5.0
//Here $1n is the $messagingOptions for 2.6.0

//Se also need to get name of var "$viz"
//Search for global.tab.VizImpl=ss.mkType(a,'tab.VizImpl'  ... the 2nd var nullified is the right one
//this.$y=null;this.$1r=null; 

//Here $1p is the $viz for 2.3.0, 2.2.2, 2.2.1
//Here $1r is the $viz for 2.4.0
//Here $1s is the $viz for 2.5.0
//Here $1t is the $viz for 2.6.0

var damndetect={
	"6":{detectViz:"$1t",detectMsg:"$1n"},
	"5":{detectViz:"$1s",detectMsg:"$1m"},
	"4":{detectViz:"$1r",detectMsg:"$1l"},
	"3":{detectViz:"$1p",detectMsg:"$1j"},
	"2":{detectViz:"$1p",detectMsg:"$1j"},
	"0":{detectViz:"$viz",detectMsg:"$messagingOptions"},
}
if(tableau){
	var vstableau,detectViz,detectMsg;
	if(tableau.Version.getCurrent().$major){
		console.log(`Uncompressed Version ${tableau.Version.getCurrent().toString().split("-")[0]} Detected!!`);
		detectViz=damndetect["0"].detectViz;
		detectMsg=damndetect["0"].detectMsg;
	}
	else{
		console.log(`Minified Version ${tableau.Version.getCurrent().toString().split("-")[0]} Detected!!`);
		vstableau=tableau.Version.getCurrent().$2
		detectViz=damndetect[vstableau].detectViz;
		detectMsg=damndetect[vstableau].detectMsg;
	}

	
	Array.prototype.push=(function(){
		var original = Array.prototype.push;
		return function() {
			if(arguments[0] && arguments[0]._impl && arguments[0]._impl[detectViz]){
				console.log("Viz array ready for patch, restoring original Array prototype...");
				Array.prototype.push=original;
				this.push = function (){
					Array.prototype.push.apply(this,arguments);
					tableau.VizManager.getVizs().map((v)=>{
						if(!v.patched){
							console.log("New Viz successfully patched!!");
							v.showDataAlertDialog= function Viz$ShowDataAlertDialog() {
								sendCommand(this,"ShowDataAlertDialog");
							};
							v.showCustomViewsDialog= function Viz$ShowCustomViewsDialog() {
								sendCommand(this,"ShowCustomViewsDialog");
							};
							v.showSubscriptionDialog= function Viz$ShowSubscriptionDialog() {
								sendCommand(this,"ShowSubscribeDialog");
							}
							v.patched=true;
						}
					})
					return true;
				}
				console.log("Viz array successfully patched!!",this);
				return this.push.apply(this,arguments);
			};

			return original.apply(this,arguments);
		};
	})();
	function sendCommand(_this,command){
		var returnHandler={
			$commandName:`api.${command}`,
			$errorCallback:  function(a,b){},
			$successCallBack: function(a){},
			$successCallbackTiming:1,
			get_commandName:function(){return this.$commandName}
		}
		_this._impl[detectMsg].sendCommand(Object).call(_this._impl[detectMsg], null, returnHandler);
	}
}