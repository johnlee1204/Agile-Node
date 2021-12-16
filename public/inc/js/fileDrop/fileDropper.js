/*
	-- CONSTRUCTOR PARAMETERS --
		viewport - (EXT refrence) container to init filedrop on.
		button - (boolean:false) - set to false for drag and drop mode, true for classic upload button mode.
		multipleFiles - (boolean:true) set to true to allow multiple file upload
		maxFileSize - (float:3) max file size, in Mebibytes ("Megabytes" in computerland)
		allowedExtensions - (array of strings:['jpg']) allowed file extensions
		uploadUrl - (string:'')
	-- EVENTS --
		beforeUpload(files to be uploaded) - return false to cancel the upload. 
		uploadFinished(uploadErrors, files uploaded) - fires when all uploads are finished - passes array of errors that occured.
		fileSuccess(file,response) - fires when a file was successfully sent to the uploadUrl. Comes with the file and the server response for that specific file
	-- METHODS --
		setUploadUrl(string) - sets the uploadUrl
 */

Ext.define('FileDropper',{
	mixins:['Ext.mixin.Observable'],
	constructor:function(config){

		this.mixins.observable.constructor.call(this, config);

		var requiredConfigs = [
			'viewport'
		];

		for(var i in requiredConfigs){
			if(!config.hasOwnProperty(requiredConfigs[i])){
				console.error(requiredConfigs[i]+" is required");
				return;
			}
		}

		var configDefaults = {
			button:false,
			multipleFiles:true,
			maxFileSize:3,
			allowedExtensions:['jpg'],
			uploadUrl:''
		};

		this.config = Ext.Object.merge(configDefaults, config);

		this.createDropOverlay();
		this.initFileDrop();
	},
	setUploadUrl:function(url){
		this.uploadUrl = url;
	},
	createDropOverlay:function(){
		var overlay = Ext.create('Ext.Container',{
			cls: 'fileDropIndicator',
			itemId: 'fileDropIndicator',
			layout: {
				type: 'hbox',
				align: 'middle'
			},
			items: [
				{
					xtype: 'container',
					flex: 1,
					itemId: 'paddingLeft'
				},
				{
					xtype: 'container',
					height: 300,
					html: '<img src="/inc/js/fileDrop/file.png" /> <h1>Drop File To Upload</h1>',
					itemId: 'dropLogo',
					width: 300
				},
				{
					xtype: 'container',
					flex: 1,
					itemId: 'paddingRight'
				}
			]
		});

		if(!this.config.button){
			this.config.viewport.add(overlay);
		}
	},
	initFileDrop:function(){
		window.fd.logging=false;
		var uploadUrl = "/StockList/uploadPhoto";

		var options = {
			multiple:this.config.multipleFiles,
		};

		if(!this.config.button){
			options.input = false;
			options.dragOverClass = 'fileDraggedOver';
		}

		var zone = new FileDrop(this.config.viewport.getEl().dom,options);

		zone.el.addEventListener('dragstart', function(e){
			if(e.dataTransfer.files.length == 0){
				e.dataTransfer.clearData();
				e.stopPropagation();
				e.preventDefault();
				return false;
			}
		}, true);

		zone.event('send',Ext.Function.bind(function(files){
			if(false === this.fireEvent('beforeUpload',files)){
				return;
			}
			this.uploadQueueCount = 0;
			this.uploadErrors = [];
			this.filesUploaded = [];
			this.uploadQueueCount = files.length;
			this.config.viewport.mask('Uploading...');
			this.processFiles(files);
		},this));
	},
	processFiles:function(files){
		if(files.length === 0){
			return;
		}
		var sThis = this;
		var nextFile = files.pop();
		return this.processFile(nextFile)
		.then(this.processFiles.bind(sThis,files));
	},
	processFile:function(file){
	 	var deferred = new Ext.Deferred();
		
		var name = file.name;
		var boldName = "<b>"+name+"</b>";
		var ext = name.split('.').pop();

		var fatalError = boldName+': Fatal Error! Please try again.';

		if(!Ext.Array.contains(this.config.allowedExtensions,ext.toLowerCase())){
			this.uploadErrors.push(boldName+'<BR>\r\n<BR>\r\nExtension "'+ext.toLowerCase()+'" is not allowed');
			this.uploadQueueCount--;
			this.checkUploadFinished();
			return deferred.promise;
		}

		if(file.size >= (this.config.maxFileSize*1024*1024)){
			this.uploadErrors.push(boldName+": must be less than "+this.config.maxFileSize+"MB");
			this.uploadQueueCount--;
			this.checkUploadFinished();
			return deferred.promise;
		}

		file.event('done',Ext.Function.bind(function(xhr){
			deferred.resolve();
			this.uploadQueueCount--;
			var resp = {};
			try{
				resp = JSON.parse(xhr.responseText);
			}catch(e){
				this.uploadErrors.push(fatalError);
				this.checkUploadFinished();
				return deferred.promise;
			}

			if(!resp.hasOwnProperty('success')){
				this.uploadErrors.push(fatalError);
				this.checkUploadFinished();
				return deferred.promise;
			}
			if(resp.hasOwnProperty('file')){
				this.filesUploaded.push(resp.file);
			}
			this.fireEvent('fileSuccess',file,resp);
			this.checkUploadFinished();
		},this));

		file.event('error',Ext.Function.bind(function(event,xhr){
			deferred.resolve();
			this.uploadQueueCount--;
			var resp = {};
			try{
				resp = JSON.parse(xhr.responseText);
			}catch(e){
				this.uploadErrors.push(fatalError);
				this.checkUploadFinished();
				return;
			}

			if(resp.hasOwnProperty('error')){
				this.uploadErrors.push(boldName+': '+resp.error);
			}else{
				this.uploadErrors.push(fatalError);
			}
			this.checkUploadFinished();
		},this));
		file.sendTo(this.uploadUrl);
		return deferred.promise;
	},
	checkUploadFinished:function(){
		if(this.uploadQueueCount !== 0){
			return;
		}
		this.config.viewport.unmask();
		if(this.uploadErrors.length > 0){
			var errorMsg = "";
			for(var i=0;i<this.uploadErrors.length;i++){
				errorMsg += this.uploadErrors[i]+"<br />";
			}
			Ext.Msg.show({
				title:'Error',
				message: "Errors occured while uploading:<br /><br />"+errorMsg,
				buttons: Ext.Msg.OK,
				icon: Ext.Msg.ERROR
			});
		}
		this.fireEvent('uploadFinished',this.uploadErrors,this.filesUploaded);
	}
});