Ext.define('AERP.Ajax', {
	//requires: ['Ext.Ajax','Ext.Msg'],	
	singleton: true,
	//Allows overruide of default configs. Set any or all of them.
	setDefaultConfig:function(config){
		this.defaultConfig = config;
	},
	request:function(config){
		var requestObj = {
			url:'',
			params:{},
			method :'POST',
			errorTitle: 'Error!',
			errorMessage: 'Fatal Error! Please try again. <BR><BR>If error continues, contact support!',
			notificationHandler: false,
			mask: false,
			maskText: 'Loading...',
			success: Ext.emptyFn,
			failure: Ext.emptyFn,
			scope: this
		};
		requestObj = Ext.apply(requestObj, config, this.defaultConfig);
		
		requestObj.userSuccess = requestObj.success;
		requestObj.userFailure = requestObj.failure;
		requestObj.userScope = requestObj.scope;
		
		requestObj.success = this.success;
		requestObj.failure = this.failure;
		requestObj.scope = this;
		
		if(requestObj.mask){
			requestObj.mask.mask(requestObj.maskText);
		}

		return Ext.Ajax.request(requestObj);
	},
	success:function(response, options){
		if(options.mask){
			options.mask.unmask();
		}

		var result;
		try{
			result = Ext.decode(response.responseText);
		}catch(Err){
			this.userNotification(options, options.errorMessage);

			options.userFailure.call(options.userScope);
			return false;
		}

		if(result && result.success && result.success === true){
			options.userSuccess.call(options.userScope, result);
		}else{
			if(result && result.error){
				this.userNotification(options, result.error);
			}else{
				this.userNotification(options, options.errorMessage);
			}
			options.userFailure.call(options.userScope);
		}
	},
	failure:function(response, options){
		if(options.mask){
			options.mask.unmask();
		}

		if(response.aborted && response.aborted === true){
			options.userFailure.call(options.userScope);
			return true;
		}
		
		var result;
		try{
			result = Ext.decode(response.responseText);
		}catch(Err){
			this.userNotification(options, options.errorMessage);

			options.userFailure.call(options.userScope);
			return false;
		}
		if(result && result.error){
			this.userNotification(options, result.error);
		}else{
			this.userNotification(options, options.errorMessage);
		}
		options.userFailure.call(options.userScope, response.responseText);
	},
	userNotification:function(options, errorMessage){
		if(options.notificationHandler){
			options.notificationHandler.call(options.userScope, errorMessage, options);
		}else{
			Ext.Msg.alert(options.errorTitle, errorMessage);
		}
	}
});

AERP.AjaxRequest = AERP.Ajax.request.bind(AERP.Ajax);