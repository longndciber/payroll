sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("com.ciber.sf.sfpayroll.controller.IncreasingInsuranceView", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.ciber.sf.sfpayroll.view.IncreasingInsuranceView
		 */
		onInit: function () {

			this._callOdataSF();

		},

		_callOdataSF: function (query) {
			this.oModel = this.getView().getModel("SFResources");
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

		onFilterSelect: function (oEvent) {
				var sKey = oEvent.getParameter("key");
				switch (sKey) {
				case "end-term":
					console.log(sKey);
					break;
				case "increase":
					console.log(sKey);
					break;
				case "decrease":
					console.log(sKey);
					break;
				case "opening-term":
					console.log(sKey);
					break;
				case "wage":
					console.log(sKey);
					break;
				default:
				}
			}
			/**
			 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
			 * (NOT before the first rendering! onInit() is used for that one!).
			 * @memberOf com.ciber.sf.sfpayroll.view.IncreasingInsuranceView
			 */
			//	onBeforeRendering: function() {
			//
			//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.ciber.sf.sfpayroll.view.IncreasingInsuranceView
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.ciber.sf.sfpayroll.view.IncreasingInsuranceView
		 */
		//	onExit: function() {
		//
		//	}

	});

});