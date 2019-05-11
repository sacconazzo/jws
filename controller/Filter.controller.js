sap.ui.define([
    "Wstat/controller/BaseController",
    'jquery.sap.global',
    "sap/ui/core/routing/History",
    'sap/ui/core/Title',
    'sap/ui/model/json/JSONModel',
    'sap/viz/ui5/data/FlattenedDataset',
    'sap/viz/ui5/controls/common/feeds/FeedItem',
    'sap/viz/ui5/controls/Popover',
    'sap/viz/ui5/controls/VizFrame',
    'sap/viz/ui5/format/ChartFormatter',
    'sap/viz/ui5/api/env/Format'
], function (BaseController, jQuery, History, Title, JSONModel, FlattenedDataset, FeedItem, Popover, VizFrame, ChartFormatter, Format) {
    "use strict";
    return BaseController.extend("Wstat.controller.Filter", {
        delaySearch: null, 
        //dataPath : "https://sapui5.hana.ondemand.com/test-resources/sap/viz/demokit/dataset/milk_production_testing_data/date_cost",
        value: {
            text: "Days Chart",
            vizType: "timeseries_line",
            //json : "/cost_year_month.json",
            dataset: {
                "dimensions": [{
                    "name": "DateChart",
                    "value": "{DateChart}",
                    "dataType": 'date'
                }],
                "measures": [{
                    "name": "val",
                    "value": "{val}"
                }],
                data: {
                    path: "/stats"
                }
            },
            vizProperties: {
                timeAxis: {
                    title: {
                        visible: false
                    },
                    levels: ["year", "month", "day"]
                },
                plotArea: {
                    window: {
                        start: "firstDataPoint",
                        end: "lastDataPoint"
                    },
                    dataPoint: {
                        invalidity: "ignore"
                    }
                },
                valueAxis: {
                    title: {
                        visible: false
                    },
                    label: {
                        formatString: ChartFormatter.DefaultPattern.SHORTFLOAT
                    }
                },
                title: {
                    visible: false
                },
                legend: {
                    visible: false
                }
            }
        },
        oFormatDate: null,
        oChartContainer: null,
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("filter").attachMatched(this.handleRouteMatched, this);
            this.oFormatDate = sap.ui.core.format.DateFormat.getInstance({
                pattern: "yyyy-MM-dd",
                calendarType: sap.ui.core.CalendarType.Gregorian
            });
            var today = new Date();
            var year = today.getFullYear();
            if (today.getMonth() < 8) {
                year--;
            }
            var from = new Date(year + "-09-01");
            var to = new Date(year + 1 + "-08-31");

            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData({
                delimiter: "|",
                dateFrom: from,
                dateTo: to,
                filter: "",
                graph: false,
                stats: [],
            });
            this.getView().setModel(oModel);

            //graph
            Format.numericFormatter(ChartFormatter.getInstance());
            var oView = this.getView();
            var bindValue = this.value;
            var feedValueAxis, feedTimeAxis, oVizFrame, oDataset, dataModel, titleText, oPopOver;
            titleText = new Title({
                'text': bindValue.text
            });
            oPopOver = new Popover({});
            oVizFrame = oView.byId("idChart");
            oDataset = new FlattenedDataset(bindValue.dataset);
            oVizFrame.setDataset(oDataset);
            oVizFrame.setVizType(bindValue.vizType);
            oVizFrame.setVizProperties(bindValue.vizProperties);
            feedTimeAxis = new FeedItem({
                'uid': "timeAxis",
                'type': "Dimension",
                'values': ["DateChart"]
            });
            feedValueAxis = new FeedItem({
                'uid': "valueAxis",
                'type': "Measure",
                'values': ["val"]
            });
            oVizFrame.addFeed(feedTimeAxis);
            oVizFrame.addFeed(feedValueAxis);
            oPopOver.connect(oVizFrame.getVizUid());
            oPopOver.setFormatString(ChartFormatter.DefaultPattern.STANDARDFLOAT);
            jQuery.sap.require("sap/suite/ui/commons/ChartContainer");
            var oChartContainerContent = new sap.suite.ui.commons.ChartContainerContent({
                icon: "sap-icon://line-chart-time-axis",
                title: "vizFrame Line Chart Sample",
                content: [oVizFrame]
            });
            this.oChartContainer = new sap.suite.ui.commons.ChartContainer({
                id: "idChartCont",
                content: [oChartContainerContent]
            });
            this.oChartContainer.setShowFullScreen(true);
            //this.oChartContainer.setAutoAdjustHeight(true);
            oView.byId("chartFixFlex").setMinFlexSize(parseInt($(window).width() / 1.2));
            oView.byId('chartFixFlex').setFlexContent(this.oChartContainer);
            $(window).resize(function () {
                oView.byId("chartFixFlex").setMinFlexSize(parseInt($(window).width() / 1.2));
            });

        },
        handleRouteMatched: function (oEvent) {
            jQuery.sap.delayedCall(500, this, function () { });
            if (oEvent.getParameter("name") === "filter") {
                var oData = this.getView().getModel().getData();
                this.onFilter(this.oFormatDate.format(oData.dateFrom), this.oFormatDate.format(oData.dateTo));
            }
        },
        onSearch: function (oEvent) {
            this.filter(true);
        },
        onChange: function (oEvent) {
            var that = this;
            clearTimeout(this.delaySearch);
            this.delaySearch = setTimeout(function() {
                //that.filter(false);
            }, 1);
        },
        filter: function (force) {
            var oModelData = this.getOwnerComponent().getModel("global");
            var oModelPars = this.getView().getModel();
            var DataNew = oModelPars.getData();
            var Data = oModelData.getProperty("/filter");
            DataNew.stats = [];
            oModelPars.setData(DataNew);
            for (var i = 0; i < Data.stats.length; i++) {
                var filter = DataNew.filter.split(" ");
                var objEmph =  {
                    DATE: Data.stats[i].DATE,
                    note: Data.stats[i].note
                };
                var string = (Data.stats[i].ID + Data.stats[i].DATE + Data.stats[i].note.replace(/<\/?[^>]+(>|$)/g, "")).toLowerCase();
                if (this.multiwords(string, filter, objEmph) || (DataNew.filter.length < 3 && !force)) {
                    DataNew.stats.push({
                        DATE: objEmph.DATE,
                        note: objEmph.note,
                        DateChart: Data.stats[i].DATE.substr(5, 2) + "/" + Data.stats[i].DATE.substr(8, 2) + "/" + Data.stats[i].DATE.substr(0, 4),
                        val: Data.stats[i].val
                    });
                }
            }
            oModelPars.setData(DataNew);
            var oVizFrame = this.getView().byId("idChart");
            oVizFrame.setModel(oModelPars);
        },
        multiwords: function (string, filter, emph) {
            var found = true;
            for (var i = 0; i < filter.length; i++) {
                var lowFilter = filter[i].toLowerCase();
                emph.note = emph.note.replace(filter[i],"<strong><span style='background-color: yellow;'>"+filter[i]+"</span></strong>");
                if (string.indexOf(lowFilter) == -1) {
                    found = false;
                }
            }
            return found;
        },
        onFilter: function (From, To) {
            var oTab = this.byId("idStaffing");
            oTab.setBusy(true);
            var oRestModel = this.getView().getModel();
            var oModel = this.getOwnerComponent().getModel("global");
            var more = "/?fn=get-bethel-stat";
            jQuery.sap.require("jquery.sap.storage");
            var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
            var mUser = oStorage.get("myUser");
            var mToken = oStorage.get("myToken");
            let http = new XMLHttpRequest();
            let url = 'https://sacconazzo.altervista.org/api/?fn=get-bethel-stat';
            let params = 'usr=' + mUser + '&token=' + mToken + '' + '&from=' + From + '&to=' + To;
            var that = this;
            http.open('POST', url, true);
            http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            http.onreadystatechange = function () {
                if (http.readyState == 4) {
                    if (http.status == 200) {
                        oModel.setProperty("/filter");
                        oModel.setProperty("/filter", JSON.parse(http.responseText));
                        that.filter();
                        oTab.setBusy(false);
                    } else {
                        oTab.setBusy(false);
                        oModel.setProperty("/filter");
                        that.filter();
                    }
                }
            };
            http.send(params);
        },
        handleChange: function (oEvent) {
            var sFrom = oEvent.getParameter("from");
            var sTo = oEvent.getParameter("to");
            var bValid = oEvent.getParameter("valid");
            var oEventSource = oEvent.getSource();
            if (bValid) {
                this.onFilter(this.oFormatDate.format(sFrom), this.oFormatDate.format(sTo));
            }
        }
    });
});