oApplication = { // Application is an object
	load: function (src, id, libs, theme, callback) {
		setTimeout(() => {
			this.loadSAPUI5(src, id, libs, theme, callback)
		}, 0)
	},
	loadSAPUI5: function (src, id, libs, theme, callback) {
		var s, r, t
		r = false
		s = document.createElement('script')
		s.type = 'text/javascript'
		s.src = src
		s.id = id
		s.setAttribute("data-sap-ui-libs", libs)
		s.setAttribute("data-sap-ui-theme", theme)
		s.setAttribute("data-sap-ui-resourceroots", '{"Wstat": ""}')
		s.setAttribute("data-sap-ui-compatVersion", "edge")
		s.onload = s.onreadystatechange = function () {
			//console.log( this.readyState ); //uncomment this line to see which ready states are called.
			if (!r && (!this.readyState || this.readyState == 'complete')) {
				r = true
				callback()
			}
		}
		t = document.getElementsByTagName('script')[0]
		t.parentElement.insertBefore(s, t)
	},
	onSAPUI5Loaded: function () {
		var shell = oApplication.initializeUI5()
		$("#fade").fadeOut("slow", function () {
			$("#content").empty()
			$("#content").removeAttr('style')
			$(".title").fadeIn("slow")
			shell.placeAt("content")
			//$(this).fadeIn("slow");
		})
	},
	initializeUI5: function () {
		var shell
		sap.ui.getCore().attachInit(function () {
			shell = new sap.m.Shell({
				app: new sap.ui.core.ComponentContainer({
					height: "100%",
					name: "Wstat",
					componentCreated: function () {}
				})
			})
		})
		return shell
	}
}