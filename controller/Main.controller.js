sap.ui.define([
    "Wstat/controller/BaseController",
    'sap/ui/unified/DateRange',
    'sap/ui/unified/CalendarLegendItem',
    'sap/ui/unified/DateTypeRange'
], function (BaseController, DateRange, CalendarLegendItem, DateTypeRange) {
    "use strict";
    var vStart;
    var vDateDetail;
    var oCal;
    return BaseController.extend("Wstat.controller.Main", {
        oFormatYyyymmdd: null,
        oFormatW: null,
        onInit: function () {
            this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this._oRouter.attachRouteMatched(this.handleRouteMatched, this);
            sap.ui.core.LocaleData.getInstance(sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale()).mData["weekData-firstDay"] = 1;
            this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
                pattern: "yyyy-MM-dd",
                calendarType: sap.ui.core.CalendarType.Gregorian
            });
            this.oFormatW = sap.ui.core.format.DateFormat.getInstance({
                pattern: "w",
                calendarType: sap.ui.core.CalendarType.Gregorian
            });
            oCal = this.byId("calendar");
            oCal.attachBrowserEvent("click", this.handleClick, this);
            oCal.attachBrowserEvent("touchend", this.handleClick, this);
        },
        onExit: function () {
            oCal.destroySpecialDates();
            oCal.removeAllSpecialDates();
            try {
                oCal.destroy();
            } catch (e) {}
        },
        handleRouteMatched: function (oEvent) {
            jQuery.sap.delayedCall(500, this, function () {
                if (vStart == undefined) {
                    vStart = this.oFormatYyyymmdd.format(new Date());
                }
                this.onSelect(vStart);
            });
            if (oEvent.getParameter("name") === "main") {
                //this.params();
            }
        },
        handleCalendarSelect: function (oEvent) {
            var oCalendar = oEvent.oSource;
            this.selectday(oCalendar);
        },
        handleClick: function (oEvent) {
            //jQuery.sap.delayedCall(100, this, function() {
            //	var current = this.oFormatYyyymmdd.format(oCal._getFocusedDate());
            //	if (vStart.substring(0, 7) !== current.substring(0, 7)) {
            //		this.onSelect(current);
            //	}
            //});
        },
        onFilter: function (oEvent) {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("filter");
        },
        selectday: function (oCalendar) {
            var oModel = this.getOwnerComponent().getModel("global");
            var aSelectedDates = oCalendar.getSelectedDates();
            if (aSelectedDates.length > 0) {
                var dDate = aSelectedDates[0].getStartDate();
                var dDateFormatted = this.oFormatYyyymmdd.format(dDate);
                //this.focusDay(dDateFormatted);
                if (vStart.substring(0, 7) !== dDateFormatted.substring(0, 7) && oModel.getProperty("/online")) {
                    this.onSelect(dDateFormatted);
                } else {
                    var oModel = this.getOwnerComponent().getModel("global");
                    oModel.setProperty("/wstat", this.setVisible(oModel.getProperty("/wstat"), dDateFormatted));
                    vStart = dDateFormatted;
                }
                // RG - simula doppio click
                if ((vDateDetail) && ((this.oFormatYyyymmdd.format(vDateDetail) === this.oFormatYyyymmdd.format(dDate)))) {
                    this.detail(dDate);
                }
                vDateDetail = dDate;
                jQuery.sap.delayedCall(500, this, function () {
                    vDateDetail = null;
                });
            }
        },
        itmPress: function (oEvent) {
            var item = oEvent.mParameters.listItem.oBindingContexts.global.sPath;
            var index = item.split('/')[3];
            var oModel = this.getOwnerComponent().getModel("global");
            var all = oModel.getProperty("/wstat");
            oModel.setProperty("/detailRTF", all.stats[index]);
            oModel.setProperty("/detailDB", Object.assign({}, all.stats[index]));
            oModel.setProperty("/saved");
            oModel.setProperty("/code", false);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            if (oModel.getProperty("/online")) {
                oRouter.navTo("detail", {
                    day: all.stats[index].DATE
                });
            }
        },
        change: function (oControlEvent) {
            this.onSelect(this.oFormatYyyymmdd.format(this.byId("calendar").getStartDate()));
        },
        detail: function (Day) {
            //Model
            var oModel = this.getOwnerComponent().getModel("global");
            oModel.setProperty("/detail");
            var jModel = oModel.getProperty("/wstat");
            var j = 0;
            var jDetail = [];
            if (jModel != undefined) {
                for (var i = 0; i < jModel.stats.length; i++) {
                    if (jModel.stats[i].DATE === this.oFormatYyyymmdd.format(Day)) {
                        jDetail[j] = jModel.stats[i];
                        j++;
                    }
                }
            }
            if (jDetail.length === 0) {
                jDetail[0] = {
                    "DATE": this.oFormatYyyymmdd.format(Day),
                    "val": 1,
                    "note": ""
                };
            }
            oModel.setProperty("/detail", Object.assign({}, jDetail[0]));
            //Popup
            if (oModel.getProperty("/online")) {
                this.onChangeDate(oModel);
            }
        },
        getWeek: function (Day) {
            return this.oFormatW.format(new Date(Day));
        },
        setVisible: function (Data, Day) {
            for (var i = 0; i < Data.stats.length; i++) {
                Data.stats[i].visible = Data.stats[i].active ? (this.getWeek(Day) === this.getWeek(Data.stats[i].DATE)) : false;
            }
            return Data;
        },
        onRefresh: function () {
            if (vStart == undefined) {
                vStart = this.oFormatYyyymmdd.format(new Date());
            }
            this.onSelect(vStart);
        },
        onSelect: function (From) {
            //sap.ui.core.BusyIndicator.show(0);
            var oTab = this.byId("idStaffing");
            oTab.setBusy(true);
            //var oRestModel = this.getView().getModel();
            var oModel = this.getOwnerComponent().getModel("global");
            //var oModel = new sap.ui.model.json.JSONModel({});
            var more = "/?fn=get-bethel-stat";
            if (From) {
                more = "&from=" + From;
            }
            jQuery.sap.require("jquery.sap.storage");
            var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
            var mUser = oStorage.get("myUser");
            var mToken = oStorage.get("myToken");
            let http = new XMLHttpRequest();
            let url = 'https://sacconazzo.altervista.org/api/?fn=get-bethel-stat';
            let params = 'usr=' + mUser + '&token=' + mToken + '' + more;
            var that = this;
            http.open('POST', url, true);
            http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            http.onreadystatechange = function () {
                if (http.readyState == 4) {
                    $(".loader").fadeOut("slow", function () {
                        $("#fade").fadeIn("slow");
                    });
                    if (http.status == 200) {
                        //sap.ui.core.UIArea.rerenderControl(that.byId("idStaffing"));
                        var data = that.setVisible(that.mergeLocal(JSON.parse(http.responseText)), From);
                        oModel.setProperty("/wstat");
                        oModel.setProperty("/wstat", data);
                        //that.getOwnerComponent().setModel(oModel, "global");
                        //oModel.setJSON(http.responseText);
                        //that.byId("idStaffing").setModel(oModel);
                        oTab.setBusy(false);
                        that.infoCalendar(data);
                        vStart = From;
                        oModel.setProperty("/online", true);
                        that.setOffline(data);
                        //that.focusDay(vStart);
                    } else if (http.status == 400) {
                        oTab.setBusy(false);
                        oModel.setProperty("/wstat");
                        oCal.destroySpecialDates();
                        oCal.removeAllSpecialDates();
                        vStart = From;
                    } else if (http.status == 0) { ///offline mode
                        oModel.setProperty("/online", false);
                        sap.m.MessageToast.show("sei offline");
                        oModel.setProperty("/wstat");
                        oModel.setProperty("/wstat", that.getOffline());
                        that.infoCalendar(oModel.getProperty("/wstat"));
                        oTab.setBusy(false);
                        vStart = From;
                    } else {
                        oTab.setBusy(false);
                        oModel.setProperty("/wstat");
                        vStart = From;
                        that.logOut();
                    }
                }
            };
            //this.clearTable();
            //that.byId("idStaffing").destroyItems();
            //sap.ui.getCore().applyChanges();
            http.send(params);
        },
        mergeLocal: function (data) {
            ///gestire i cancellati!!!!! con statoda servizio
            var local = this.getOffline();
            if (local != undefined) {
                //data.stats = data.stats.map(x => Object.assign(x, local.stats.find(y => y.DATE == x.DATE))); //questo unisce proprietà su stessa chiave
                data.stats = data.stats.concat(local.stats);
                for (var i = 0; i < data.stats.length; ++i) {
                    for (var j = i + 1; j < data.stats.length; ++j) {
                        if (data.stats[i].DATE === data.stats[j].DATE)
                            data.stats.splice(j--, 1);
                    }
                }
                data.stats.sort((a, b) => {
                    if (a.DATE < b.DATE) {
                        return -1
                    } else if (a.DATE > b.DATE) {
                        return 1
                    } else {
                        return 0
                    }
                });
            }
            return data;
        },
        setOffline: function (data) {
            var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
            oStorage.get("wstat");
            oStorage.put("wstat", data);
        },
        getOffline: function () {
            var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
            return oStorage.get("wstat");
        },
        focusDay: function (Day) {
            var oModel = this.getOwnerComponent().getModel("global");
            var Data = oModel.getProperty("/wstat");
            var table = this.getView().byId("idStaffing");
            var cols = table.getColumns();
            var items = table.getItems();
            var i;
            for (i = 0; i < items.length; i++) {
                var colArray = [];
                var cellId = "";
                var cellObj = "";
                var cellVal = "";
                var item = items[i];
                var itemId = table.getAggregation("items")[i].getId();
                var itemObj = sap.ui.getCore().byId(itemId);
                var cellId = item.getAggregation("cells")[0].getId();
                var cellObj = sap.ui.getCore().byId(cellId);
                for (var j = 0; j < Data.stats.length; j++) {
                    if (Data.stats[j].DATE == Day && Data.stats[j].visible == true && Data.stats[j].ID == cellObj.getText()) {
                        itemObj.focus();
                    }
                }
                //for(var j=1; j<cols.length;j++){
                //cellId = item.getAggregation("cells")[j].getId();
                //cellObj = sap.ui.getCore().byId(cellId);
                //cellVal = cellObj.getText();//getting the column value
                //cellObj.setContent("val");
                //}
            }
        },
        infoCalendar: function (oData) {
            var Data = oData.stats;
            //var oLeg = this.byId("legend");
            oCal.destroySpecialDates();
            oCal.removeAllSpecialDates();
            //oLeg.destroyItems();
            for (var i = 0; i < Data.length; i++) {
                var sType = "";
                var sTooltip = "";
                if (Data[i].active) {
                    switch (true) {
                        case (Data[i].val == 5): // HOLIDAYS - blu
                            sTooltip = "5";
                            sType = "Type08";
                            break;
                        case (Data[i].val >= 0 && Data[i].val <= 1): // INATTIVO - viola
                            sType = "Type10"; // OK
                            sTooltip = "0-1";
                            break;
                        case (Data[i].val >= 8 && Data[i].val <= 10): // ESATTAMENTE 8 - verde
                            sType = "Type06"; // OK
                            //sTooltip = Data[i].Task + " " + Data[i].Note;
                            sTooltip = "8-10";
                            break;
                        case (Data[i].val >= 6 && Data[i].val <= 7): // TRA 1 - 7 - verde chiaro
                            sTooltip = "6-7";
                            sType = "Type09";
                            break;
                        case (Data[i].val >= 2 && Data[i].val <= 4): // Superiore 8 - rosso
                            sTooltip = "2-4";
                            sType = "Type03";
                            break;
                        default:
                            break;
                    }
                }
                if (sType !== "") {
                    oCal.addSpecialDate(new DateTypeRange({
                        startDate: new Date(Data[i].DATE),
                        type: sType,
                        tooltip: sTooltip
                    }));
                }
            }
            // oLeg.addItem(new CalendarLegendItem({
            // 	text: "Over then 8",
            // 	type: sap.ui.unified.CalendarDayType.Type05
            // }));
        },
        dialogAfterclose: function (oEvent) {},
        dialogBeforeclose: function (oEvent) {},
        confirm: function (oEvent) {
            this._oDialog.close();
        },
        logOut: function () {
            this.onLogIn(vStart);
        }
    });
});