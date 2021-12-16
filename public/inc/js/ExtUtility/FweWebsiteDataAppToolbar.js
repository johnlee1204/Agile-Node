Ext.define('ExtUtility.FweWebsiteDataAppToolbar', {
	extend: 'Ext.toolbar.Toolbar',
	alias: 'widget.fwewebsitedataapptoolbar',

	requires: [
		'Ext.button.Button'
	],

	items: [
		{
			xtype: 'button',
			href: '/WebsiteModelData/',
			hrefTarget: '_self',
			text: 'Website Model Data',
			icon: '/inc/img/silk_icons/layout.png'
		},
		{
			xtype: 'button',
			href: '/LiteratureLinker/',
			hrefTarget: '_self',
			text: 'Literature Linker',
			icon: '/inc/img/silk_icons/book_open.png'
		},
		{
			xtype: 'button',
			href: '/WebsiteMissingPhotos/',
			hrefTarget: '_self',
			text: 'Missing Photos',
			icon: '/inc/img/silk_icons/images.png'
		},
		{
			xtype: 'button',
			href: '/VideoLinker/',
			hrefTarget: '_self',
			text: 'Video Linker',
			icon: '/inc/img/silk_icons/monitor_link.png'
		},
		{
			xtype: 'button',
			href: '/WebsiteModelDataSync/',
			hrefTarget: '_self',
			text: 'FWE.com Sync',
			icon: '/inc/img/silk_icons/arrow_rotate_anticlockwise.png'
		},
		{
			xtype: 'button',
			href: '/FwePartsImport/',
			hrefTarget: '_self',
			text: 'FWEParts.com Sync',
			icon: '/inc/img/silk_icons/arrow_rotate_clockwise.png'
		},
		{
			xtype: 'button',
			href: '/WebsiteWikiSync/',
			hrefTarget: '_self',
			text: 'Website Wiki Sync',
			icon: '/inc/img/silk_icons/book_go.png'
		},
		{
			xtype: 'button',
			href: '/PartCharacteristics/',
			hrefTarget: '_self',
			text: 'Part Characteristics',
			icon: '/inc/img/silk_icons/tag_red.png'
		},
		{
			xtype: 'button',
			href: '/PartManualSync/',
			hrefTarget: '_self',
			text: 'Part Manual Sync',
			icon: '/inc/img/silk_icons/report.png'
		},
		{
			xtype: 'button',
			href: '/PdfThumbnail/',
			hrefTarget: '_self',
			text: 'PDF Thumbnail Generator',
			icon: '/inc/img/silk_icons/page_white_acrobat.png'
		},
		{
			xtype: 'button',
			href: '/fwecdn/',
			hrefTarget: '_self',
			text: 'CDN Flush',
			icon: '/inc/img/silk_icons/wand.png'
		}
	],
	
	listeners:{
		afterrender: function(){
			var appName = window.location.pathname.toUpperCase();
			for(var i = 0; i< this.items.items.length; i++){
				if(this.items.items[i].href.toUpperCase().indexOf(appName) != -1){
					this.items.items[i].disable();
					return;
				}
			}
		}
	}

});