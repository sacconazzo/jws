sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"Wstat/model/models",
	"sap/ui/model/json/JSONModel"
], function (UIComponent, Device, models, JSONModel) {
	"use strict";
	return UIComponent.extend("Wstat.Component", {
		metadata: {
			//manifest: "json",
			"version": "1.0.0",
			"rootView": {
				viewName: "Wstat.view.Master",
				type: sap.ui.core.mvc.ViewType.XML
			},
			"dependencies": {
				"libs": [
					"sap.ui.core",
					"sap.m",
					"sap.ui.layout"
				]
			},
			"config": {
				"i18nBundle": "Wstat.i18n.i18n",
				"icon": "",
				"favIcon": "",
				"phone": "",
				"phone@2": "",
				"tablet": "",
				"tablet@2": "",
				"serviceConfig": {
					"name": "stat",
					"serviceUrl": "https://sacconazzo.altervista.org/api/"
				}
			},
			"routing": {
				"config": {
					"routerClass": "sap.m.routing.Router",
					"viewType": "XML",
					"viewPath": "Wstat.view",
					"targetAggregation": "pages",
					// "clearTarget": "false",
					"transition": "slide"
				},
				"routes": [{
					"pattern": "",
					"name": "main",
					"view": "Main",
					"targetAggregation": "pages",
					"targetControl": "customApp"
				}, {
					"pattern": "detail/:day:/",
					"name": "detail",
					"view": "Slave",
					"targetAggregation": "pages",
					"targetControl": "customApp"
				}, {
					"pattern": "filter/",
					"name": "filter",
					"view": "Filter",
					"targetAggregation": "pages",
					"targetControl": "customApp"
				}]
			}

		},
		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this method, the resource and application models are set.
		 * @public
		 * @override
		 */
		init: function () {

			var mConfig = this.getMetadata().getConfig();
			// set the i18n model
			this.setModel(models.createResourceModel(mConfig.i18nBundle), "i18n");
			// call the base component's init function
			jQuery.sap.require("jquery.sap.storage");

			sap.ui.getCore().getConfiguration().setLanguage("en");

			var oModel = new sap.ui.model.json.JSONModel({});
			//oModel.setSizeLimit(1000);
			this.setModel(oModel);

			var oModelJSON = new sap.ui.model.json.JSONModel({});
			oModelJSON.setSizeLimit(1000);
			this.setModel(oModelJSON, "global");

			UIComponent.prototype.init.apply(this, arguments);
			this.getRouter().initialize();
			// create the views based on the url/hash

		}
	});
});