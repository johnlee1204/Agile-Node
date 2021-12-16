Ext.define('AppWindowManagerClass', {
	extend: 'Ext.mixin.Observable', //This gives us our event functions

	/*
		windows:{
			activity:{
				window:<Ext.Window>,
				app:<Ext.app> (Most likely docForm)
			},
			quote:{
				window:<Ext.Window>,
				app:<Ext.app> (Most likely docForm)
			},
			...
		}
	*/
	windows:{},
	windowDefaults:{
		constrainHeader:true,
		resizable: true,
		layout: 'fit',
		closeAction: 'hide',
		liveDrag:true,
		minWidth:200,
		minHeight:100
	},

	appHandlers: {},
	pendingListeners: {},
	app:{
		'ali':{
			appLinkHandler:function(appConfig){
				window.open('/ali/?project='+appConfig.dataKey,'aliwindow');
			}
		},
		'quote':{
			loaderClass:'Quote',
			loaderPath:'/Quote/app',
			dataLoader: 'loadQuote',
			appClass: 'Quote.view.QuoteForm',
			docForm:true,
			multiWindow:true,
			windowConfig:{
				title:'Quote'
			},
			callback:function(){},
			callbackScope:this
		},
		'quoteMaker':{
			loaderClass:'Quote',
			loaderPath:'/Quote/app',
			dataLoader: 'loadQuote',
			appClass: 'Quote.view.QuoteMaker',
			//docForm:true,
			windowConfig:{
				title:'Quote Maker'
			}
		},
		'activity':{
			loaderClass:'Activity',
			loaderPath:'/Activity/app',
			dataLoader:'loadActivity',
			appClass: 'Activity.view.ActivityForm',
			docForm:true,
			windowConfig:{
				title:'Activity'
			},
			callback:function(){},
			callbackScope:this
		},
		'salesOrder':{
			loaderClass:'SalesOrder',
			loaderPath:'/SalesOrder/app',
			dataLoader: 'loadSalesOrder',
			appClass: 'SalesOrder.view.SalesOrderForm',
			docForm:true,
			multiWindow:true,
			windowConfig:{
				title:'Sales Order',
				width:900
			},
			callback:function(){},
			callbackScope:this
		},
		'salesOrderRouting':{
			loaderClass:'SalesOrder',
			loaderPath:'/SalesOrder/app',
			dataLoader: 'readRoutings',
			appClass: 'SalesOrder.view.SalesOrderRoutingWindow',
			windowConfig:{
				title:'Sales Order Routing'
			}
		},
		'salesOrderBom':{
			loaderClass:'SalesOrder',
			loaderPath:'/SalesOrder/app',
			dataLoader: 'readBom',
			appClass: 'SalesOrder.view.SalesOrderBomWindow',
			windowConfig:{
				title:'Sales Order BOM'
			}
		},
		'salesOrderPriceSummary':{
			loaderClass:'SalesOrder',
			loaderPath:'/SalesOrder/app',
			dataLoader: 'readPriceSummary',
			appClass: 'SalesOrder.view.SalesOrderPriceSummary',
			docForm:true,
			windowConfig:{
				title:'Sales Order Price Summary'
			}
		},
		'dealerSearchResults':{
			loaderClass:'ALI',
			loaderPath:'/ALI/app',
			appClass: 'ALI.view.DealerSearchResults',
			dataLoader: 'lookupDataKey',
			docForm:false
		},
		'consultant':{
			loaderClass:'Consultant',
			loaderPath:'/Consultant/app',
			appClass: 'Consultant.view.Consultant',
			dataLoader: 'lookupDataKey',
			docForm:true
		},
		'job':{
			loaderClass:'JobComponent',
			loaderPath:'/Job/app',
			appClass: 'JobComponent.view.Job',
			dataLoader: 'loadJob',
			docForm:true,
			windowConfig:{
				title:'Job'
			}
		},
		'itemMaster':{
			loaderClass:'ItemMaster',
			loaderPath:'/ItemMaster/app',
			appClass: 'ItemMaster.view.ItemMasterPanel',
			dataLoader: 'readPartDetailsByPartName',
			docForm:true,
			windowConfig:{
				title:'Item Master'
			}
		},
		'cycleCountRecountNotes':{
			loaderClass:'ItemMaster',
			loaderPath:'/ItemMaster/app',
			appClass: 'ItemMaster.view.FlaggedForCycleCountNotes',
			windowConfig:{
				title:'Recount Notes'
			}
		},
		'consultantContact':{
			loaderClass:'Consultant',
			loaderPath:'/Consultant/app',
			appClass: 'Consultant.view.ConsultantContacts',
			dataLoader: 'lookupContacts',
			docForm:true
		},
		'contact': {
			loaderClass:'Contact',
			loaderPath:'/Contact/app',
			appClass: 'Contact.view.ContactGrid',
			dataLoader: 'initForm',
			docForm:false,
			windowConfig:{
				title:'Contacts'
			}
		},
		'address': {
			loaderClass:'Address',
			loaderPath:'/Address/app',
			appClass: 'Address.view.AddressGrid',
			docForm:false,
			windowConfig:{
				title:'Addresses'
			}
		},
		'opportunity': {
			loaderClass:'Opportunity',
			loaderPath:'/Opportunity/app',
			appClass: 'Opportunity.view.Opportunity',
			dataLoader: 'loadOpportunity',
			docForm:true,
			windowConfig:{
				title:'Opportunity',
				maximizable:true
			}
		},
		'login': {
			loaderClass:'Login',
			loaderPath:'/Login/app',
			appClass: 'Login.view.LoginForm',
			//dataLoader: 'initForm',
			docForm:false,
			windowConfig:{
				title:'Login'
			}
		},
		'rep': {
			loaderClass:'Rep',
			loaderPath:'/Rep/app',
			appClass: 'Rep.view.Rep',
			dataLoader: 'loadRep',
			docForm:true,
			windowConfig:{
				title:'Rep',
				width:825,
				// height:650
			}
		},
		'project': {
			loaderClass:'Project',
			loaderPath:'/Project/app',
			appClass: 'Project.view.ProjectForm',
			dataLoader: 'loadProject',
			docForm:true,
			multiWindow:true,
			windowConfig:{
				title:'Project'
			}
		},
		'dealer': {
			loaderClass:'Dealer',
			loaderPath:'/Dealer/app',
			appClass: 'Dealer.view.DealerForm',
			dataLoader: 'loadDealer',
			docForm:true,
			multiWindow:true,
			windowConfig:{
				title:'Dealer'
			}
		},
		'dealerSearch': {
			loaderClass:'Dealer',
			loaderPath:'/Dealer/app',
			appClass: 'Dealer.view.DealerSearch',
			dataLoader: 'loadDealer',
			windowConfig:{
				title:'Dealer Search'
			}
		},
		'quickSearchBrowse': {
			loaderClass:'Ali',
			loaderPath:'/ALi/app',
			appClass: 'ALI.view.QuickSearchBrowse',
			dataLoader: 'search',
			windowConfig:{
				title:'QuickSearch Browse'
			}
		},
		'csPopupEditor': {
			loaderClass:'CsPopupEditor',
			loaderPath:'/CsPopupEditor/app',
			appClass: 'CsPopupEditor.view.CsPopupEditor',
			dataLoader: 'loadGrid',
			windowConfig:{
				title:'Selection Editor'
			}
		},
		'projectBrowse':{
			loaderClass:'Project',
			loaderPath:'/Project/app',
			appClass: 'Project.view.ProjectBrowse',
			dataLoader: 'search',
			windowConfig:{
				title:'Browse Projects'
			}
		},
		'promoCodeEditor':{
			loaderClass:'PromoCodeEditor',
			loaderPath:'/PromoCodeEditor/app',
			appClass: 'PromoCodeEditor.view.PromoCodeEditor',
			dataLoader: 'readPromoCode',
			windowConfig:{
				title:'Promo Code Editor'
			}
		},
		'tray':{
			loaderClass:'Tray',
			loaderPath:'/Tray/app',
			appClass: 'Tray.view.Tray',
			dataLoader: 'readTray',
			windowConfig:{
				title:'Tray'
			}
		},
		'service':{
			loaderClass:'Service',
			loaderPath:'/Service/app',
			appClass: 'Service.view.ServiceInterface',
			dataLoader: 'loadInquiryFromInquiryNo',
			windowConfig:{
				title:'Customer Service Request'
			}
		},
		'inventoryLocation':{
			loaderClass:'InventoryLocation',
			loaderPath:'/InventoryLocation/app',
			appClass: 'InventoryLocation.view.InventoryLocationForm',
			dataLoader: 'readLocation',
			docForm:true,
			windowConfig:{
				title:'Inventory Location'
			}
		},
		'inventoryBin':{
			loaderClass:'InventoryBin',
			loaderPath:'/InventoryBin/app',
			appClass: 'InventoryBin.view.InventoryBinForm',
			dataLoader: 'readBin',
			docForm:true,
			windowConfig:{
				title:'Inventory Bin'
			}
		},
		'inventoryRequest':{
			loaderClass:'InventoryRequest',
			loaderPath:'/InventoryRequest/app',
			appClass: 'InventoryRequest.view.InventoryRequestDetails',
			dataLoader: 'loadInventoryRequestForm',
			windowConfig:{
				title:'Inventory Request'
			}
		},
		'crateKitMaker':{
			loaderClass:'CrateKitMaker',
			loaderPath:'/CrateKitMaker/app',
			appClass: 'CrateKitMaker.view.CrateKitMaker',
			dataLoader: 'loadPart',
			docForm:true,
			windowConfig:{
				title:'Crate Kit Maker'
			}
		},
		'userToolbarSetup':{
			loaderClass:'UserToolbar',
			loaderPath:'/UserToolbar/app',
			appClass: 'UserToolbar.view.UserToolbarSetup',
			dataLoader: 'readUserLinks',
			windowConfig:{
				title:'User Toolbar Setup'
			}
		},
		'productOutline':{
			loaderClass:'Product',
			loaderPath:'/Product/app',
			appClass: 'Configurator.view.ProductOutline',
			dataLoader: 'readProductOutline',
			windowConfig:{
				title:'Product Outline'
			}
		},
		'visualRule':{
			loaderClass:'Product',
			loaderPath:'/Product/app',
			appClass: 'Configurator.view.VisualRule',
			dataLoader: 'readVisualRules',
			windowConfig:{
				title:'Visual Rules'
			}
		},
		'partExclusion':{
			loaderClass:'Configurator',
			loaderPath:'/Configurator/app',
			appClass: 'Configurator.view.VisualRulePartExclusions',
			dataLoader: 'readPartExclusions',
			windowConfig:{
				title:'Visual Rules: Part Exclusions'
			}
		},
		'configurator':{
			loaderClass:'Configurator',
			loaderPath:'/Configurator/app',
			appClass: 'Configurator.view.ItemConfigurator',
			windowConfig:{
				title:'Configurator',
				minWidth:850
			}
		},
		'purchaseOrder':{
			loaderClass:'PurchaseOrder',
			loaderPath:'/PurchaseOrder/app',
			appClass: 'PurchaseOrder.view.PurchaseOrder',
			dataLoader:'readPurchaseOrder',
			docForm:true,
			windowConfig:{
				title:'Purchase Order',
				width:1150,
				maxHeight:1000
			}
		},
		'customerFeedback':{
			loaderClass:'Contact',
			loaderPath:'/Contact/app',
			appClass: 'Contact.view.Questionnaire',
			dataLoader:'readCustomerFeedback',
			docForm:true,
			windowConfig:{
				title:'Customer Feedback'
			}
		},
		'vendor':{
			loaderClass:'Vendor',
			loaderPath:'/Vendor/app',
			appClass: 'Vendor.view.Vendor',
			dataLoader:'readVendor',
			docForm:true,
			windowConfig:{
				title:'Vendor',
				width:1000,
				height:750
			}
		},
		'vendorInvoice':{
			loaderClass:'VendorInvoice',
			loaderPath:'/VendorInvoice/app',
			appClass: 'VendorInvoice.view.VendorInvoice',
			dataLoader:'readVendorInvoice',
			docForm:true,
			windowConfig:{
				title:'Vendor Invoice',
				width:1000,
				height:750
			}
		},
		'companyNote':{
			loaderClass:'CompanyNote',
			loaderPath:'/CompanyNote/app',
			dataLoader:'readCompanyNote',
			appClass: 'CompanyNote.view.CompanyNote',
			docForm:true,
			windowConfig:{
				title:'Company Note'
			}
		},
		'marketVisit':{
			loaderClass:'MarketVisit',
			loaderPath:'/MarketVisit/app',
			dataLoader:'readMarketVisit',
			appClass: 'MarketVisit.view.MarketVisit',
			docForm:true,
			windowConfig:{
				title:'Market Visit'
			}
		},
		'shipper':{
			loaderClass:'Shipper',
			loaderPath:'/Shipper/app',
			dataLoader:'readShipper',
			appClass: 'Shipper.view.Shipper',
			docForm:true,
			windowConfig:{
				width:1000,
				height:750,
				title:'Shipper'
			}
		},
		'salesOrderCommission':{
			loaderClass:'SalesOrderCommission',
			loaderPath:'/SalesOrderCommission/app',
			dataLoader:'readAllSalesOrderCommissions',
			appClass: 'SalesOrderCommission.view.MainPanel',
			windowConfig:{
				title:'Sales Order Commission'
			}
		}
	},
	appLink:function(appId, appConfig){

		if(!this.fireEvent('appLink'+appId, appConfig) ){//lets app handle opening the window(ex: changing tab)
			return;
		}

		if(this.app[appId].appLinkHandler){
			this.app[appId].appLinkHandler(appConfig);
			return;
		}

		AppWindowManager.showAppWindow(appId, appConfig);
	},
	//deprecated - dont use
	show:function(appId,appConfig){
		this.appLink(appId,appConfig);
	},
	showAppWindow:function(appId,appConfig){

		if(!this.app.hasOwnProperty(appId)){
			console.error('undefined app with appId '+appId);
			return;
		}
		let config = Ext.Object.merge({}, this.app[appId]);
		Ext.Object.merge(config, appConfig || {});

		let newAppWin;
		if(config.multiWindow){
			newAppWin = this.createWindow(appId, config);
		}else{
			if(!this.windows.hasOwnProperty(appId)){
				newAppWin = this.createWindow(appId, config);
			}else{
				newAppWin = this.windows[appId][0];
			}
		}


		//only shows window if not showing main parent(form)
		//if (this.windows[appId].window !== null) {
		//}

		//focuses on new window or main parent panel
		//(this.windows[appId].window || this.windows[appId].app).focus();

		newAppWin.appShowCallbackCalled = false;

		if(config.multiWindow){
			newAppWin.window.show(false, function(){
				if(newAppWin.appDataLoaded && !newAppWin.appShowCallbackCalled){
					newAppWin.appShowCallbackCalled = true;
					this.appShowCallback(newAppWin, config);
				}
			}, this);
		}else{
			if(newAppWin.window.isVisible()){
				if(newAppWin.appDataLoaded && !newAppWin.appShowCallbackCalled){
					newAppWin.appShowCallbackCalled = true;
					this.appShowCallback(newAppWin, config);
				}
				newAppWin.window.focus();
			}else{
				newAppWin.window.show(false, function(){
					if(newAppWin.appDataLoaded && !newAppWin.appShowCallbackCalled){
						newAppWin.appShowCallbackCalled = true;
						this.appShowCallback(newAppWin, config);
					}
				}, this);
			}
		}

	},

	appShowCallback:function(appWin, config){
		if(config.hasOwnProperty('dataKey')){
			if(config.hasOwnProperty('dataLoader')){
				appWin.app[config.dataLoader].call(appWin.app, config.dataKey);
			}else{
				console.error("dataKey sent without dataLoader defined for "+appWin.appId);
			}
		}

		if(config.hasOwnProperty('callback')){
			var scope = config.hasOwnProperty('callbackScope') ? config.callbackScope : this;
			config.callback.call(scope, appWin);
		}
	},

	createWindow:function(appId, config) {
		Ext.Loader.setPath(config.loaderClass, config.loaderPath);

		var currentApp = {
			appDataLoaded: false,
			appId: appId,
			window: null
		};

		var listeners = [];
		if(config.hasOwnProperty('listeners')) {
			listeners = [config.listeners];
		}
		if(this.pendingListeners.hasOwnProperty(appId)) {
			listeners = Ext.Array.merge(listeners, this.pendingListeners[appId]);
		}
		
		listeners.push({
			changetitle: {
				scope:this,
				fn:function(title){
					currentApp.window.setTitle(title);
					return false;
				}
			},
			windowclose: {
				scope:this,
				fn:function(){
					currentApp.window.hide();
				}
			},
			appdataloaded: {
				single: true,
				scope: this,
				fn: function () {
					currentApp.appDataLoaded = true;
					currentApp.appShowCallbackCalled = true;
					this.appShowCallback(currentApp, config);
				}
			}
		});

		var appConfig = {listeners:listeners};
		Ext.apply(appConfig, config.appConfig || {});
		
		var form = Ext.create(config.appClass, appConfig);

		var windowConfig = {listeners:{}, items:form};
		Ext.apply(windowConfig, config.windowConfig || {}, this.windowDefaults);

		if(windowConfig.title) {
			form.title = "";
		}
		
		if(config.docForm){
			windowConfig.listeners.beforeclose = function(window){
				//before closing window, check docform for unsaved changes
				if(window.safeToClose){
					window.safeToClose = false;
					return true;
				}
				window.windowApp.docFormUnsavedChangesConfirmContinue(function(){
					window.safeToClose = true;
					window.windowApp.docFormReset();
					window.close();
				});
				//Stop the window close event for now.
				//The unsaved changes function will close the window.
				return false;
			};
		}

		windowConfig.itemId = appId+'AppWin';

		currentApp.window = Ext.create('Ext.window.Window', windowConfig);
		currentApp.window.windowApp = form; //save reference to app

		currentApp.app = form;

		if(!this.windows[appId]){
			this.windows[appId] = [];
		}
		this.windows[appId].push(currentApp);

		return currentApp;

	},

	appOn:function(appId, listeners) {
		if(this.windows.hasOwnProperty(appId)){
			Ext.each(this.windows[appId],function(win){
				win.app.on(listeners);
			});
		} else {
			if(this.pendingListeners.hasOwnProperty(appId)) {
				this.pendingListeners[appId].push(listeners);
			} else {
				this.pendingListeners[appId] = [listeners];
			}
		}
	}

});

AppWindowManager = new AppWindowManagerClass();