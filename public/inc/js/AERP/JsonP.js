
Ext.define('AERP.JsonP', {
	//requires: ['Ext.Ajax','Ext.Msg'],
	singleton: true,
	request:function(config){
	
		var defaults = {
				url:''
				,params:{}
				,method :'POST'
				,success: Ext.emptyFn
				,failure: Ext.emptyFn
				,scope: this
				,errorMessage: 'Fatal Error! Please try again. <BR><BR>If error continues, contact support!'
			};
		var config = Ext.Object.merge(defaults, config);
		
		return Ext.data.JsonP.request({
			url:config.url,
			method :config.method ,
			params:config.params,
			success:function(result){
		
				if(result.success && result.success === true){
					config.success.call(config.scope, result);
				}else{
					if(result.error){
						Ext.Msg.alert('Error!', result.error);
					}else{
						Ext.Msg.alert('Error!', config.errorMessage);
					}
					config.failure.call(config.scope);
				}
		
			},
			failure:function(response){
			
				if(result.error){
					Ext.Msg.alert('Error!', result.error);
				}else{
					Ext.Msg.alert('Error!', config.errorMessage);
				}
			},
			scope:this
		});
	}
});