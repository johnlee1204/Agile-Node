/*
 * File: app/view/AccessLogViewModel.js
 *
 * This file was generated by Sencha Architect
 * http://www.sencha.com/products/architect/
 *
 * This file requires use of the Ext JS 7.3.x Classic library, under independent license.
 * License of Sencha Architect does not include license for Ext JS 7.3.x Classic. For more
 * details see http://www.sencha.com/license or contact license@sencha.com.
 *
 * This file will be auto-generated each and everytime you save your project.
 *
 * Do NOT hand edit this file.
 */

Ext.define('AccessLog.view.AccessLogViewModel', {
	extend: 'Ext.app.ViewModel',
	alias: 'viewmodel.accesslog',

	requires: [
		'Ext.data.Store',
		'Ext.data.field.Date'
	],

	stores: {
		AccessLogStore: {
			fields: [
				{
					type: 'date',
					name: 'date',
					dateReadFormat: 'Y-m-d H:i:s'
				},
				{
					name: 'userName'
				},
				{
					name: 'name'
				},
				{
					name: 'url'
				},
				{
					name: 'query'
				},
				{
					name: 'body'
				}
			]
		}
	}

});