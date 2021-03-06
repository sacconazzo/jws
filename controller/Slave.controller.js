sap.ui.define([
	"Wstat/controller/BaseController",
	"sap/ui/core/routing/History"
], function (BaseController, History) {
	"use strict"
	return BaseController.extend("Wstat.controller.Slave", {
		interval: null,
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this)
			oRouter.getRoute("detail").attachMatched(this.handleRouteMatched, this)
			sap.ui.require(["sap/ui/richtexteditor/RichTextEditor"],
				RTE => {
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
					})
					var oLayout = this.getView().byId("idVerticalLayout")
					oLayout.addContent(oRichTextEditor)
					sap.ui.getCore().applyChanges()
					oRichTextEditor.addButtonGroup("styleselect").addButtonGroup("table")
					//oRichTextEditor.attachChange(this.checkChange, this)
				})
			var s, r, t
			r = false
			s = document.createElement('script')
			s.src = "tools/tidy.js"
			s.type = 'text/javascript'
			s.onload = () => {
				if (!r && (!this.readyState || this.readyState == 'complete')) {
					r = true
					this.beutify()
				}
			}
			t = document.getElementsByTagName('script')[0]
			t.parentElement.insertBefore(s, t)
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
			}
			var oModel = this.getOwnerComponent().getModel("global")
			var detail = oModel.getProperty("/detailRTF")
			detail.note = tidy_html5(detail.note, options)
			oModel.setProperty("/detailRTF", Object.assign({}, detail))
		},
		checkChange: function (oEvent) {
			var oModel = this.getOwnerComponent().getModel("global")
			if (oModel.getProperty("/detailRTF").note != oModel.getProperty("/detailDB").note) {
				this.save()
			}
		},
		onDelete: function (oEvent) {
			this.onConfirm("DailyNotes", "Delete item?", () => {
				this.onExit(1)
			})
		},
		onCode: function (oEvent) {
			jQuery.sap.delayedCall(500, this, function () {
				this.beutify(oEvent)
			})
		},
		onBack: function (oEvent) {
			this.onExit(0)
		},
		onExit: function (Del) {
			var oModel = this.getOwnerComponent().getModel("global")
			var rtf = oModel.getProperty("/detailRTF")
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this)
			this.saveDay(rtf.val, rtf.note, rtf.DATE, Del, rtf.updated, http => {
				if (http.status == 200) {
					oRouter.navTo("main", true)
				} else {
					this.onConfirm("DailyNotes", "È presente un conflitto di versione. Ricaricare il calendario?\n(Si perderanno queste ultime modifiche)", () => {
						oRouter.navTo("main", true)
					})
				}
			})
		},
		handleRouteMatched: function (oEvent) {
			jQuery.sap.delayedCall(500, this, function () {})
			if (oEvent.getParameter("day") === "main") {
				//this.params();
			}
		},
		save: function (oEvent) {
			var oModel = this.getOwnerComponent().getModel("global")
			var rtf = oModel.getProperty("/detailRTF")
			this.saveDay(rtf.val, rtf.note, rtf.DATE, 0, rtf.updated, http => {
				if (http.status == 200) {
					rtf.updated = http.response.replace(/(\r\n|\n|\r)/gm, "")
					oModel.setProperty("/detailDB", Object.assign({}, rtf))
					var now = new Date().toLocaleTimeString([], {
						hour: 'numeric',
						minute: '2-digit'
					})
					oModel.setProperty("/saved", now)
				} else if (http.status == 205) {
					oModel.setProperty("/conflict", true)
				}
			})
		}
	})
})