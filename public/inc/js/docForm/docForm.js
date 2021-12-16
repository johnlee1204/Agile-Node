Ext.define('DocForm',{

	config: {
		docFormSubs: [],
		docFormEventsDisabled:false
	},
	docFormAppLinks:{
		quoteNo:'quote',
		salesOrderNo:'salesOrder',
		consultantNo:'consultant',
		jobNo:'job',
		itemMasterNo:'itemMaster',
		opportunityNo:'opportunity',
		repNo:'rep',
		projectNo: 'project',
		dealerNo:'dealer',
		partNo:'itemMaster',
		customerFeedback:'customerFeedback',
		vendor:'vendor',
		vendorInvoice:'vendorInvoice',
		purchaseOrder:'purchaseOrder',
		shipper:'shipper'
	},
	docFormDebug:function(msg){
		if(this.docFormDebugMode){
			console.log('docFormId '+this.docFormId+', '+this.getItemId()+': '+msg);
		}
	},
	docFormInitilizeToolbar:function(config){

		if(!config.hasOwnProperty('toolbarId')){
			return;
		}

		var toolbar = this.queryById(config.toolbarId);
		toolbar.setHeight(27);

		this.btnFunctions = {
			'newFn':this.docFormNew, //Move into new state
			'addFn':Ext.emptyFn, //Call add function
			'saveFn':Ext.emptyFn,
			'cancelFn':this.docFormCancel,
			'deleteFn':Ext.emptyFn,
			'searchFn':Ext.emptyFn,
			'browseFn':Ext.emptyFn,
		};

		var fnNames = Object.keys(this.btnFunctions);
		for(var i in fnNames){
			if(config.hasOwnProperty(fnNames[i])){
				this.btnFunctions[fnNames[i]] = this[config[fnNames[i]]];
			}
		}

		this.docFormBtns.newBtn = Ext.create({
			xtype: 'button',
			icon: '/inc/img/silk_icons/add.png',
			text: 'New',
			listeners: {
				click: this.btnFunctions.newFn,
				scope:this
			}
		});

		this.docFormBtns.saveBtn = Ext.create({
			xtype: 'button',
			icon: '/inc/img/silk_icons/disk.png',
			text: 'Save',
			tooltip: 'Ctrl+S',
			listeners: {
				click: function(){
					this.docFormBtns.saveBtn.blur();
					Ext.defer(function(){
						if(this.docFormCurrentState == 'edit'){
							this.btnFunctions.saveFn.call(this);
						}

						if(this.docFormCurrentState == 'new'){
							this.btnFunctions.addFn.call(this);
						}
					},1,this);

				},
				scope:this
			}
		});

		this.docFormBtns.cancelBtn = Ext.create({
			xtype: 'button',
			icon: '/inc/img/silk_icons/cross.png',
			text: 'Cancel',
			tooltip: 'Ctrl+Z',
			listeners: {
				click: this.btnFunctions.cancelFn,
				scope:this
			}
		});

		this.docFormBtns.deleteBtn = Ext.create({
			xtype: 'button',
			icon: '/inc/img/silk_icons/delete.png',
			text: 'Delete',
			listeners: {
				click: function(){
					Ext.Msg.show({
						title:'Delete?',
						message: 'Are you sure you want to delete?',
						buttons: Ext.Msg.YESNO,
						icon: Ext.Msg.WARNING,
						fn: function(btn) {
							if (btn === 'yes') {
								this.btnFunctions.deleteFn.call(this);
							}
						},
						scope:this
					});
				},
				scope:this
			}
		});

		this.docFormBtns.searchBtn = Ext.create({
			xtype: 'button',
			icon: '/inc/img/silk_icons/magnifier.png',
			text: 'Search',
			tooltip: 'Ctrl+F / Ctrl+S',
			listeners: {
				click: function(){
					if(this.btnFunctions.searchFn === Ext.emptyFn){
						return true;
					}
					if(this.docFormCurrentState == 'search'){
						this.docFormPerformSearch();
					}else{
						this.docFormSetStateIfNoChanges('search');
					}
				},
				scope:this
			}
		});

		this.docFormBtns.browseBtn = Ext.create({
			xtype: 'button',
			icon: '/inc/img/silk_icons/table_multiple.png',
			text: 'Browse',
			listeners: {
				click: this.btnFunctions.browseFn,
				scope:this
			}
		});

		this.docFormBtns.statusLabel = Ext.create({
			xtype: 'tbtext',
			cls: 'docFormStatusLabel',
			html: '[Status]',
			width: 100
		});

		this.docFormBtns.containerStructure = Ext.create({
			xtype: 'container',
			defaults: {
				layout: 'fit',
				width: 80,
				margin: '0 8 0 8'
			},
			layout: {
				type: 'hbox',
				align: 'stretch'
			}
		});

		var newSaveArray = [];
		var hideNewBtn = config.hideNewButton || false;
		if(!hideNewBtn && (this.btnFunctions.newFn != this.docFormNew || this.btnFunctions.addFn != Ext.emptyFn)){
			newSaveArray.push(this.docFormBtns.newBtn);
		}

		if(this.btnFunctions.saveFn != Ext.emptyFn || this.btnFunctions.addFn != Ext.emptyFn){
			newSaveArray.push(this.docFormBtns.saveBtn);
		}

		if(newSaveArray.length > 0){
			this.docFormBtns.containerStructure.add({
				xtype: 'container',
				items: newSaveArray
			});
		}

		if(this.btnFunctions.searchFn != Ext.emptyFn){
			this.docFormBtns.containerStructure.add({
				xtype: 'container',
				items: this.docFormBtns.searchBtn
			});
		}

		if(this.btnFunctions.browseFn != Ext.emptyFn){
			this.docFormBtns.containerStructure.add({
				xtype: 'container',
				items: this.docFormBtns.browseBtn
			});
		}

		//Always add the cancel button
		this.docFormBtns.containerStructure.add({
			xtype: 'container',
			items: this.docFormBtns.cancelBtn
		});

		if(this.btnFunctions.deleteFn != Ext.emptyFn){
			this.docFormBtns.containerStructure.add({
				xtype: 'container',
				items: this.docFormBtns.deleteBtn
			});
		}

		toolbar.insert(0,this.docFormBtns.containerStructure);

		toolbar.add([{xtype: 'tbfill'},this.docFormBtns.statusLabel]);
	},
	docFormGetAllFieldValues:function(){
		var allFormData = {};
		this.docFormEachField(function(field){
			allFormData[field.getItemId()] = field.getSubmitValue();
		});
		return allFormData;
	},
	docFormConfirmContinue:function(continueCallback, cancelCallback){
		cancelCallbackFn = cancelCallback || Ext.emptyFn;
		this.docFormDebug('docFormConfirmContinue');

		var localScope = this;
		setTimeout(function(){
			var unsavedPrompt = Ext.Msg.show({
				title:'Warning!',
				message: 'You have unsaved changes<br /></br>You will LOSE these if you continue.',
				buttons: Ext.Msg.YESNO,
				buttonText:{
					yes:'Continue',
					no:'Cancel'
				},
				icon: Ext.Msg.WARNING,
				fn: function(btn) {
					if (btn === 'yes') {
						continueCallback.call(this);
					}else{
						cancelCallbackFn.call(this);
					}
				},
				scope:localScope
			});

			//Set the "cancel" button to be focued, to prevent accidental continues.
			unsavedPrompt.defaultButton = 2;
			unsavedPrompt.focus();
		},1);

	},
	docFormUnsavedChangesConfirmContinue:function(confirmFunction, cancelFunction){
		this.docFormDebug('docFormUnsavedChangesConfirmContinue');

		if(!this.docFormHasChangesAnywhere() || this.docFormCurrentState === 'search'){
			confirmFunction.call(this);
			return;
		}

		this.docFormConfirmContinue(confirmFunction, cancelFunction);
	},
	docFormLoadFormData:function(params){
		//Used for viewing a document

		this.docFormEventsDisabled = true;

		if(!params){
			params = {};
		}
		if(!params.hasOwnProperty('data')){
			params.data = {};
		}
		if(!params.hasOwnProperty('comboData')){
			params.comboData = {};
		}

		if(!params.hasOwnProperty('storeData')){
			params.storeData = {};
		}

		if(!params.hasOwnProperty('parentId')){
			params.parentId = null;
		}

		this.docFormSetStores(params.storeData);
		this.docFormSetParentId(params.parentId);
		this.docFormSetValues(params.data, params.comboData);

		this.docFormSetState('view');
	},
	docFormGetCurrentDocument:function(){
		return this.docFormCurrentDocument;
	},
	//Used to add a new entry (Perhaps with some starting data)
	docFormNew:function(params){
		this.docFormUnsavedChangesConfirmContinue(function(){
			this.docFormNewConfirmed(params);
		});
	},
	docFormNewConfirmed:function(params){


		this.docFormEventsDisabled = true;

		if(!params){
			params = {};
		}

		if(!params.data){
			params.data = {};
		}
		if(!params.hasOwnProperty('comboData')){
			params.comboData = {};
		}
		this.fireEvent('docformbeforenew',params);
		this.docFormLoadValuesIntoForm(params.data, params.comboData);
		this.docFormEmptyStores();
		this.docFormEmptyParentId();

		this.docFormSetState('new');
		if(params.hasOwnProperty('disableFields')){
			for(var i=0,il=params.disableFields.length;i<il;i++){
				var field =  this.queryById(params.disableFields[i]);
				field.setReadOnly(true);
				field.addCls('docFormReadOnly');
			}
		}
	},
	docFormPerformSearch:function(){
		var searchValues = {},
			value;
		this.docFormEachField(function(field){
			if(field.docFormSearchable){
				value = field.getSubmitValue();
				if(value !== "" ){
					searchValues[field.getName()] = value;
				}
			}
		});
		this.btnFunctions.searchFn.call(this,searchValues);
	},
	docFormSetSearchableFields:function(fieldIds){
		this.docFormEachField(function(field){
			var itemId = field.getItemId();
			field.docFormSearchable = (fieldIds.indexOf(itemId) != -1);
		});
	},
	docFormSetFieldsMaxLength:function(fields){
		for(var id in fields){
			if(this.docFormFields.hasOwnProperty(id) ){
				//type ahead combos get weird, don't set max len for combos
				if(this.docFormFields[id].getXType() == 'combo' || this.docFormFields[id].getXType() == 'combobox'){
					continue;
				}
				this.docFormFields[id].maxLength = fields[id];
				this.docFormFields[id].enforceMaxLength = true;
				if(this.docFormFields[id].inputEl){
					this.docFormFields[id].inputEl.dom.maxLength = fields[id];
				}
			}
		}
	},
	docFormHighlightChangedField:function(field){
		if(this.docFormCheckFieldChanged(field) ){
			field.addCls('docFormChanged');
		}else{
			field.removeCls('docFormChanged');
		}
	},
	docFormChange:function(target){

		if(this.docFormEventsDisabled){
			return;
		}

		if(this.docFormId != target.docFormId){
			return;
		}
		//if(!this.hasOwnProperty('docFormRawData') || !this.docFormRawData.hasOwnProperty(target.name)){
		//	return;
		//}

		if(this.docFormCurrentState === 'new'){
			this.docFormHighlightChangedField(target);
		}

		if(this.docFormCurrentState !== 'view' && this.docFormCurrentState !== 'edit') {
			return;
		}
		//var originalValue = this.docFormRawData[target.name];


		this.docFormHighlightChangedField(target);
		if(this.docFormCheckFieldChanged(target) ) {
			this.docFormSetState('edit');
			return; //no need to check if the form is clean, we clearly aren't.
		}
		var formHasChanges = this.docFormCheckAllFieldsForChanges();
		if(formHasChanges){
			this.docFormSetState('edit');
		}else{
			this.docFormSetState('view');
		}
	},
	docFormCheckFieldChanged:function(field){
		var originalValue = this.docFormNullsToBlanks(field.originalValue)+'';
		var checkValue = this.docFormNullsToBlanks(field.getValue())+'';

		//for currency fields convert to float and dont convert blanks to float because it's NaN
		if(field.config && field.config.formatCurrency && originalValue !=='' && checkValue !== ''){
			originalValue = this.docFormCurrencyStripFormatting(originalValue);
			checkValue = this.docFormCurrencyStripFormatting(checkValue);
			let precision = field.hasOwnProperty('formatCurrencyDecimals') ? field.formatCurrencyDecimals : 2;
			return parseFloat(originalValue).toFixed(precision) !== parseFloat(checkValue).toFixed(precision);
		}

		return (originalValue !== checkValue);
	},
	docFormCheckAllFieldsForChanges:function(){
		var formHasChanges = false;
		this.docFormEachField(function(field){
			if(this.docFormCheckFieldChanged(field)){
				formHasChanges = true;
				return;
			}
		});
		return formHasChanges;
	},
	docFormChildrenHaveChangesAnywhere:function() {
		var hasChanges = false;
		this.docFormSubs.forEach(function(child) {
			if(child.docFormHasChangesAnywhere()) {
				hasChanges = true;
			}
		});
		return hasChanges;
	},
	docFormHasChangesAnywhere:function(){
		this.docFormDebug('docFormHasChangesAnywhere');
		//checks immediate fields and all sub children

		var hasChangesAnywhere = false;

		this.docFormEachField(function(field){
			if(this.docFormCheckFieldChanged( field)){
				hasChangesAnywhere = true;
				return;
			}
		});

		var docFormSubLen = this.docFormSubs.length;

		while(docFormSubLen--){

			var subDirty = this.docFormSubs[docFormSubLen].docFormCheckAllFieldsForChanges();
			if(subDirty){
				this.docFormDebug('dirty child');
				this.docFormSubs[docFormSubLen].docFormDebug('im dirty');
			}
			hasChangesAnywhere = hasChangesAnywhere || subDirty;
		}

		return hasChangesAnywhere;
	},
	docFormNullsToBlanks:function(value){
		if(value === null){
			return '';
		}
		return value;
	},
	docFormResetFieldsToLoadedData:function(){
		this.docFormSetStores(this.docFormStoreData);
		this.docFormSetParentId(this.docFormParentId);
		this.docFormSetValues(this.docFormCurrentDocument, this.docFormComboData);
	},
	//Change some fields without saving
	docFormChangeValues:function(values, comboData){
		Ext.suspendLayouts();
		this.docFormEachField(function(field){
			if((field.getXType() === 'combobox' || field.getXType() === 'combo') && comboData && comboData.hasOwnProperty(field.name) ){
				this.docFormGetFieldStore(field).loadData(comboData[field.name]);
			}
			var itemId = field.getItemId();
			if(values.hasOwnProperty(itemId)){
				field.setValue(values[itemId]);
			}
			if(field.formatCurrency){
				this.docFormCurrencyFieldFormat(field);
			}
		});
		Ext.resumeLayouts(true);
	},
	//Changes some fields that were updated from the database - will "reset" these fields as if they were already saved.
	docFormChangeUpdatedValues:function(values, comboData){
		Ext.suspendLayouts();

		//This will update the form and combo data objects, allowing the newer values and combo data to update the older ones.
		this.docFormCurrentDocument = Ext.Object.merge(this.docFormCurrentDocument,values);
		this.docFormComboData = Ext.Object.merge(this.docFormComboData,comboData);

		this.docFormEachField(function(field){
			if((field.getXType() === 'combobox' || field.getXType() === 'combo') && comboData && comboData.hasOwnProperty(field.name) ){
				this.docFormGetFieldStore(field).loadData(comboData[field.name]);
				field.resetOriginalValue();
				this.docFormChange(field);
			}
			var itemId = field.getItemId();
			if(values.hasOwnProperty(itemId)){
				field.setValue(values[itemId]);
				field.resetOriginalValue();
				if(field.formatCurrency){
					this.docFormCurrencyFieldFormat(field);
				}
				this.docFormChange(field);
			}
		});
		Ext.resumeLayouts(true);
	},

	docFormSetSingleStore: function(storeName, storeData) {
		this.docFormStoreData[storeName] = storeData;
		this.getViewModel().getStore(storeName).loadData(storeData);
	},
	docFormSetParentId: function(parentId) {
		this.docFormParentId = parentId;
		this.docFormSubs.forEach(function(child) {
			child.docFormParentId = parentId;
		});
	},
	docFormSetStores: function(stores) {
		this.docFormStoreData = stores;
		for (var key in stores) {
			this.getViewModel().getStore(key).loadData(stores[key]);
		}
	},
	docFormGetFieldStore:function(field){
		var store = field.getStore();
		if(!store){
			throw "no store found";
		}else{
			if(store.storeId === "ext-empty-store" ){
				if(field.config.bind && field.config.bind.store){
					var viewModel = this.getViewModel();
					if(viewModel){
						var storeBind = field.config.bind.store.substr(1,field.config.bind.store.length-2);
						return viewModel.getStore(storeBind);
					}else{
						throw "no store found";
					}
				}else{
					throw "no store found";
				}
			}else{
				return store;
			}
		}
	},
	//used for auto setting values when going into new state. Does not update current document
	docFormLoadValuesIntoForm:function(values, comboData){
		Ext.suspendLayouts();
		this.docFormEmptyFields();
		this.docFormEachField(function(field){
			if((field.getXType() === 'combobox' || field.getXType() === 'combo' || field.getXType() === 'tagfield') && comboData && comboData.hasOwnProperty(field.name) ){
				this.docFormGetFieldStore(field).loadData(comboData[field.name]);
			}
		});

		this.docFormEachField(function(field){
			var itemId = field.getItemId();
			if(values.hasOwnProperty(itemId)){
				field.setValue(values[itemId]);
				field.resetOriginalValue();
			}
			if(field.formatCurrency){
				this.docFormCurrencyFieldFormat(field);
			}
		});

		Ext.resumeLayouts(true);
	},
	//Load a docForm
	docFormSetValues:function(values, comboData){
		this.docFormLoadValuesIntoForm(values,comboData);
		this.docFormCurrentDocument = values;
		this.docFormComboData = comboData;
	},
	docFormFieldRemoveReadOnly:function(field){
		field.setReadOnly(false);
		field.removeCls('docFormReadOnly');
	},
	docFormSetButtonState:function(state) {
		if(!this.docFormButtonStates) {
			return;
		}
		for(var key in this.docFormButtonStates) {
			if(this.docFormButtonStates[key].hasOwnProperty(state)) {
				if(this.docFormButtonStates[key][state] === 'enable') {
					this.queryById(key).enable();
				} else {
					this.queryById(key).disable();
				}
			}
		}
	},

	docFormSetStateIfNoChanges:function(state){
		this.docFormUnsavedChangesConfirmContinue(function(){
			this.docFormSetState(state);
		});
	},
	docFormSetState:function(newState){

		if(newState !== this.docFormCurrentState) {
			this.docFormUnHighLightAllFields();
		}

		if(!this.docFormInitComplete){
			this.docFormDebug('docFormSetState docFormInitComplete = false!');
			return;
		}
		this.docFormDebug('docFormSetState = '+newState);

		if(!this.docFormCurrentState){
			//if no current state, make it null; (First state, basically)
			this.docFormCurrentState = null;
		}
		this.docFormPreviousState = this.docFormCurrentState;
		this.docFormCurrentState = newState;

		this.docFormHideIfExists(this.docFormBtns.newBtn);
		this.docFormHideIfExists(this.docFormBtns.saveBtn);
		this.docFormHideIfExists(this.docFormBtns.deleteBtn);
		this.docFormHideIfExists(this.docFormBtns.cancelBtn);
		this.docFormHideIfExists(this.docFormBtns.searchBtn);
		this.docFormHideIfExists(this.docFormBtns.browseBtn);

		switch(this.docFormCurrentState){
			case 'empty':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,' ');
				this.docFormShowIfExists(this.docFormBtns.newBtn);
				this.docFormShowIfExists(this.docFormBtns.searchBtn);
				this.docFormShowIfExists(this.docFormBtns.browseBtn);

				this.docFormEmptyFields();
				this.docFormEmptyStores();
				this.docFormEmptyParentId();
				this.docFormCurrentDocument = {};
				this.docFormComboData = {};
				this.docFormStoreData = {};

				this.docFormEachField(function(field){
					field.addCls('docFormReadOnly');
					field.removeCls(['docFormSearchable','docFormChanged']);
					field.setReadOnly(true);
				});

				break;
			case 'readOnly':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,'<img src="/inc/img/silk_icons/lock.png" /> Read Only');
				this.docFormShowIfExists(this.docFormBtns.searchBtn);
				this.docFormShowIfExists(this.docFormBtns.browseBtn);
				this.docFormEachField(function(field){
					field.removeCls(['docFormReadOnly','docFormSearchable','docFormChanged']);
					field.setReadOnly(true);
					this.docFormReadOnly(field);
				});
				break;
			case 'view':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,'Viewing');
				this.docFormShowIfExists(this.docFormBtns.newBtn);
				this.docFormShowIfExists(this.docFormBtns.deleteBtn);
				this.docFormShowIfExists(this.docFormBtns.searchBtn);
				this.docFormShowIfExists(this.docFormBtns.browseBtn);
				this.docFormEachField(function(field){
					field.removeCls(['docFormReadOnly','docFormSearchable','docFormChanged']);
					field.setReadOnly(false);
					this.docFormReadOnly(field);
				});
				break;
			case 'edit':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,'Editing');
				this.docFormShowIfExists(this.docFormBtns.saveBtn);
				this.docFormShowIfExists(this.docFormBtns.cancelBtn);
				this.docFormShowIfExists(this.docFormBtns.deleteBtn);
				this.docFormEachField(function(field){
					if(field.docFormFocus){
						field.focus();
					}
					field.removeCls(['docFormReadOnly','docFormSearchable']);
					field.setReadOnly(false);
					this.docFormReadOnly(field);
				});
				break;
			case 'new':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,'New Entry');
				this.docFormShowIfExists(this.docFormBtns.saveBtn);
				this.docFormShowIfExists(this.docFormBtns.cancelBtn);

				this.docFormEachField(function(field){
					field.removeCls(['docFormReadOnly','docFormSearchable','docFormChanged']);
					field.setReadOnly(false);
				});
				break;
			case 'search':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,'Search Mode');
				this.docFormShowIfExists(this.docFormBtns.searchBtn);
				this.docFormShowIfExists(this.docFormBtns.browseBtn);
				this.docFormShowIfExists(this.docFormBtns.cancelBtn);
				this.docFormEmptyFields();
				this.docFormEmptyStores();
				this.docFormEmptyParentId();
				this.docFormEachField(function(field){
					field.removeCls(['docFormReadOnly','docFormChanged']);
					if(field.docFormSearchFocus){
						field.focus();
					}
					if(field.docFormSearchable){
						field.addCls('docFormSearchable');
						field.setReadOnly(false);
					}else{
						field.removeCls('docFormSearchable');
						field.addCls('docFormReadOnly');
					}
					this.docFormReadOnly(field);
				});
				break;
		}

		this.docFormEventsDisabled = false;

		this.docFormSetButtonState(this.docFormCurrentState);

		//Fire state changed event, sending old and new state;
		this.fireEvent('docformstatechanged',this.docFormPreviousState,this.docFormCurrentState);
	},
	docFormHideIfExists:function(item){
		if(item){
			item.hide();
		}
	},
	docFormShowIfExists:function(item){
		if(item){
			item.show();
		}
	},
	docFormSetHtmlIfExists:function(item,value){
		if(item){
			item.setHtml(value);
		}
	},
	docFormCancel:function(){
		switch(this.docFormCurrentState){
			case 'search':
			case 'new':
				if(this.docFormPreviousState === 'readOnly' || this.docFormPreviousState === 'view'){
					this.docFormResetFieldsToLoadedData();
					this.docFormSetState(this.docFormPreviousState);
				}else{
					this.docFormSetState('empty');
				}
				break;
			case 'edit':
				if(this.docFormChildrenHaveChangesAnywhere()) {
					this.docFormConfirmContinue(function() {
						this.docFormResetFieldsToLoadedData();
						this.docFormSetState('view');
					});
				} else {
					this.docFormResetFieldsToLoadedData();
					this.docFormSetState('view');
				}
				break;
		}
		this.fireEvent('docformcancel');
	},
	docFormReset:function(){
		this.docFormDebug('docFormReset');

		this.docFormSetState('empty');

		for(var key in this.docFormStoreData) {
			this.getViewModel(key).removeAll();
		}

		var docFormSubLen = this.docFormSubs.length;
		while(docFormSubLen--){
			this.docFormSubs[docFormSubLen].docFormDebug('SUB docFormReset');
			this.docFormSubs[docFormSubLen].docFormReset();
		}
	},
	docFormEmptyParentId:function() {
		if(!this.docFormSubs) {
			return;
		}
		this.docFormSubs.forEach(function(child) {
			child.docFormParentId = null;
		});
	},
	docFormEmptyStores:function() {
		for(var key in this.docFormStoreData) {
			this.getViewModel().getStore(key).removeAll();
		}
	},
	docFormEmptyFields:function(){
		this.docFormDebug('docFormEmptyFields');

		this.docFormEachField(function(field){
			field.setValue('');
			field.resetOriginalValue();
			field.removeCls('docFormChanged');
		});
		if(!this.docFormSubs) {
			return;
		}
		this.docFormSubs.forEach(function(child) {
			child.docFormReset();
		});
	},
	docFormEachField:function(loopFn){
		for(var fieldName in this.docFormFields){
			var field = this.docFormFields[fieldName];
			//Skip all checkbox groups!
			if(field.getXType() == 'checkboxgroup'){
				continue;
			}
			loopFn.call(this,field);
		}
	},
	docFormsetKeyEvents:function(){
		this.docFormDebug("docFormsetKeyEvents");

		this.el.dom.tabIndex=0; //for key events to hit this component you need them to land on something "focusable"

		var map = new Ext.util.KeyMap({
			target: this.el,
			binding:[
				{
					key: "s",
					ctrl:true,
					eventName:"keydown",
					fn: function(key,event){
						event.stopEvent();
						if(this.docFormEventsDisabled){
							return;
						}
						switch(this.docFormCurrentState){
							default:
							case 'search':
								this.docFormBtns.searchBtn.fireEvent('click');
								break;
							case 'edit':
							case 'new':
								this.docFormBtns.saveBtn.fireEvent('click');
								break;
						}
					},
					scope: this
				},
				{
					key: "f",
					ctrl:true,
					eventName:"keydown",
					fn: function(key,event){
						event.stopEvent();
						if(this.docFormEventsDisabled){
							return;
						}
						this.docFormBtns.searchBtn.fireEvent('click');
					},
					scope: this
				},
				{
					key: "z",
					ctrl:true,
					eventName:"keydown",
					fn: function(key,event){
						event.stopEvent();
						if(this.docFormEventsDisabled){
							return;
						}
						this.docFormBtns.cancelBtn.fireEvent('click');
					},
					scope: this
				}
			]
		});
	},
	docFormInitKeyEvents:function(){
		this.docFormDebug("docFormInitKeyEvents");
		if(this.rendered){
			this.docFormsetKeyEvents();
		}else{
			this.on('render',this.docFormsetKeyEvents,this);
		}
	},
	docFormSetFieldTypes:function(fieldTypes){
		this.docFormDebug("docFormSetFieldTypes");
		this.docFormEachField(function(field){
			var itemId = field.getItemId();
			if(fieldTypes.hasOwnProperty(itemId)){
				switch(fieldTypes[itemId]) {
					case 'number':
						field.maskRe = /[-0-9\.]/;
						if (field.rendered) {
							field.mon(field, 'keypress', function (field, event) {
								field.filterKeys.call(field, event);
							});
						}
						break;
				}
			}
		});
	},
	docFormSetFieldLengths:function(fieldLengths){
		this.docFormDebug("docFormSetFieldLengths");
		this.docFormEachField(function(field){
			var itemId = field.getItemId();
			if(fieldLengths.hasOwnProperty(itemId)){
				if(field.rendered){
					field.inputEl.dom.maxLength = fieldLengths[itemId];
				}else{
					field.maxLength = fieldLengths[itemId];
				}
			}
		});
	},
	docFormSetPickerWidths:function(pickerWidths){
		this.docFormDebug("docFormSetPickerWidths");
		this.docFormEachField(function(field){
			var itemId = field.getItemId();
			if(pickerWidths.hasOwnProperty(itemId)){
				if(field.rendered){
					field.getPicker().setWidth(pickerWidths[itemId]);
				}else{
					field.on('render',function(combo){
						combo.getPicker().setWidth(pickerWidths[itemId]);
					});
				}
			}
		});
	},
	docFormInit:function(params){

		if(this.docFormInitComplete === true){
			console.error('docForm already init!');
			return;
		}

		this.docFormId = Ext.id();
		this.docFormDebug("docFormInit");
		//this.getForm().trackResetOnLoad = true; //Auto-cleans fields when loaded with setValues()
		this.docFormFields = {};
		var doubleFields = [];
		this.docFormSupportedXTypes = [
			"textfield",
			"displayfield",
			"numberfield",
			"datefield",
			"tagfield",
			'radio',

			//For some reason - the following fields change XType when running through sencha DEBUG. Adding both xtypes to reduce confusion!
			"textarea",
			"textareafield",

			"combo",
			"combobox",

			"checkbox",
			"checkboxfield",

			"hidden",
			"hiddenfield"
		];

		this.docFormSubsChangesConfirmed = false;

		var children = this.docFormGetChildren(this);
		/*
		if(this.rendered){
			this.el.addClass('docform');
		}else{
			this.cls = 'docform';
		}
		*/
		this.on({
			change: this.docFormChange,
			scope: this
		});

		this.docFormBtns = {};
		this.docFormInitilizeToolbar(params);

		for(var fieldNo in children){
			var field = children[fieldNo];

			var xType = field.getXType();
			var itemId = field.getItemId();

			field.name = itemId;
			field.enableKeyEvents = true;
			field.enableBubble(['change']);
			field.docFormId = this.docFormId;

			if(this.docFormFields.hasOwnProperty(itemId) ){
				doubleFields.push(itemId);
			}
			this.docFormFields[itemId] = field;
		}

		if(params.hasOwnProperty('buttonStates')){
			this.docFormButtonStates = params.buttonStates;
		}

		if(params.hasOwnProperty('fieldLengths')){
			this.docFormSetFieldsMaxLength(params.fieldLengths);
		}

		if(params.hasOwnProperty('searchableFields')){
			this.docFormSetSearchableFields(params.searchableFields);
		}

		if(params.hasOwnProperty('fieldTypes')){
			this.docFormSetFieldTypes(params.fieldTypes);
		}

		if(params.hasOwnProperty('pickerWidths')){
			this.docFormSetPickerWidths(params.pickerWidths);
		}

		if(params.hasOwnProperty('debug')){
			this.docFormDebugMode = params.debug;
		}

		var doubleFieldString = "";
		for(var i=0;i<doubleFields.length;i++){
			doubleFieldString += doubleFields[i]+"\n";
		}
		if(doubleFieldString.length>0){
			console.error("Duplicate Fields Detected: \n"+doubleFieldString);
		}

		var stripCurrencyFormatting = this.docFormCurrencyStripFormatting;
		this.docFormEachField(function(field){
			if(field.formatCurrency){
				field.on({
					blur:function(field){
						field.focusedDontModify = false;
						this.docFormCurrencyFieldFormat(field);
					},
					scope:this
				});
				field.on('focus',function(field){
					field.focusedDontModify = true;
					field.setValue(stripCurrencyFormatting(field.getValue()));
				},this);

				//override getSubmitValue
				field.getSubmitValue = function(){
					return stripCurrencyFormatting(this.getValue());
				};
				field.maskRe = /[-0-9\.]/;
				if(field.rendered){
					field.mon(field, 'keypress', function(field,event){
						field.filterKeys.call(field,event);
					});
				}
			}

			//add app window manager auto open
			if(typeof AppWindowManager !== "undefined" && (this.docFormAppLinks.hasOwnProperty(field.itemId) || field.hasOwnProperty('docFormLink'))) {
				if(field.rendered){
					this.docFormAddFieldLink(field);
				}else{
					field.on('afterrender', function(){
						this.docFormAddFieldLink(field);
					}, this);
				}
			}

			if(field.xtype === "datefield" && field.getEl()) {
				field.getEl().on('dblClick', function() {
					if(!field.readOnly) {
						field.setValue(new Date());
					}
				});
			}
		});

		this.docFormInitKeyEvents();

		this.docFormInitComplete = true;
		this.docFormSetState('empty');
		this.fireEvent('docforminit', this);
	},
	docFormAddFieldLink: function(field) {
		field.getEl().on({
			scope:this,
			dblClick:function() {
				if(field.getValue()) {
					if(field.hasOwnProperty('docFormLink')) {
						AppWindowManager.appLink(field.docFormLink,{dataKey:field.getValue()});
					} else {
						AppWindowManager.appLink(this.docFormAppLinks[field.itemId],{dataKey:field.getValue()});
					}
				}
			}
		});
		field.bodyEl.addCls('docform-link-container');
		var el = Ext.dom.Helper.append(field.bodyEl.dom, {tag:'img',src:'/inc/img/silk_icons/link.png',cls:'docform-link-indicator'}, true);
		el.on('click', function() {
			if(field.getValue()) {
				if(field.hasOwnProperty('docFormLink')) {
					AppWindowManager.appLink(field.docFormLink,{dataKey:field.getValue()});
				} else {
					AppWindowManager.appLink(this.docFormAppLinks[field.itemId],{dataKey:field.getValue()});
				}
			}
		}, this);
	},
	docFormCurrencyStripFormatting:function(val){
		return val.replace(/[^-0-9\.]/g,'');
	},
	docFormCurrencyFieldFormat:function(field){
		//dont change formatting if bluring to click save btn
		if(this.docFormBtns.saveBtn && this.docFormBtns.saveBtn.el && this.docFormBtns.saveBtn.el.dom && document.activeElement === this.docFormBtns.saveBtn.el.dom){
			return;
		}
		//dont change formatting if the field is currently focused
		if(field.focusedDontModify){
			return;
		}
		var val = field.getValue().trim();
		if(val == '' ){
			field.setRawValue('');
		}else{
			var newVal =  Ext.util.Format.currency(this.docFormCurrencyStripFormatting(val), '$ ', field.hasOwnProperty('formatCurrencyDecimals') ? field.formatCurrencyDecimals : 2);
			field.setRawValue(newVal);
		}
	},
	docFormGetChildren:function(parent){
		var results = [];
		parent.items.each(function(child){
			if(child.hasOwnProperty("docFormSkip")){
				return true;
			}
			var xType = child.getXType();
			var itemId = child.getItemId();
			if(this.docFormSupportedXTypes.indexOf(xType) != -1){
				results.push(child);
			}

			//Look for children (if it isn't a doc form!)
			if(child.docFormGetChildren){ //It's a doc form!
				this.docFormSubs.push(child);
				child.docFormParent = this;
				return true;
			}
			if(child.hasOwnProperty("items") && child.items.length !== 0){
				var childrenChildren = this.docFormGetChildren(child);
				if(childrenChildren.length > 0){
					for(var i=0; i<childrenChildren.length; i++){
						results.push(childrenChildren[i]);
					}
				}
			}
		},this);
		return results;
	},
	docFormWindowBeforeClose:function(docFormWindow){
		//Stop the window close event for now.
		//The unsaved changes function will close the window.

		if(docFormWindow.docFormSafeToClose === true){
			//close the window!

			//reset safe to close value
			docFormWindow.docFormSafeToClose = false;
			return true;
		}

		if(docFormWindow.docForm.docFormHasChangesAnywhere() ){
			//confirm before changing because changes found

			docFormWindow.docForm.docFormConfirmContinue(function(){
				docFormWindow.docFormSafeToClose = true;
				docFormWindow.close();
				docFormWindow.docForm.docFormReset();
			});
			return false;
		}else{
			//close the window!

			//reset safe to close value
			docFormWindow.docFormSafeToClose = false;
			return true;
		}
	},
	docFormHighLightRequiredFields(ajaxResponse) {
		if(ajaxResponse.length === 0) {
			return;
		}

		let parts = [];

		for(let i in this.docFormGetAllFieldValues()) {
			if(ajaxResponse.indexOf(i) !== -1 && i !== 'id') {
				parts.push(i);
			}
		}

		this.docFormUnHighLightAllFields();

		this.docFormEachField(function(field) {

			if(field.hasCls('docFormReadOnly') || !field.bodyEl || !field.bodyEl.dom ||
				!field.bodyEl.dom.childNodes || field.bodyEl.dom.childNodes.length === 0 ||
				!field.bodyEl.dom.childNodes[0].childNodes ||
				 field.bodyEl.dom.childNodes[0].childNodes.length === 0) {
				return true;
			}
			if(parts.includes(field.itemId)) {
				Ext.dom.Helper.append(field.bodyEl.dom.childNodes[0].childNodes[0], {tag:'div',cls:'docform-field-required-container'});
			}
		});
	},
	docFormUnHighLightAllFields() {
		var highlightedFields = document.getElementsByClassName('docform-field-required-container');

		while(highlightedFields[0]) {
			highlightedFields[0].parentNode.removeChild(highlightedFields[0]);
		}
	},
	docFormReadOnly(field) {
		if(field.hasOwnProperty('docFormReadOnly')) {
			if(field.getXType() !== 'checkbox') {
				field.addCls('docFormReadOnly')
			} else {
				field.removeCls('docFormReadOnly')
			}
			field.setReadOnly(true);
		}
	}

});
