Ext.define('AERP.AjaxProxyWithErrors', {
	requires: ['Ext.Ajax'],
	extend: 'Ext.data.proxy.Ajax',
	alias: 'proxy.ajaxwitherrors',
	defaultActionMethods: {
		create : 'POST',
		read   : 'POST',
		update : 'POST',
		destroy: 'POST'
	},

	config: {
		actionMethods: {
			create : 'POST',
			read   : 'POST',
			update : 'POST',
			destroy: 'POST'
		},
		proxyErrorTitle:'Error!',
		proxyErrorMessage:'Fatal Error! Please try again. <BR><BR>If error continues, contact support!'
	},

	processResponse: function(success, operation, request, response) {
		var me = this,
		exception, reader, resultSet, meta, destroyOp, result;

		if(response.responseType==='json'){
			result = response.responseJson;

			if(result && result.success && result.success === true){
				
			}else{
				if(result && result.error){
					Ext.Msg.alert(me.proxyErrorTitle, result.error);
				}else{
					Ext.Msg.alert(me.proxyErrorTitle, me.proxyErrorMessage);
				}
				success = false;
			}
		}else{
			try{
				result = Ext.decode(response.responseText);
			}catch(Err){
				Ext.Msg.alert(me.proxyErrorTitle, me.proxyErrorMessage);

				//options.userFailure.call(options.userScope);
				success = false;
			}	
		}


		// Processing a response may involve updating or committing many records
		// each of which will inform the owning stores, which will ultimately
		// inform interested views which will most likely have to do a layout
		// assuming that the data shape has changed.
		// Bracketing the processing with this event gives owning stores the ability
		// to fire their own beginupdate/endupdate events which can be used by interested
		// views to suspend layouts.
		me.fireEvent('beginprocessresponse', me, response, operation);
 
		if (success === true) {
			reader = me.getReader();
 
			if (response.status === 204) {
				resultSet = reader.getNullResultSet();
			}
			else {
				resultSet = reader.read(me.extractResponseData(response), {
					// If we're doing an update, we want to construct the models ourselves.
					recordCreator: operation.getRecordCreator() ||
					reader.defaultRecordCreatorFromServer
				});
			}
 
			if (!operation.$destroyOwner) {
				operation.$destroyOwner = me;
				destroyOp = true;
			}
			
			operation.process(resultSet, request, response);
			exception = !operation.wasSuccessful();
		}
		else {
			me.setException(operation, response);
			exception = true;
		}
		
		// It is possible that exception callback destroyed the store and owning proxy,
		// in which case we can't do nothing except punt.
		if (me.destroyed) {
			if (!operation.destroyed && destroyOp && operation.$destroyOwner === me) {
				operation.destroy();
			}
			
			return;
		}
		
		if (exception) {
			me.fireEvent('exception', me, response, operation);
		}
		// If a JsonReader detected metadata, process it now.
		// This will fire the 'metachange' event which the Store processes to fire its own
		// 'metachange'
		else {
			meta = resultSet.getMetadata();
			
			if (meta) {
				me.onMetaChange(meta);
			}
		}
 
		// Ditto
		if (me.destroyed) {
			if (!operation.destroyed && destroyOp && operation.$destroyOwner === me) {
				operation.destroy();
			}
			
			return;
		}
 
		me.afterRequest(request, success);
 
		// Tell owning store processing has finished.
		// It will fire its endupdate event which will cause interested views to 
		// resume layouts.
		me.fireEvent('endprocessresponse', me, response, operation);
		
		if (!operation.destroyed && destroyOp && operation.$destroyOwner === me) {
			operation.destroy();
		}
	},

});