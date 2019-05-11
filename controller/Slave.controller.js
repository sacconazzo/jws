sap.ui.define([
	"Wstat/controller/BaseController",
	"sap/ui/core/routing/History"
], function (BaseController, History) {
	"use strict";
	return BaseController.extend("Wstat.controller.Slave", {
		interval: null,
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("detail").attachMatched(this.handleRouteMatched, this);
			var that = this;
			sap.ui.require(["sap/ui/richtexteditor/RichTextEditor"],
				function (RTE) {
					var oRichTextEditor = new RTE("myRTE", {
						editorType: sap.ui.richtexteditor.EditorType.TinyMCE4,
						width: "100%",
						height: "550px",
						customToolbar: true,
						showGroupFont: true,
						showGroupUndo: true,
						showGroupFontStyle: true,
						showGroupStructure: true,
						showGroupClipboard: false,
						showGroupTextAlign: true,
						showGroupLink: true,
						showGroupInsert: true,
						wrapping: false,
						value: "{global>/detailRTF/note}"
					});
					var oLayout = that.getView().byId("idVerticalLayout");
					oLayout.addContent(oRichTextEditor);
					sap.ui.getCore().applyChanges();
					oRichTextEditor.addButtonGroup("styleselect").addButtonGroup("table");
					oRichTextEditor.attachChange(that.checkChange, that);
				});
			var s, r, t;
			r = false;
			s = document.createElement('script');
			s.src = "tools/tidy.js";
			s.type = 'text/javascript';
			s.onload = function () {
				if (!r && (!this.readyState || this.readyState == 'complete')) {
					r = true;
					that.beutify();
				}
			};
			t = document.getElementsByTagName('script')[0];
			t.parentElement.insertBefore(s, t);
		},
		beutify: function (oEvent) {
			var options = {
				"indent": "auto",
				"indent-spaces": 1,
				"wrap": 200,
				"markup": true,
				"output-xml": false,
				"numeric-entities": true,
				"quote-marks": false,
				"quote-nbsp": false,
				"show-body-only": true,
				"quote-ampersand": false,
				"break-before-br": true,
				"uppercase-tags": false,
				"uppercase-attributes": false,
				"drop-font-tags": false,
				"tidy-mark": false
			};
			var oModel = this.getOwnerComponent().getModel("global");
			var detail = oModel.getProperty("/detailRTF");
			detail.note = tidy_html5(detail.note, options);
			oModel.setProperty("/detailRTF", Object.assign({}, detail));
		},
		checkChange: function (oEvent) {
			var oModel = this.getOwnerComponent().getModel("global");
			var that = this;
			if (oModel.getProperty("/detailRTF").note != oModel.getProperty("/detailDB").note) {
				that.save();
			}
		},
		onDelete: function (oEvent) {
			var that = this;
			this.onConfirm("Delete item?", function () {
				that.onExit(1);
			});
		},
		onCode: function (oEvent) {
			jQuery.sap.delayedCall(500, this, function () {
				this.beutify(oEvent);
			});
		},
		onBack: function (oEvent) {
			this.onExit(0);
		},
		onExit: function (Del) {
			var oModel = this.getOwnerComponent().getModel("global");
			var rtf = oModel.getProperty("/detailRTF");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.saveDay(rtf.val, rtf.note, rtf.DATE, Del, function () {
				oRouter.navTo("main", true);
			});
		},
		handleRouteMatched: function (oEvent) {
			jQuery.sap.delayedCall(500, this, function () { });
			if (oEvent.getParameter("day") === "main") {
				//this.params();
			}
		},
		save: function (oEvent) {
			var oModel = this.getOwnerComponent().getModel("global");
			var rtf = oModel.getProperty("/detailRTF");
			var that = this;
			this.saveDay(rtf.val, rtf.note, rtf.DATE, 0, function () {
				oModel.setProperty("/detailDB", Object.assign({}, rtf));
				var now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
				oModel.setProperty("/saved", now);
			});
		}
	});
});