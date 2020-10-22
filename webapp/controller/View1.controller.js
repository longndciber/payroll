sap.ui.define([
	"sap/base/Log",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/table/RowAction",
	"sap/ui/table/RowActionItem",
	"sap/ui/table/RowSettings",
	"sap/m/MessageToast"
], function (Log, Controller, JSONModel, RowAction, RowActionItem, RowSettings, MessageToast) {
	"use strict";
	var selectedItem;
	return Controller.extend("com.ciber.sf.sfpayroll.controller.View1", {
		onInit: function () {

			// var oJSONModel = this.initSampleDataModel();
			// this.getView().setModel(oJSONModel);
			this._callOdataSF();
			// var fnPress = this.handleActionPress.bind(this);
		},

		initSampleDataModel: function () {
			var oModel = new JSONModel();
			var oData = {
				"ProductCollection": [{
					"ProductId": "HT-1000",
					"Category": "Laptops",
					"MainCategory": "Computer Systems",
					"TaxTarifCode": "1",
					"SupplierName": "Very Best Screens",
					"WeightMeasure": 4.2,
					"WeightUnit": "KG",
					"Description": "Notebook Basic 15 with 2,80 GHz quad core, 15\" LCD, 4 GB DDR3 RAM, 500 GB Hard Disc, Windows 8 Pro",
					"Name": "Notebook Basic 15",
					"DateOfSale": "2017-03-26",
					"ProductPicUrl": "https://openui5.hana.ondemand.com/test-resources/sap/ui/documentation/sdk/images/HT-1000.jpg",
					"Status": "Available",
					"Quantity": 10,
					"UoM": "PC",
					"CurrencyCode": "EUR",
					"Price": 956,
					"Width": 30,
					"Depth": 18,
					"Height": 3,
					"DimUnit": "cm"
				}, {
					"ProductId": "HT-1257",
					"Category": "Smartphones and Tablets",
					"MainCategory": "Smartphones & Tablets",
					"TaxTarifCode": "1",
					"SupplierName": "Ultrasonic United",
					"WeightMeasure": 2.8,
					"WeightUnit": "KG",
					"Description": "10.5-inch Multitouch HD Screen (1280 x 800), 16GB Internal Memory, Wireless N Wi-Fi; Bluetooth, GPS Enabled, 1GHz Dual-Core Processor",
					"Name": "Cepat Tablet 10.5",
					"ProductPicUrl": "https://openui5.hana.ondemand.com/test-resources/sap/ui/documentation/sdk/images/HT-1257.jpg",
					"Status": "Available",
					"Quantity": 17,
					"UoM": "PC",
					"CurrencyCode": "EUR",
					"Price": 549,
					"Width": 48,
					"Depth": 31,
					"Height": 4.5,
					"DimUnit": "cm"
				}, {
					"ProductId": "HT-1258",
					"Category": "Smartphones and Tablets",
					"MainCategory": "Smartphones & Tablets",
					"TaxTarifCode": "1",
					"SupplierName": "Ultrasonic United",
					"WeightMeasure": 2.5,
					"WeightUnit": "KG",
					"Description": "8-inch Multitouch HD Screen (2000 x 1500) 32GB Internal Memory, Wireless N Wi-Fi, Bluetooth, GPS Enabled, 1.5 GHz Quad-Core Processor",
					"Name": "Cepat Tablet 8",
					"ProductPicUrl": "https://openui5.hana.ondemand.com/test-resources/sap/ui/documentation/sdk/images/HT-1258.jpg",
					"Status": "Available",
					"Quantity": 24,
					"UoM": "PC",
					"CurrencyCode": "EUR",
					"Price": 529,
					"Width": 38,
					"Depth": 21,
					"Height": 3.5,
					"DimUnit": "cm"
				}],
				"ProductCollectionStats": {
					"Counts": {
						"Total": 123,
						"Weight": {
							"Ok": 53,
							"Heavy": 51,
							"Overweight": 19
						}
					},
					"Groups": {
						"Category": {
							"Accessories": 34,
							"Desktop Computers": 7,
							"Flat Screens": 2,
							"Keyboards": 4,
							"Laptops": 11,
							"Printers": 9,
							"Smartphones and Tablets": 9,
							"Mice": 7,
							"Computer System Accessories": 8,
							"Graphics Card": 4,
							"Scanners": 4,
							"Speakers": 3,
							"Software": 8,
							"Telekommunikation": 3,
							"Servers": 3,
							"Flat Screen TVs": 3
						},
						"SupplierName": {
							"Titanium": 21,
							"Technocom": 22,
							"Red Point Stores": 7,
							"Very Best Screens": 14,
							"Smartcards": 2,
							"Alpha Printers": 5,
							"Printer for All": 8,
							"Oxynum": 8,
							"Fasttech": 15,
							"Ultrasonic United": 15,
							"Speaker Experts": 3,
							"Brainsoft": 3
						}
					},
					"Filters": [{
						"type": "Category",
						"values": [{
							"text": "Accessories",
							"data": 34
						}, {
							"text": "Desktop Computers",
							"data": 7
						}, {
							"text": "Flat Screens",
							"data": 2
						}, {
							"text": "Keyboards",
							"data": 4
						}, {
							"text": "Laptops",
							"data": 11
						}, {
							"text": "Printers",
							"data": 9
						}, {
							"text": "Smartphones and Tablets",
							"data": 9
						}, {
							"text": "Mice",
							"data": 7
						}, {
							"text": "Computer System Accessories",
							"data": 8
						}, {
							"text": "Graphics Card",
							"data": 4
						}, {
							"text": "Scanners",
							"data": 4
						}, {
							"text": "Speakers",
							"data": 3
						}, {
							"text": "Software",
							"data": 8
						}, {
							"text": "Telekommunikation",
							"data": 3
						}, {
							"text": "Servers",
							"data": 3
						}, {
							"text": "Flat Screen TVs",
							"data": 3
						}]
					}, {
						"type": "SupplierName",
						"values": [{
							"text": "Titanium",
							"data": 21
						}, {
							"text": "Technocom",
							"data": 22
						}, {
							"text": "Red Point Stores",
							"data": 7
						}, {
							"text": "Very Best Screens",
							"data": 14
						}, {
							"text": "Smartcards",
							"data": 2
						}, {
							"text": "Alpha Printers",
							"data": 5
						}, {
							"text": "Printer for All",
							"data": 8
						}, {
							"text": "Oxynum",
							"data": 8
						}, {
							"text": "Fasttech",
							"data": 15
						}, {
							"text": "Ultrasonic United",
							"data": 15
						}, {
							"text": "Speaker Experts",
							"data": 3
						}, {
							"text": "Brainsoft",
							"data": 3
						}]
					}]
				}
			};
			for (var i = 0; i < oData.ProductCollection.length; i++) {
				var oProduct = oData.ProductCollection[i];
				oProduct.Available = oProduct.Status == "Available" ? true : false;
				if (i === 1) {
					oProduct.NavigatedState = true;
				}
			}
			oModel.setData(oData);
			return oModel;
		},

		_callOdataSF: function (query) {
			this.oModel = this.getView().getModel("SFResources");
			var that = this;
			var mParameter = {
				"urlParameters": {
					"$format": "json",
					"$select": "userId,personIdExternal,endDate,personNav/personalInfoNav/lastName," +
						"personNav/personalInfoNav/firstName,jobInfoNav/division,jobInfoNav/department,jobInfoNav/company," +
						"jobInfoNav/startDate,jobInfoNav/endDate"
				},
				"success": function (oData, Response) {
					console.log("ok");
					console.log(Response);

					// return true;
				},
				"error": function () {
					// console.log("hello");
				}

			};
			this.oModel.read("/EmpEmployment", mParameter);
			this.getView().setModel(this.oModel);
		},

		handleMasterPress: function (oEvent) {
			var oColumnListItem = oEvent.getSource();
			selectedItem = oEvent.getSource().getBindingContext().getObject();
		
			var dateStr;
			console.log(selectedItem.endDate);
			if (selectedItem.endDate != null) {
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd/MM/yyyy"
				});
				dateStr = dateFormat.format(new Date(selectedItem.endDate));
					console.log(dateStr);
			}
		
			this.getView().byId("dateTimeField").setValue(dateStr);
			// this.getView().byId("tfProductId").setValue(selectedItem.ProductId);
		}

	});
});