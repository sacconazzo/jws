sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	'sap/m/Dialog',
	'sap/m/Text',
	'sap/m/Button',
	'sap/m/Label',
	'sap/m/Input',
	'sap/m/TextArea',
	'sap/m/Slider',
	'sap/m/MessageBox'
], function (Controller, History, Dialog, Text, Button, Label, Input, TextArea, Slider, MessageBox) {
	"use strict"
	return Controller.extend("sap.ui.comp.personalization.BaseController", {
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this)
		},
		onBack: function () {
			var oHistory = History.getInstance()
			var sPreviousHash = oHistory.getPreviousHash()
			if (sPreviousHash !== undefined) {
				window.history.go(-1)
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this)
				oRouter.navTo("main", true)
			}
		},
		onMsg: function (Title, Msg) {
			var dialog = new Dialog({
				title: Title,
				type: "Message",
				state: "Information",
				content: new Text({
					text: Msg
				}),
				beginButton: new Button({
					text: "OK",
					press: function () {
						dialog.close()
					}
				}),
				afterClose: function () {
					dialog.destroy()
				}
			})
			dialog.open()
		},
		onSuccess: function (Title, Msg, Navi) {
			var dialog = new Dialog({
				title: Title,
				type: 'Message',
				state: 'Success',
				content: new Text({
					text: Msg
				}),
				beginButton: new Button({
					text: 'OK',
					press: function () {
						dialog.close()
					}
				}),
				afterClose: jQuery.proxy(function () {
					dialog.destroy()
					if (Navi) {
						this.getRouter().navTo(Navi, {})
					}
				}, this)
			})
			dialog.open()
		},
		onLoginConfirm: function (dialog, From) {
			var mUser = sap.ui.getCore().byId('Username').getValue()
			var mPwd = sap.ui.getCore().byId('Password').getValue()
			jQuery.sap.require("jquery.sap.storage")
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local)
			oStorage.remove("myUser")
			oStorage.remove("myToken")
			oStorage.remove("wstat")
			oStorage.clear()
			oStorage.put("myUser", mUser)
			oStorage.put("myToken", this.SHA256(mPwd))
			dialog.close()
			dialog.destroy()
			this.onSelect(From)
			//window.location.reload();
		},
		onConfirm: function (Title, Msg, Callback) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length
			MessageBox.confirm(
				Msg, {
					title: Title,
					onClose: (oAction) => {
						if (oAction == "OK") {
							Callback()
						}
					},
					styleClass: bCompact ? "sapUiSizeCompact" : ""
				}
			)
		},
		onLogIn: function (From) {
			var dialog = new Dialog({
				title: 'DailyNotes',
				type: 'Message',
				content: [
					new Input("Username", {
						type: sap.m.InputType.Text,
						placeholder: 'Username'
					}),
					new Input("Password", {
						type: sap.m.InputType.Password,
						placeholder: 'Password'
					})
				],
				beginButton: new Button({
					text: 'OK',
					press: () => {
						this.onLoginConfirm(dialog, From)
					}
				}),
				endButton: new Button({
					text: 'Cancel',
					press: function () {
						dialog.destroy()
					}
				}),
				afterClose: function () {
					dialog.destroy()
				}
			})

			var checkEnter = evt => {
				if (evt.keyCode == 13) {
					this.onLoginConfirm(dialog, From)
				}
			}
			sap.ui.getCore().byId('Username').attachBrowserEvent("keypress", checkEnter)
			sap.ui.getCore().byId('Password').attachBrowserEvent("keypress", checkEnter)
			dialog.open()
		},
		onChangeConfirm: function (dialog, Model, Mode) {
			var mVal = sap.ui.getCore().byId('Valore').getValue()
			var mNote = sap.ui.getCore().byId('Note').getValue()
			var Del = 0
			var detail = null
			if (Mode == 1) {
				Del = 1
			}
			if (Mode == 2) {
				detail = updated => {
					Model.oData.detail.updated = updated
					Model.setProperty("/detailRTF", Model.oData.detail)
					Model.setProperty("/detailDB", Object.assign({}, Model.oData.detail))
					Model.setProperty("/saved")
					Model.setProperty("/conflict", false)
					Model.setProperty("/code", false)
					var oRouter = sap.ui.core.UIComponent.getRouterFor(this)
					oRouter.navTo("detail", {
						day: Model.oData.detail.DATE
					})
				}
			}
			var check = http => {
				if (http.status == 200) {
					if (jQuery.isFunction(detail)) {
						detail(http.response.replace(/(\r\n|\n|\r)/gm, ""))
					}
				} else {
					this.onMsg("DailyNotes", "È presente un conflitto di versione.\nAggiornare prima il calendario")
				}
			}
			this.saveDay(mVal, mNote, Model.oData.detail.DATE, Del, Model.oData.detail.updated, check)
			dialog.close()
		},
		saveDay: function (Val, Note, Date, Del, Updated, Callback) {
			jQuery.sap.require("jquery.sap.storage")
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local)
			var mUser = oStorage.get("myUser")
			var mToken = oStorage.get("myToken")
			let http = new XMLHttpRequest()
			let url = 'https://sacconazzo.altervista.org/api/?fn=set-bethel-stat'
			//let params = 'usr='+mUser+'&pwd='+mPwd+'&val='+Val+'¬e='+encodeURI(Note)+'&date='+Date;
			let params = {
				usr: mUser,
				token: mToken,
				date: Date,
				val: Val,
				note: Note,
				del: Del,
				timestamp: Updated
			}
			let req = JSON.stringify(params)
			http.open('POST', url, true)
			http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
			http.onreadystatechange = () => {
				if (http.readyState == 4) {
					if (http.status == 200) { //accettato
						if (jQuery.isFunction(this.onSelect)) {
							this.onSelect(Date)
						}
						Callback(http)
					} else if (http.status == 205) { //non accettato, conflitto con salvataggio
						Callback(http)
					}
				}
			}
			http.send(req)
		},
		onChangeDate: function (Model) {
			var dialog = new Dialog({
				title: "{/detail/DATE}",
				type: 'Message',
				contentWidth: "450px",
				content: [
					new Slider("Valore", {
						enableTickmarks: false,
						showAdvancedTooltip: true,
						inputsAsTooltips: true,
						min: 1,
						max: 10,
						width: "100%",
						value: "{/detail/val}"
					}),
					//new Input("Valore", { type: sap.m.InputType.Number, placeholder: 'Valore', value: "{/detail/val}" }),
					new TextArea("Note", {
						width: '100%',
						placeholder: 'Note',
						value: "{/detail/note}",
						visible: false
					})
				],
				buttons: [
					new Button({
						//text: 'OK',
						icon: "sap-icon://accept",
						press: () => {
							this.onChangeConfirm(dialog, Model, 0)
						}
					}),
					new Button({
						icon: "sap-icon://edit",
						press: () => {
							this.onChangeConfirm(dialog, Model, 2)
						}
					}),
					new Button({
						icon: "sap-icon://delete",
						press: () => {
							this.onConfirm("DailyNotes", "Delete item?", () => {
								this.onChangeConfirm(dialog, Model, 1)
							})
						}
					}),
					new Button({
						//text: 'Cancel',
						icon: "sap-icon://decline",
						press: function () {
							dialog.destroy()
						}
					})
				],
				afterClose: function () {
					dialog.destroy()
				}
			})

			var checkEnter = evt => {
				if (evt.keyCode == 13) {
					this.onChangeConfirm(dialog, Model)
				}
			}
			sap.ui.getCore().byId('Valore').attachBrowserEvent("keypress", checkEnter)
			//sap.ui.getCore().byId('Note').attachBrowserEvent("keypress", checkEnter);
			dialog.setModel(Model)
			dialog.open()
		},
		SHA256: function (s) {
			var chrsz = 8
			var hexcase = 0

			function safe_add(x, y) {
				var lsw = (x & 0xFFFF) + (y & 0xFFFF)
				var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
				return (msw << 16) | (lsw & 0xFFFF)
			}

			function S(X, n) {
				return (X >>> n) | (X << (32 - n))
			}

			function R(X, n) {
				return (X >>> n)
			}

			function Ch(x, y, z) {
				return ((x & y) ^ ((~x) & z))
			}

			function Maj(x, y, z) {
				return ((x & y) ^ (x & z) ^ (y & z))
			}

			function Sigma0256(x) {
				return (S(x, 2) ^ S(x, 13) ^ S(x, 22))
			}

			function Sigma1256(x) {
				return (S(x, 6) ^ S(x, 11) ^ S(x, 25))
			}

			function Gamma0256(x) {
				return (S(x, 7) ^ S(x, 18) ^ R(x, 3))
			}

			function Gamma1256(x) {
				return (S(x, 17) ^ S(x, 19) ^ R(x, 10))
			}

			function core_sha256(m, l) {
				var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2)
				var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19)
				var W = new Array(64)
				var a, b, c, d, e, f, g, h, i, j
				var T1, T2
				m[l >> 5] |= 0x80 << (24 - l % 32)
				m[((l + 64 >> 9) << 4) + 15] = l
				for (var i = 0; i < m.length; i += 16) {
					a = HASH[0]
					b = HASH[1]
					c = HASH[2]
					d = HASH[3]
					e = HASH[4]
					f = HASH[5]
					g = HASH[6]
					h = HASH[7]
					for (var j = 0; j < 64; j++) {
						if (j < 16) W[j] = m[j + i]
						else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16])
						T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j])
						T2 = safe_add(Sigma0256(a), Maj(a, b, c))
						h = g
						g = f
						f = e
						e = safe_add(d, T1)
						d = c
						c = b
						b = a
						a = safe_add(T1, T2)
					}
					HASH[0] = safe_add(a, HASH[0])
					HASH[1] = safe_add(b, HASH[1])
					HASH[2] = safe_add(c, HASH[2])
					HASH[3] = safe_add(d, HASH[3])
					HASH[4] = safe_add(e, HASH[4])
					HASH[5] = safe_add(f, HASH[5])
					HASH[6] = safe_add(g, HASH[6])
					HASH[7] = safe_add(h, HASH[7])
				}
				return HASH
			}

			function str2binb(str) {
				var bin = Array()
				var mask = (1 << chrsz) - 1
				for (var i = 0; i < str.length * chrsz; i += chrsz) {
					bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i % 32)
				}
				return bin
			}

			function Utf8Encode(string) {
				string = string.replace(/\r\n/g, "\n")
				var utftext = ""
				for (var n = 0; n < string.length; n++) {
					var c = string.charCodeAt(n)
					if (c < 128) {
						utftext += String.fromCharCode(c)
					} else if ((c > 127) && (c < 2048)) {
						utftext += String.fromCharCode((c >> 6) | 192)
						utftext += String.fromCharCode((c & 63) | 128)
					} else {
						utftext += String.fromCharCode((c >> 12) | 224)
						utftext += String.fromCharCode(((c >> 6) & 63) | 128)
						utftext += String.fromCharCode((c & 63) | 128)
					}
				}
				return utftext
			}

			function binb2hex(binarray) {
				var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef"
				var str = ""
				for (var i = 0; i < binarray.length * 4; i++) {
					str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
						hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF)
				}
				return str
			}
			s = Utf8Encode(s)
			return binb2hex(core_sha256(str2binb(s), s.length * chrsz))
		}
	})
})