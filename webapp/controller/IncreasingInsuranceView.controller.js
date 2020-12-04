/* global XLSX:true */
/* global saveAs:true */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/ui/core/util/Export',
	'sap/ui/core/util/ExportTypeCSV',
	'sap/ui/model/json/JSONModel',
	'sap/m/MessageBox',
	'sap/ui/core/format/DateFormat',
	"sap/ui/core/Fragment",
	"sap/ui/core/syncStyleClass",
	"sap/ui/unified/library",
	'sap/ui/export/Spreadsheet'
], function (Controller, Export, ExportTypeCSV, JSONModel, MessageBox, DateFormat, Fragment, syncStyleClass, unifiedLibrary, Spreadsheet) {
	"use strict";
	const standardWorkday = 21;
	//fixedContractTypeId
	const fixedContractTypeId = '25573';
	//permanentContractTypeId
	const permanentContractTypeId = '25574';
	//AnnexContractTypeId
	const AnnexContractTypeId = '41103';
	const contractTypeCondition = [fixedContractTypeId, permanentContractTypeId, AnnexContractTypeId];
	var dynamicColumnList = [];
	
	const dt = DateFormat.getDateTimeInstance({
		pattern: "dd/MM/yyyy"
	});
	var selectedTab = ' ';

	return Controller.extend("com.ciber.sf.sfpayroll.controller.IncreasingInsuranceView", {
		onInit: function () {

			this.excelDataModel = new JSONModel();
			this.oInsuranceData = new JSONModel();
			this.oIncreasingInsurance = new JSONModel();
			this.oDecreasingInsurance = new JSONModel();
			this.oWageInsurance = new JSONModel();
			this.oCompanyList = new JSONModel();
			this.oEmployeeList = new JSONModel();
			this.oInsuranceWage = new JSONModel();
			this.oEndTerm = new JSONModel();
			this.oOpenTerm = new JSONModel();

			this.oFomular = new JSONModel();

			this.columns = [];
			this.sourceData = "EmpEmployment";
			this.companyKey = "";
			this.term = {};

			this.getView().byId("dtpYear").setDateValue(new Date());

			this.getView().setModel(this.oInsuranceData, "EmpEmployment");
			this.getView().setModel(this.oCompanyList, "CompanyList");
			this.getView().setModel(this.oEmployeeList, "EmployeeList");
			this.getView().setModel(this.oDecreasingInsurance, "DecreasingInsurance");
			this.getView().setModel(this.oIncreasingInsurance, "IncreasingInsurance");
			this.getView().setModel(this.oInsuranceWage, "InsuranceWage");
			this.getView().setModel(this.oEndTerm, "EndTerm");

			this.getView().setModel(this.oFomular, "Fomular");
		},

		onBeforeRendering: function () {
			this._loadCompanyList();
		},

		onFilter: function (oEvent) {
			var date = this._getTerm();
			var companyId = this.getView().byId("cbCompany").getSelectedItem().getKey();
			var oTable = this.getView().byId("tbEndTerm");
			dynamicColumnList.forEach(column => oTable.removeColumn(column));
			dynamicColumnList.length = 0;
			this.companyKey = companyId;
			this.term = date;
			//this._callOdataSF(date.fromDate, date.toDate);

			this._getFomular();

			this._callOdataFromCustObj(date.fromDate, date.toDate);
		},

		onExport: function (oEvent) {
			var oExport = new Export({
				exportType: new ExportTypeCSV({
					separatorChar: ","
				}),
				models: this.getView().getModel(this.sourceData),
				rows: {
					path: "/list"
				},
				columns: this.columns,
			});
			oExport.saveFile().catch(function (oError) {
				MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
			}).then(function () {
				oExport.destroy();
			});
		},

		onLockOrUnlock: function (oEvent) {
			this.oModel = this.getView().getModel("SFResources");
			var date = this._getTerm();
			var batchChanges = [];

			var batchModel = new sap.ui.model.odata.ODataModel(this.oModel.sServiceUrl);
			var oDataIncreasingIns = this.getView().getModel("IncreasingInsurance");
			var oDataDecreasingIns = this.getView().getModel("DecreasingInsurance");
			var oDatagInsWage = this.getView().getModel("InsuranceWage");
			var oData = this.getView().getModel("EndTerm");
			var data = oData.oData.list;
			var method = "POST";
			if (data.some((element) => element.cust_status === "1")) {
				method = "DELETE";
			}
			//this._uploadDataToCustObj("increase", "1",method, oDataIncreasingIns.oData.list, batchModel, batchChanges);
			//this._uploadDataToCustObj("decrease", "1",method, oDataDecreasingIns.oData.list, batchModel, batchChanges);
			//this._uploadDataToCustObj("wage", "1",method, oDatagInsWage.oData.list, batchModel, batchChanges);
			console.log(method);
			this._uploadEndTermToCustObj("1", method, batchModel, batchChanges);
			var that = this;
			batchModel.addBatchChangeOperations(batchChanges);
			batchModel.setUseBatch(true);
			batchModel.submitBatch(
				function (dataResponse, context, error) {
					console.log(error);
					var message = "Kỳ lương " + that.term.term + " đã được khóa";
					if (error.length > 0) {
						for (let index = 0; index < error.length; index++) {
							const response = error[index];
							if (response.response.statusCode != 200) {
								message = response.response.statusCode + response.message + response.response.body;
								MessageBox.show(
									message, {
										icon: MessageBox.Icon.ERROR,
										title: "ERROR",
										actions: [MessageBox.Action.OK],
										onClose: function (oAction) {}
									}
								);
								return;
							}
						}
					}

					MessageBox.show(
						message, {
							icon: MessageBox.Icon.SUCCESS,
							title: "Khóa kỳ lương",
							actions: [MessageBox.Action.OK],
							onClose: function (oAction) {
								that.getView().byId("btnLockOrUnlock").setText(method == "POST" ? "Mở khóa" : "Khóa");
								that.getView().byId("btnLockOrUnlock").setIcon(method == "POST" ? "sap-icon://unlocked" : "sap-icon://locked");
							}
						}
					);
				}
			);
		},

		onLock: function (oEvent) {
			this.oModel = this.getView().getModel("SFResources");
			var date = this._getTerm();
			var batchChanges = [];

			var batchModel = new sap.ui.model.odata.ODataModel(this.oModel.sServiceUrl);
			var oDataIncreasingIns = this.getView().getModel("IncreasingInsurance");
			var oDataDecreasingIns = this.getView().getModel("DecreasingInsurance");
			var oDatagInsWage = this.getView().getModel("InsuranceWage");
			var oData = this.getView().getModel("EndTerm");
			var data = oData.oData.list;
			var method = "POST";
			if (data.some((element) => element.cust_status === "1")) {
				method = "PUT";
			}
			//this._uploadDataToCustObj("increase", "2", oDataIncreasingIns.oData.list, method, batchModel, batchChanges);
			//this._uploadDataToCustObj("decrease", "2", oDataDecreasingIns.oData.list, method, batchModel, batchChanges);
			//this._uploadDataToCustObj("wage", "2", oDatagInsWage.oData.list, batchModel, method, batchChanges);
			this._uploadEndTermToCustObj("2", method, batchModel, batchChanges);
			var that = this;
			batchModel.addBatchChangeOperations(batchChanges);
			batchModel.submitBatch(
				function (dataResponse, context, error) {
					console.log(error);
					var message = "Kỳ lương " + that.term.term + " đã được khóa";
					if (error.length > 0) {
						for (let index = 0; index < error.length; index++) {
							const response = error[index];
							console.log(response);
							if (response.response.statusCode != 200) {
								message = response.response.statusCode + response.message + response.response.body;
								MessageBox.show(
									message, {
										icon: MessageBox.Icon.ERROR,
										title: "ERROR",
										actions: [MessageBox.Action.OK],
										onClose: function (oAction) {}
									}
								);
								return;
							}
						}
					}

					MessageBox.show(
						message, {
							icon: MessageBox.Icon.SUCCESS,
							title: "Khóa kỳ lương",
							actions: [MessageBox.Action.OK],
							onClose: function (oAction) {
								that.getView().byId("btnLock").setEnabled(false);
								that.getView().byId("btnLockOrUnlock").setEnabled(false);
							}
						}
					);
				}
			);
		},

		_uploadDataToCustObj: function (type, status, data, method, batchModel, batchChanges) {
			if (data.length > 0) {
				const dt = DateFormat.getDateTimeInstance({
					pattern: "yyyy-MM-ddTHH:mm:ss"
				});
				const effectiveDate = dt.format(this.term.fromDate);
				for (var i = 0; i < data.length; i++) {
					var employee = {
						"cust_userID": data[i].userId,
						"externalName": data[i].name,
						"effectiveStartDate": this.term.fromDate,
						"cust_term": this.term.term,
						"cust_status": status,
						"cust_type": type,
						"cust_name": "123",
						"cust_positionTitle": data[i].jobTitle,
						"cust_department": data[i].department,
						"cust_contractType": data[i].contractType,
						"cust_email": data[i].email,
						"cust_gioitinh": data[i].gender,
						"cust_ngaysinh": data[i].dob,
						"cust_dantoc": data[i].nation,
						"cust_quoctich": data[i].nationality,
						"cust_cmnd": data[i].nationalId,
						// "cust_sodienthoai": data[i].phone,
						"cust_hogiadinh": data[i].familyId,
						"cust_tinh_thuongtru": data[i].permanentAddr.province,
						"cust_quan_thuongtru": data[i].permanentAddr.county,
						"cust_xa_thuongtru": data[i].permanentAddr.state,
						"cust_tinh_tamtru": data[i].lodgingAddr.province,
						"cust_quan_tamtru": data[i].lodgingAddr.county,
						"cust_xa_tamtru": data[i].lodgingAddr.state,
						"cust_capbac": data[i].jobLevel,
						"cust_chucdanh": data[i].jobTitle,
						"cust_noilamviec": data[i].location,
						"cust_soHDLD": data[i].laborContractId,
						"cust_ngayky": data[i].signingDate,
						"cust_loaiHD": data[i].contractType,
						"cust_ngaybatdauHD": data[i].startDate,
						"cust_ngayketthucHD": data[i].contractEndDate,
						"cust_mucluong": data[i].paycompvalue,
						"cust_thoidiemdong": data[i].timeToPay,
						"cust_soquyetdinhNV": data[i].endContractNum,
						"cust_ngaynghiviec": data[i].lastDay,
						"cust_mucluongcu": data[i].oldPaycompvalue,
						"cust_mucluongmoi": data[i].newpaycompvalue,
						"cust_thangbaogiam": data[i].timeToPay,
						"cust_ngaydieuchinh": data[i].modifiedDate != undefined && data[i].modifiedDate != null ? data[i].modifiedDate : null,
					};
					if (method == "POST") {
						batchChanges.push(batchModel.createBatchOperation("/cust_InsuranceTable", "POST", employee));
					} else if (method == "DELETE") {
						batchChanges.push(batchModel.createBatchOperation(
							"/cust_InsuranceTable(effectiveStartDate=datetime'" + effectiveDate + "',externalCode=" + data[i].externalCode + "L)", method
						));
					} else {
						batchChanges.push(batchModel.createBatchOperation(
							"/cust_InsuranceTable(effectiveStartDate=datetime'" + effectiveDate + "',externalCode=" + data[i].externalCode + "L)", method,
							employee
						));
					}
				}
			}
		},

		_uploadEndTermToCustObj: function (status, method, batchModel, batchChanges) {
			var oData = this.getView().getModel("EndTerm");
			var data = oData.oData.list;

			if (data.length > 0) {
				const dt = DateFormat.getDateTimeInstance({
					pattern: "yyyy-MM-ddTHH:mm:ss"
				});
				const effectiveDate = dt.format(this.term.fromDate);
				for (var i = 0; i < data.length; i++) {
					var employee = {
						"cust_userID": data[i].userId,
						"externalName": data[i].name,
						"effectiveStartDate": effectiveDate,
						"cust_term": this.term.term,
						"cust_status": status,
						"cust_type": "end-term",
						"cust_name": data[i].name,
						"cust_positionTitle": data[i].jobTitle,
						"cust_department": data[i].department,
						"cust_lineKD": data[i].businessUnit,
						"cust_contractType": data[i].contractType,
						"cust_email": data[i].email,
						"cust_luongbhxh": data[i].socialInsWage,
						"cust_luongbhyt": data[i].healthInsWage,
						"cust_luongbhtn": data[i].unemploymentInsWage,
						"cust_luongbhtnld": data[i].accidentInsWage,
						"cust_bhxhnld": data[i].socialInsEmp,
						"cust_bhytnld": data[i].healthInsEmp,
						"cust_bhtnnld": data[i].unemploymentInsEmp,
						"cust_bhkimportNV": data[i].insurranceOtherEmp,
						"cust_tongbhnld": data[i].totalEmp,
						"cust_bhxhcty": data[i].socialInsCom,
						"cust_bhyt_cty": data[i].healthInsCom,
						"cust_bhtncty": data[i].unemploymentInsCom,
						"cust_bhtnldcty": data[i].accidentInsCom,
						"cust_bhimportcty": data[i].insurranceOtherCom,
						"cust_tongbhcty": data[i].totalCom,
					};
					// for (const key in data[i]) {
					// 	if (data[i].hasOwnProperty(key)) {
					// 		const element = data[i][key];
					// 		employee[key] = element
					// 	}
					// }
					// // console.log(employee);
					if (method == "POST") {
						batchChanges.push(batchModel.createBatchOperation("/cust_InsuranceTable", "POST", employee));
					} else if (method == "DELETE") {
						batchChanges.push(batchModel.createBatchOperation(
							"/cust_InsuranceTable(effectiveStartDate=datetime'" + effectiveDate + "',externalCode=" + data[i].externalCode + "L)", method
						));
					} else {
						batchChanges.push(batchModel.createBatchOperation(
							"/cust_InsuranceTable(effectiveStartDate=datetime'" + effectiveDate + "',externalCode=" + data[i].externalCode + "L)", method,
							employee
						));
					}
				}
			}
		},

		_getFomular: function () {
			var that = this;
			const dt = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd",
			});
			var mParameter = {
				urlParameters: {
					fromDate: dt.format(this.term.fromDate),
					toDate: dt.format(this.term.toDate),
					"$filter": "cust_legalEntity eq '" + this.companyKey + "'"
				},
				success: function (oData, Response) {
					if (oData.results.length <= 0) {
						return;
					}
					if (oData.results.length <= 0) {
						return;
					}

					var fomularList = that._processFomular(oData.results, that);
					fomularList.sort(function (a, b) {
						if (a.cust_sequence < b.cust_sequence) {
							return -1;
						}
						if (a.cust_sequence > b.cust_sequence) {
							return 1;
						}
						// if (a.cust_columnType < b.cust_columnType) {
						// 	return -1;
						// }
						// if (a.cust_columnType > b.cust_columnType) {
						// 	return 1;
						// }
						return 0;
					});
					console.log(fomularList);
					var oTable = that.getView().byId("tbEndTerm");
					fomularList.forEach(function (item) {
						that._getStaticVar(item, that);
						var column = new sap.ui.table.Column({
							width: "11rem",
							label: new sap.m.Label({
								text: item.columnName,
							}),
							template: new sap.m.Text({
								text: {
									path: 'EndTerm>' + item.columnValue,
									type: 'sap.ui.model.type.Integer',
									formatOptions: {
										minIntegerDigits: 0,
										maxIntegerDigits: 99,
										minFractionDigits: 0,
										maxFractionDigits: 3,
										groupingEnabled: true,
										groupingSeparator: ','
									},
									constraints: {
										maximum: 1000
									}
								}
							})
						});
						dynamicColumnList.push(column);
						oTable.addColumn(column);
					});
					that.oFomular.setData({
						list: fomularList
					});

				},
				error: function () {
					that._onDialogClosed(that);
				},
			};
			this.oModel.read("/cust_InsuranceFormula", mParameter);
		},

		_processFomular: function (apiList, that) {
			var compare = [">=", "=", "<=", "*", "/", "+", "-", "<", ">", "&&", "||"];
			var objectList = [];
			apiList.forEach(function (api) {
				var object = {
					company: api["cust_legalEntity"],
					columnName: api["externalName"],
					columnValue: api["cust_columnValue"],
					cust_sequence: parseInt(api["cust_sequence"]),
					cust_columnType: "No"
				};
				var staticVarObjList = [];
				var dependVarObjList = [];
				if (api["cust_string1"] == null || api["cust_string1"] == undefined) {
					object.cust_columnType = "imp";
					objectList.push(object);
					return;
				}
				if (api["cust_string1"].indexOf(">") >= 0 || api["cust_string1"].indexOf("<") >= 0) {
					var i = 1;
					var conditionList = [];

					var conditionField = "cust_string" + i;
					while (api[conditionField] != null) {
						var condition = {
							fomular: api[conditionField],
							value: api["cust_string" + (i + 1)],
						};
						that._convertFomular(condition.fomular, staticVarObjList, dependVarObjList, object, that);
						that._convertFomular(condition.value, staticVarObjList, dependVarObjList, object, that);
						conditionList.push(condition);
						i += 2;
						conditionField = "cust_string" + i;
					}

					staticVarObjList = that._removeDuplicatedVar(staticVarObjList);
					dependVarObjList = that._removeDuplicatedVar(dependVarObjList);

					object["condition"] = conditionList;
					object["staticVar"] = staticVarObjList;
					object["dynamicVar"] = dependVarObjList;
				} else {
					that._convertFomular(api["cust_string1"], staticVarObjList, dependVarObjList, object, that);
					object["value"] = api["cust_string1"];
					object["staticVar"] = staticVarObjList;
					object["dynamicVar"] = dependVarObjList;
				}
				objectList.push(object);
			});
			return objectList;
		},

		_getStaticVar: function (item, that) {
			const dt = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd"
			});
			if (item.staticVar == null || item.staticVar == undefined) return;
			this.oModel = this.getView().getModel("SFResources");
			item.staticVar.forEach(function (staticVar, index) {
				var filters = [];
				if (staticVar.condition != null && staticVar.condition != undefined) {
					var compare = sap.ui.model.FilterOperator.EQ;
					switch (staticVar.condition.compare) {
					case "=":
						compare = sap.ui.model.FilterOperator.EQ;
						break;
					case ">=":
						compare = sap.ui.model.FilterOperator.GE;
						break;
					case "<=":
						compare = sap.ui.model.FilterOperator.LE;
						break;
					case ">":
						compare = sap.ui.model.FilterOperator.GT;
						break;
					case "<":
						compare = sap.ui.model.FilterOperator.LT;
						break;
					default:
					}
					var filterByUserId = new sap.ui.model.Filter(
						staticVar.condition.field,
						compare,
						staticVar.condition.value
					);
					filters.push(filterByUserId);
				}
				var mParameter = {
					urlParameters: {
						fromDate: dt.format(that.term.fromDate),
						toDate: dt.format(that.term.toDate),
					},
					success: function (oData, Response) {
						if (oData.results.length <= 0) {
							return;
						}
						staticVar.value = oData.results[oData.results.length - 1][staticVar.valueField];
						if (item.condition != null && item.condition != undefined) {
							item.condition.forEach(function (fomular) {
								// fomular.fomular = fomular.fomular.replace(staticVar.replaceString, staticVar.value.toString());
								fomular.fomular = fomular.fomular.split(staticVar.replaceString).join(staticVar.value);
								// fomular.value = fomular.value.replace(staticVar.replaceString, staticVar.value.toString());
								fomular.value = fomular.value.split(staticVar.replaceString).join(staticVar.value);
							});
						}
					},
					error: function () {},
				};
				if (filters.length > 0) {
					mParameter["filters"] = filters;
				}
				console.log(mParameter);
				that.oModel.read("/" + staticVar.table, mParameter);
			}, this);
		},

		_converVariable: function (variable, object) {
			var keyMapping;
			var condition;
			var valueField;
			var table;
			var retainString = variable;
			var conditionObj;
			if (variable.includes("@")) {
				keyMapping = retainString.split("@")[1];
				retainString = retainString.split("@")[0];
			}
			if (variable.includes(".")) {
				valueField = retainString.split(".")[1];
				retainString = retainString.split(".")[0];
			} else {
				object["cust_columnType"] = "Yes";
				valueField = variable;
				return {
					keyMapping: keyMapping,
					replaceString: variable,
					condition: conditionObj,
					valueField: valueField,
					table: table,
					value: 0,
				};
			}
			if (variable.includes("?")) {
				condition = retainString.split("?")[1];
				conditionObj = {
					field: condition.split(/(>=|<=|=|==|>|<)+/)[0],
					compare: condition.split(/(>=|<=|=|==|>|<)+/)[1],
					value: condition.split(/(>=|<=|=|==|>|<)+/)[2],
				};
				retainString = retainString.split("?")[0];
			}
			table = retainString;
			return {
				keyMapping: keyMapping,
				replaceString: variable,
				condition: conditionObj,
				valueField: valueField,
				table: table,
				value: 0,
			};
		},

		_convertFomular: function (fomular, staticVarObjList, dependVarObjList, object, that) {
			var compare = [">=", "=", "<=", "*", "/", "+", "-", "<", ">", "&&", "||"];

			if (fomular.includes(" ")) {
				var variableList = fomular
					.split(" ")
					.filter((item) => !compare.includes(item) && !this._isNumber(item));
			} else {
				var variableList = [fomular];
			}
			var staticVar = variableList.filter(
				(item) => !item.includes("@") && item.includes(".")
			);

			var dependVar = variableList.filter(function (element) {
				return !staticVar.includes(element);
			});

			if (staticVar != null && staticVar != undefined) {
				staticVar.forEach(function (item) {
					var variable = that._converVariable(item, object);
					staticVarObjList.push(variable);
				});
			}

			if (dependVar != null && dependVar != undefined) {
				dependVar.forEach(function (item) {
					var variable = that._converVariable(item, object);
					dependVarObjList.push(variable);
				});
			}
		},

		_removeDuplicatedVar: function (varList) {
			return varList.reduce((acc, current) => {
				const x = acc.find(function (item) {
					if (item.condition != null && item.condition != undefined) {
						if (
							item.table === current.table &&
							item.keyMapping === current.keyMapping &&
							item.valueField === current.valueField &&
							item.condition.field == current.condition.field &&
							item.condition.compare == current.condition.compare &&
							item.condition.value == current.condition.value
						) {
							return item;
						}
					} else if (
						item.table === current.table &&
						item.keyMapping === current.keyMapping &&
						item.valueField === current.valueField
					) {
						return item;
					}
				});
				if (!x) {
					return acc.concat([current]);
				} else {
					return acc;
				}
			}, []);
		},

		_isNumber: function (n) {
			return !isNaN(parseFloat(n)) && !isNaN(n - 0);
		},

		_getTerm: function () {
			var monthStr = this.getView().byId("cbMonth").getSelectedItem().getKey();
			var yearStr = this.getView().byId("dtpYear").getValue();

			if (yearStr === undefined || yearStr == null || yearStr.length <= 0) {
				return;
			}

			var toMonth = parseInt(monthStr);
			var toYear = parseInt(yearStr);

			var frMonth = toMonth - 1,
				frYear = toYear;

			if (toMonth == 1) {
				frMonth = 12;
				frYear = toYear - 1;
			}
			var frDateStr = "16/" + (("0" + frMonth).slice(-2)).toString() + "/" + frYear;
			var toDateStr = "15/" + (("0" + toMonth).slice(-2)).toString() + "/" + toYear;

			// this.getView().byId("lblFromDate").setText(frDateStr);
			// this.getView().byId("lblToDate").setText(toDateStr);

			//Convert datetime string to date object
			const dt = DateFormat.getDateTimeInstance({
				pattern: "dd/MM/yyyy"
			});
			const jsFrDate = dt.parse(frDateStr);
			const jsToDate = dt.parse(toDateStr);
			var date = {
				"fromDate": jsFrDate,
				"toDate": jsToDate,
				"term": monthStr + "/" + yearStr,
			};
			return date;
		},

		_callOdataFromCustObj: function (frDate, toDate) {
			this.oModel = this.getView().getModel("SFResources");
			var filters = [];
			// filters.push(new sap.ui.model.Filter(
			// 	"company",
			// 	sap.ui.model.FilterOperator.EQ,
			// 	this.companyKey
			// ));
			filters.push(new sap.ui.model.Filter(
				"cust_term",
				sap.ui.model.FilterOperator.EQ,
				this.term.term
			));
			filters.push(new sap.ui.model.Filter(
				"cust_status",
				sap.ui.model.FilterOperator.NE,
				'0'
			));

			var that = this;

			this._onOpenDialog(that);
			const dt = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd"
			});
			var mParameter = {
				"filters": filters,
				"urlParameters": {
					"fromDate": dt.format(frDate),
					"toDate": dt.format(toDate)
				},
				"success": function (oData, Response) {
					if (oData.results.length == 0) {
						console.log("DATA SF");
						that._callOdataSF(frDate, toDate);
					} else {
						console.log("CUSTOM");
						that._processDataFromCustObj(oData, Response);
						that._onDialogClosed(that);
					}
					that._onDialogClosed(that);
				},
				"error": function () {
					that._onDialogClosed(that);
				}
			};
			this.oModel.read("/cust_InsuranceTable", mParameter);
		},

		_callOdataSF: function (frDate, toDate) {
			this.oModel = this.getView().getModel("SFResources");
			var that = this;
			this._onOpenDialog(that);
			const dt = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd"
			});
			var mParameter = {
				"urlParameters": {
					//"$format": "json",
					// "$top":"1500",
					// "$skip":"2000",
					//"$limit":"10",
					"$select": "userId,jobTitle,location,customString2,customDate4,contractType,customDate3,customString13,startDate,contractEndDate,endDate," +
						"employmentNav/personNav/personalInfoNav/lastName,employmentNav/personNav/personalInfoNav/firstName,employmentNav/personNav/personalInfoNav/gender," +
						"employmentNav/personNav/personalInfoNav/localNavVNM/customString1Nav/picklistLabels/label," +
						"employmentNav/personNav/personalInfoNav/localNavVNM/countryNav/territoryName,employmentNav/personNav/dateOfBirth,employmentNav/personNav/nationalIdNav/nationalId,employmentNav/personNav/nationalIdNav/cardType," +
						"employmentNav/personNav/phoneNav/phoneNumber,employmentNav/personNav/phoneNav/phoneTypeNav/externalCode," +
						"employmentNav/personNav/emailNav/emailAddress,employmentNav/personNav/emailNav/emailTypeNav/externalCode," +
						"employmentNav/personNav/homeAddressNavDEFLT/addressType,employmentNav/personNav/homeAddressNavDEFLT/countyNav/picklistLabels/label,employmentNav/personNav/homeAddressNavDEFLT/stateNav/picklistLabels/label,employmentNav/personNav/homeAddressNavDEFLT/provinceNav/picklistLabels/label," +
						"employmentNav/empWorkPermitNav/documentNumber,employmentNav/empWorkPermitNav/documentType,employmentNav/empWorkPermitNav/documentTypeNav/externalCode," +
						"employmentNav/compInfoNav/empPayCompRecurringNav/paycompvalue,employmentNav/compInfoNav/empPayCompRecurringNav/payComponent,emplStatusNav/externalCode," +
						"contractTypeNav/picklistLabels/label,contractTypeNav/picklistLabels/locale,contractTypeNav/id," +
						"customString6Nav/id," +
						"departmentNav/name_defaultValue,divisionNav/name_defaultValue,businessUnitNav/name_defaultValue," +
						"positionNav/externalName_localized,positionNav/jobLevelNav/label_defaultValue,",
					"$expand": "employmentNav,employmentNav/personNav,employmentNav/personNav/personalInfoNav,employmentNav/personNav/nationalIdNav," +
						"employmentNav/personNav/personalInfoNav/localNavVNM/countryNav,employmentNav/personNav/personalInfoNav/localNavVNM/customString1Nav/picklistLabels," +
						"employmentNav/personNav/phoneNav,employmentNav/personNav/phoneNav/phoneTypeNav," +
						"employmentNav/personNav/emailNav,employmentNav/personNav/emailNav/emailTypeNav," +
						"employmentNav/personNav/homeAddressNavDEFLT,employmentNav/personNav/homeAddressNavDEFLT/countyNav/picklistLabels,employmentNav/personNav/homeAddressNavDEFLT/stateNav/picklistLabels,employmentNav/personNav/homeAddressNavDEFLT/provinceNav/picklistLabels," +
						"positionNav,positionNav/jobLevelNav," +
						"employmentNav/compInfoNav,employmentNav/compInfoNav/empPayCompRecurringNav,emplStatusNav," +
						"customString6Nav,departmentNav,divisionNav,businessUnitNav," +
						"contractTypeNav,contractTypeNav/picklistLabels," +
						"employmentNav/empWorkPermitNav,employmentNav/empWorkPermitNav/documentTypeNav"
				},
				"success": function (oData, Response) {
					var mParameter = {
						"async": false,
						"urlParameters": {
							"fromDate": dt.format(frDate),
							"toDate": dt.format(toDate)
						},
						"success": function (oDataBasicSalary, ResponseBasicSalary) {
							const effectiveBasicSalary = oDataBasicSalary.results.reduce(function (prev, current) {
								return (prev.effectiveStartDate > current.effectiveStartDate) ? prev : current
							})
							that._processData(oData, Response, effectiveBasicSalary.cust_Amount);
							that._onDialogClosed(that);
							that.getView().byId("FileUploaderId").setEnabled(true);
						},
						"error": function () {}
					};
					that.oModel.read("/cust_govermentRate", mParameter);

				},
				"error": function () {
					that._onDialogClosed(that);
				}
			};
			if (this.companyKey != undefined && this.companyKey != "") {
				mParameter.urlParameters["$filter"] = "company eq '" + this.companyKey + "'";
			}
			if (frDate != undefined || toDate != undefined) {
				mParameter.urlParameters["fromDate"] = dt.format(frDate);
				mParameter.urlParameters["toDate"] = dt.format(toDate);
			}

			this.oModel.read("/EmpJob", mParameter);
		},

		_loadCompanyList: function (frDate, toDate) {
			this.oModel = this.getView().getModel("SFResources");
			var that = this;
			var mParameter = {
				"success": function (oData, Response) {
					var companyList = [{
						id: "",
						name: "All",
					}];
					oData.results.forEach(function (item, index) {
						var company = {
							id: item.externalCode,
							name: item.name,
						}
						companyList.push(company);
					}, this);

					that.oCompanyList.setData({
						list: companyList
					});
					that.oCompanyList.refresh(true);
				},
				"error": function (oError) {
					console.log(oError);
				}
			};
			this.oModel.read("/FOCompany", mParameter);
		},

		_processDataFromCustObj: function (oData, Response) {
			var that = this;
			var tempIncreasingInsuarranceList = [];
			var tempDecreasingInsuarranceList = [];
			var tempInsuranceWageList = [];
			var endTermList = [];
			that.getView().byId("btnLock").setEnabled(oData.results.some((element) => element.cust_status != "2"));
			that.getView().byId("btnLockOrUnlock").setEnabled(oData.results.some((element) => element.cust_status != "2"));
			that.getView().byId("btnLockOrUnlock").setText(oData.results.some((element) => element.cust_status == "1") ? "Mở khóa" : "Khóa");
			that.getView().byId("btnLockOrUnlock").setIcon(oData.results.some((element) => element.cust_status == "1") ? "sap-icon://unlocked" :
				"sap-icon://locked");
			oData.results.forEach(function (item) {
				switch (item.cust_type) {
				case "increase":
					var emp = {
						externalCode: item.externalCode,
						userId: item.cust_userID,
						name: item.externalName,
						gender: item.cust_gioitinh,
						dob: item.cust_ngaysinh,
						nation: item.cust_dantoc,
						nationality: item.cust_quoctich,
						email: item.cust_email,
						nationalId: item.cust_cmnd,
						phone: item.cust_sodienthoai,
						email: item.email,
						familyId: item.cust_hogiadinh,
						permanentAddr: {
							county: item.cust_quan_thuongtru,
							state: item.cust_xa_thuongtru,
							province: item.cust_tinh_thuongtru,
						},
						lodgingAddr: {
							county: item.cust_quan_tamtru,
							state: item.cust_xa_tamtru,
							province: item.cust_tinh_tamtru,
						},
						jobLevel: item.cust_capbac,
						jobTitle: item.cust_chucdanh,
						location: item.cust_noilamviec,
						laborContractId: item.cust_soHDLD,
						signingDate: item.cust_ngayky,
						contractType: item.cust_loaiHD,
						startDate: item.cust_ngaybatdauHD,
						contractEndDate: item.cust_ngayketthucHD,
						paycompvalue: item.cust_mucluong,
						timeToPay: item.cust_thoidiemdong,
						cust_status: item.cust_status,
					};
					tempIncreasingInsuarranceList.push(emp);
					break;
				case "decrease":
					var emp = {
						externalCode: item.externalCode,
						userId: item.cust_userID,
						name: item.externalName,
						gender: item.cust_gioitinh,
						dob: item.cust_ngaysinh,
						nation: item.cust_dantoc,
						nationality: item.cust_quoctich,
						email: item.cust_email,
						nationalId: item.cust_cmnd,
						phone: item.cust_sodienthoai,
						email: item.email,
						familyId: item.cust_hogiadinh,
						permanentAddr: {
							county: item.cust_quan_thuongtru,
							state: item.cust_xa_thuongtru,
							province: item.cust_tinh_thuongtru,
						},
						lodgingAddr: {
							county: item.cust_quan_tamtru,
							state: item.cust_xa_tamtru,
							province: item.cust_tinh_tamtru,
						},
						jobLevel: item.cust_capbac,
						jobTitle: item.cust_chucdanh,
						location: item.cust_noilamviec,
						laborContractId: item.cust_soHDLD,
						signingDate: item.cust_ngayky,
						contractType: item.cust_loaiHD,
						startDate: item.cust_ngaybatdauHD,
						contractEndDate: item.cust_ngayketthucHD,
						endContractNum: item.cust_soquyetdinhNV,
						lastDay: item.cust_ngaynghiviec,
						timeToPay: item.cust_thangbaogiam,
						cust_status: item.cust_status,
					};
					tempDecreasingInsuarranceList.push(emp);
					break;
				case "wage":
					var emp = {
						externalCode: item.externalCode,
						userId: item.cust_userID,
						name: item.externalName,
						gender: item.cust_gioitinh,
						dob: item.cust_ngaysinh,
						nation: item.cust_dantoc,
						nationality: item.cust_quoctich,
						email: item.cust_email,
						nationalId: item.cust_cmnd,
						phone: item.cust_sodienthoai,
						email: item.email,
						familyId: item.cust_hogiadinh,
						permanentAddr: {
							county: item.cust_quan_thuongtru,
							state: item.cust_xa_thuongtru,
							province: item.cust_tinh_thuongtru,
						},
						lodgingAddr: {
							county: item.cust_quan_tamtru,
							state: item.cust_xa_tamtru,
							province: item.cust_tinh_tamtru,
						},
						jobLevel: item.cust_capbac,
						jobTitle: item.cust_chucdanh,
						location: item.cust_noilamviec,
						laborContractId: item.cust_soHDLD,
						signingDate: item.cust_ngayky,
						contractType: item.cust_loaiHD,
						startDate: item.cust_ngaybatdauHD,
						contractEndDate: item.cust_ngayketthucHD,
						oldPaycompvalue: item.cust_mucluongcu,
						newpaycompvalue: item.cust_mucluongmoi,
						modifiedDate: item.cust_ngaydieuchinh,
						cust_status: item.cust_status,
					};
					tempInsuranceWageList.push(emp);
					break;
				case "end-term":
					var emp = {
						externalCode: item.externalCode,
						userId: item.cust_userID,
						name: item.externalName,
						jobTitle: item.cust_positionTitle,
						department: item.cust_department,
						contractType: item.cust_contractType,
						businessUnit: item.cust_lineKD,
						email: item.cust_email,
						socialInsWage: item.cust_luongbhxh,
						healthInsWage: item.cust_luongbhyt,
						unemploymentInsWage: item.cust_luongbhtn,
						accidentInsWage: item.cust_luongbhtnld,
						insurranceOtherEmp: item.cust_bhkimportNV,
						insurranceOtherCom: item.cust_bhimportcty,
						socialInsEmp: item.cust_bhxhnld,
						healthInsEmp: item.cust_bhytnld,
						unemploymentInsEmp: item.cust_bhtnnld,
						totalEmp: item.cust_tongbhnld,
						socialInsCom: item.cust_bhxhcty,
						healthInsCom: item.externalCode,
						unemploymentInsCom: item.cust_bhtncty,
						accidentInsCom: item.cust_bhtnldcty,
						totalCom: item.cust_tongbhcty,
						cust_status: item.cust_status,
					};
					endTermList.push(emp);
					break;
				default:
					break;
				}
			});
			that.oIncreasingInsurance.setData({
				list: tempIncreasingInsuarranceList
			});
			that.oDecreasingInsurance.setData({
				list: tempDecreasingInsuarranceList
			});
			that.oInsuranceWage.setData({
				list: tempInsuranceWageList
			});
			that.oEndTerm.setData({
				list: endTermList
			});

			that.oIncreasingInsurance.refresh(true);
			that.oDecreasingInsurance.refresh(true);
			that.oInsuranceWage.refresh(true);
			that.oEndTerm.refresh(true);
		},

		_processData: function (oData, Response, basicSalaryAmount) {
			var that = this;
			var empList = [];
			oData.results.forEach(function (item, index) {
				var name = item.employmentNav.personNav.personalInfoNav.results[0].lastName + " " + item.employmentNav.personNav.personalInfoNav
					.results[0].firstName;
				var socialInsId;
				if (item.employmentNav.empWorkPermitNav.results.length > 0) {
					socialInsId = item.employmentNav.empWorkPermitNav.results[0].documentNumber;
				}
				var nationalId;
				item.employmentNav.personNav.nationalIdNav.results.forEach(function (nation, index) {
					if (nation.cardType == "VNID1" && nation.nationalId != null) {
						nationalId = nation.nationalId;
					} else if (nation.cardType == "VNID2") {
						nationalId = nation.nationalId;
					}
				});
				var perState, perCounty, perProvince, lodState, lodCounty, lodProvince;
				item.employmentNav.personNav.homeAddressNavDEFLT.results.forEach(function (address, index) {
					if (address.addressType == "temporary") {
						perState = address.stateNav != null ? address.stateNav.picklistLabels.results[0].label : "";
						perProvince = address.provinceNav != null ? address.provinceNav.picklistLabels.results[0].label : "";
						perCounty = address.countyNav != null ? address.countyNav.picklistLabels.results[0].label : "";
					} else if (address.addressType == "permanent") {
						lodState = address.stateNav != null ? address.stateNav.picklistLabels.results[0].label : "";
						lodCounty = address.countyNav != null ? address.countyNav.picklistLabels.results[0].label : "";
						lodProvince = address.provinceNav != null ? address.provinceNav.picklistLabels.results[0].label : "";
					}
				});
				var paycompvalue;
				var payComponent;
				if (item.employmentNav.compInfoNav.results.length > 0) {
					if (item.employmentNav.compInfoNav.results[0].empPayCompRecurringNav.results.length > 0) {
						paycompvalue = item.employmentNav.compInfoNav.results[0].empPayCompRecurringNav.results[0].payComponent = "1028" ? item.employmentNav
							.compInfoNav.results[0].empPayCompRecurringNav.results[0].paycompvalue : "";
						payComponent = item.employmentNav.compInfoNav.results[0].empPayCompRecurringNav.results[0].payComponent = "1028" ? "1028" :
							"";
					}
				}
				var contractType;
				if (item.contractTypeNav != null) {
					item.contractTypeNav.picklistLabels.results.forEach(function (item, index) {
						if (item.locale == "vi_VN") {
							contractType = item.label;
						}
					});
				}
				var positionTitle;
				var jobLevel;
				if (item.positionNav != null) {
					positionTitle = item.positionNav.externalName_localized != null ? item.positionNav.externalName_localized : "";
					jobLevel = item.positionNav.jobLevelNav != null ? item.positionNav.jobLevelNav.label_defaultValue : "";
				}
				var nation;
				if (item.employmentNav.personNav.personalInfoNav.results[0].localNavVNM != null) {
					if (item.employmentNav.personNav.personalInfoNav.results[0].localNavVNM.customString1Nav != null) {
						nation = item.employmentNav.personNav.personalInfoNav
							.results[0].localNavVNM.customString1Nav.picklistLabels.results[0].label;
					}
				}
				var monthStr = this.getView().byId("cbMonth").getSelectedItem().getKey();
				var yearStr = this.getView().byId("dtpYear").getValue();
				var emp = {
					userId: item.userId,
					date: item.startDate,
					endDate: item.endDate,
					name: name,
					department: item.departmentNav != null ? item.departmentNav.name_defaultValue : "",
					division: item.divisionNav != null ? item.divisionNav.name_defaultValue : "",
					businessUnit: item.businessUnitNav != null ? item.businessUnitNav.name_defaultValue : "",
					socialInsId: socialInsId,
					dob: item.employmentNav.personNav.dateOfBirth,
					gender: item.employmentNav.personNav.personalInfoNav.results[0].gender == "F" ? "X" : "",
					nation: nation,
					nationality: item.employmentNav.personNav.personalInfoNav.results[0].localNavVNM != null ? item.employmentNav.personNav.personalInfoNav
						.results[0].localNavVNM.countryNav.territoryName : "",
					nationalId: nationalId,
					phone: item.employmentNav.personNav.phoneNav.results[0] != null ? item.employmentNav.personNav.phoneNav.results[0].phoneTypeNav
						.externalCode == "B" ? item.employmentNav.personNav.phoneNav.results[0].phoneNumber : "" : "",
					email: item.employmentNav.personNav.emailNav.results[0] != null ? item.employmentNav.personNav.emailNav.results[0].emailTypeNav
						.externalCode == "B" ? item.employmentNav.personNav.emailNav.results[0].emailAddress : "" : "",
					familyId: "",
					//jobLevel: jobLevel + item.jobTitle + positionTitle,
					jobLevel: jobLevel,
					jobTitle: positionTitle,
					location: item.location,
					laborContractId: item.customString2,
					signingDate: item.customDate4,
					contractType: contractType,
					contractTypeId: item.contractTypeNav != null ? item.contractTypeNav.id : null,
					startDate: item.customDate3,
					contractEndDate: item.contractEndDate,
					oldPaycompvalue: "",
					payComponent: payComponent,
					paycompvalue: paycompvalue,
					timeToPay: monthStr + "/" + yearStr,
					workDay: "23",
					emplStatus: item.emplStatusNav.externalCode,
					lastDay: item.emplStatusNav.externalCode == "T" || item.emplStatusNav.externalCode == "P" || item.emplStatusNav.externalCode ==
						"U" ? item.startDate : null,
					endContractNum: item.emplStatusNav.externalCode == "T" ? item.customString13 : "",
					customString6: item.customString6Nav != null ? item.customString6Nav.id : null,
					permanentAddr: {
						county: perCounty,
						state: perState,
						province: perProvince,
					},
					lodgingAddr: {
						county: lodCounty,
						state: lodState,
						province: lodProvince,
					}
				}
				empList.push(emp);
			}, this);

			that.oInsuranceData.setData({
				basicSalaryAmount: basicSalaryAmount,
				list: empList
			});
			that.oInsuranceData.refresh(true);
			that._filterIssuranceData();
		},

		_filterIssuranceData: function () {
			var oDataResources = this.getView().getModel("EmpEmployment");
			var data = oDataResources.oData.list;
			let listUniqueUser = [...new Set(data.map(item => item.userId))];
			var filters = [];
			filters.push(new sap.ui.model.Filter(
				"payComponent",
				sap.ui.model.FilterOperator.EQ,
				'1028'
			));
			listUniqueUser.forEach(item => {
				var filterByUserId = new sap.ui.model.Filter(
					"userId",
					sap.ui.model.FilterOperator.EQ,
					item
				);
				filters.push(filterByUserId);
			});

			this.oModel = this.getView().getModel("SFResources");
			var that = this;
			var mParameter = {
				"filters": filters,
				"urlParameters": {
					"$select": "userId,paycompvalue,payComponent,startDate,endDate"
				},
				"success": function (oData, Response) {
					var term = that._getTerm();
					var tempIncreasingInsuarranceList = [];
					var tempDecreasingInsuarranceList = [];
					var tempInsuranceWageList = [];
					var endTermList = [];
					data.forEach(function (item) {
						const foundedIncreasingItem = tempIncreasingInsuarranceList.find(element => element.userId == item.userId);
						const foundedDecreasingItem = tempDecreasingInsuarranceList.find(element => element.userId == item.userId);
						const foundedWageItem = tempInsuranceWageList.find(element => element.userId == item.userId);
						const foundedEndTermItem = endTermList.find(element => element.userId == item.userId);
						if (foundedIncreasingItem != null || foundedDecreasingItem != null || foundedWageItem != null || foundedEndTermItem !=
							null) {
							return;
						} else {
							var empPayCompValueList = oData.results.filter(function (element) {
								return element.userId == item.userId;
							});
							empPayCompValueList.sort(function (a, b) {
								return new Date(a.startDate) - new Date(b.startDate);
							});

							var filteredItems = data.filter(function (element) {
								return element.userId == item.userId;
							});
							// filteredItems.sort(function (a, b) {
							// 	return new Date(a.date) - new Date(b.date);
							// });

							for (var i = 0; i < filteredItems.length; i++) {
								if (i == filteredItems.length - 1 && contractTypeCondition.includes(filteredItems[i].contractTypeId) && filteredItems[i]
									.emplStatus ==
									"A" && (
										standardWorkday - 14) < parseInt(filteredItems[i].workDay) && filteredItems[i].customString6 == "37371") {
									filteredItems[i].socialInsWage = 0;
									filteredItems[i].healthInsWage = "0";
									filteredItems[i].unemploymentInsWage = "0";
									filteredItems[i].accidentInsWage = "0";
									filteredItems[i]["OTHERS-NLD"] = 0;
									filteredItems[i]["OTHERS-CTY"] = 0;
									var socialIns = that._findLastIndex(empPayCompValueList, 'payComponent', '1028');
									var healthIns = that._findLastIndex(empPayCompValueList, 'payComponent', '1028');
									var unemploymentIns = that._findLastIndex(empPayCompValueList, 'payComponent', '1028');
									var accidentIns = that._findLastIndex(empPayCompValueList, 'payComponent', '1028');

									// console.log(socialIns);
									// console.log(filteredItems[i]);
									if (socialIns != null && socialIns != undefined && socialIns.endDate > that.term.toDate) {
										filteredItems[i].socialInsWage = parseInt(socialIns.paycompvalue);
									}
									//&& filteredItems[i].startDate >= healthIns.startDate && filteredItems[i].startDate <= healthIns.endDate
									if (healthIns != null && healthIns != undefined && socialIns.endDate > that.term.toDate) {
										filteredItems[i].healthInsWage = healthIns.paycompvalue;
									}

									if (unemploymentIns != null && unemploymentIns != undefined && socialIns.endDate > that.term.toDate) {
										filteredItems[i].unemploymentInsWage = unemploymentIns.paycompvalue;
									}

									if (accidentIns != null && accidentIns != undefined && socialIns.endDate > that.term.toDate) {
										filteredItems[i].accidentInsWage = accidentIns.paycompvalue;
									}

									endTermList.push(filteredItems[i]);
								}
							}
							if (empPayCompValueList.length >= 2) {
								for (var j = 1; j < empPayCompValueList.length; j++) {
									if ((empPayCompValueList[j - 1].payComponent == "1028" && empPayCompValueList[j].payComponent == "1028") && (
											empPayCompValueList[j - 1].paycompvalue !=
											empPayCompValueList[j].paycompvalue)) {
										if (empPayCompValueList[j].payComponent == "1028" && empPayCompValueList[j].startDate >= that.term.fromDate &&
											j - 1 == 0) {
											const employee1 = Object.assign({}, filteredItems[0]);
											employee1.newpaycompvalue = empPayCompValueList[j - 1].paycompvalue;
											employee1.oldPaycompvalue = 0;
											employee1.modifiedDate = empPayCompValueList[j - 1].startDate;
											tempInsuranceWageList.push(employee1);
										}
										const employee = Object.assign({}, filteredItems[0]);
										employee.newpaycompvalue = empPayCompValueList[j].paycompvalue;
										employee.oldPaycompvalue = empPayCompValueList[j - 1].paycompvalue;
										employee.modifiedDate = empPayCompValueList[j].startDate;
										tempInsuranceWageList.push(employee);
										if (empPayCompValueList[j].payComponent == "1028" && empPayCompValueList[j].endDate <= that.term.toDate &&
											j ==
											empPayCompValueList.length - 1) {
											const employee1 = Object.assign({}, filteredItems[0]);
											employee1.newpaycompvalue = 0;
											employee1.oldPaycompvalue = empPayCompValueList[j].paycompvalue;
											employee1.modifiedDate = new Date(empPayCompValueList[j].endDate.getTime() + 3600000 * 24);
											tempInsuranceWageList.push(employee1);
										}
									}
								}
							} else if (empPayCompValueList.length > 0) {
								if (empPayCompValueList[0].payComponent == "1028" && empPayCompValueList[0].startDate >= that.term.fromDate) {
									const employee1 = Object.assign({}, filteredItems[0]);
									employee1.newpaycompvalue = empPayCompValueList[0].paycompvalue;
									employee1.oldPaycompvalue = 0;
									employee1.modifiedDate = empPayCompValueList[0].startDate;
									tempInsuranceWageList.push(employee1);
								}
								if (empPayCompValueList[0].payComponent == "1028" && empPayCompValueList[0].endDate <= that.term.toDate) {
									const employee1 = Object.assign({}, filteredItems[0]);
									employee1.newpaycompvalue = 0;
									employee1.oldPaycompvalue = empPayCompValueList[0].paycompvalue;
									employee1.modifiedDate = new Date(empPayCompValueList[0].endDate.getTime() + 3600000 * 24);
									tempInsuranceWageList.push(employee1);
								}
							}
							if (filteredItems.length < 2) {
								return;
							}
							for (var i = 1; i < filteredItems.length; i++) {
								// if (filteredItems[i].userId == 'CMC003506') {
								// 	filteredItems[i].workDay = "7";
								// }
								// if (filteredItems[i].userId == 'CMC003507') {
								// 	filteredItems[i].workDay = "19";
								// }
								// if (filteredItems[i].userId == 'CMC003508') {
								// 	filteredItems[i].workDay = "20";
								// }
								// if (filteredItems[i].userId == 'CMC003509') {
								// 	filteredItems[i].workDay = "10";
								// }
								// if (filteredItems[i].userId == 'CMC003511') {
								// 	filteredItems[i].workDay = "7";
								// }
								// if (filteredItems[i].userId == 'CMC003512') {
								// 	filteredItems[i].workDay = "20";
								// }
								// if (filteredItems[i].userId == 'CMC003513') {
								// 	filteredItems[i].workDay = "20";
								// }

								// if (filteredItems[i].userId == 'CMC003514') {
								// 	filteredItems[i].workDay = "20";
								// }
								// if (filteredItems[i].userId == 'CMC003515') {
								// 	filteredItems[i].workDay = "20";
								// }
								// if (filteredItems[i].userId == 'CMC003516') {
								// 	filteredItems[i].workDay = "20";
								// }
								// if (filteredItems[i].userId == 'CMC003517') {
								// 	filteredItems[i].workDay = "20";
								// }
								// if (filteredItems[i].userId == 'CMC003518') {
								// 	filteredItems[i].workDay = "0";
								// }
								// if (filteredItems[i].userId == 'CMC003519') {
								// 	filteredItems[i].workDay = "20";
								// }

								//decrease case
								if (filteredItems[i].userId == 'CMC003520') {
									filteredItems[i].workDay = "5";
								}
								if (filteredItems[i].userId == 'CMC003521') {
									filteredItems[i].workDay = "0";
								}
								if (filteredItems[i].userId == 'CMC003523') {
									filteredItems[i].workDay = "0";
								}
								if (filteredItems[i].userId == 'CMC003524') {
									filteredItems[i].workDay = "4";
								}
								if (filteredItems[i].userId == 'CMC003525') {
									filteredItems[i].workDay = "5";
								}

								if (filteredItems[i].customString6 == "37371" && !(filteredItems[i].date < term.fromDate && filteredItems[i].endDate <
										term.fromDate) && !(filteredItems[i].date > term.toDate && filteredItems[i].endDate > term.toDate)) {
									if (((contractTypeCondition.includes(filteredItems[i].contractTypeId) && !
												contractTypeCondition.includes(filteredItems[i -
														1]
													.contractTypeId)) ||
											((filteredItems[i - 1].emplStatus == "P" || filteredItems[i - 1].emplStatus == "U") && filteredItems[i].emplStatus ==
												"A" &&
												contractTypeCondition.includes(filteredItems[i].contractTypeId))) &&
										(standardWorkday - 14) < parseInt(filteredItems[i].workDay)) {
										filteredItems[i].paycompvalue = "0";
										for (var j = 0; j < empPayCompValueList.length; j++) {
											if (filteredItems[i].startDate >= empPayCompValueList[j].startDate && filteredItems[i].startDate <=
												empPayCompValueList[
													j].endDate &&
												empPayCompValueList[j].payComponent == "1028") {

												filteredItems[i].paycompvalue = empPayCompValueList[j].paycompvalue;
											}
										}
										tempIncreasingInsuarranceList.push(filteredItems[i]);
									}
									if ((filteredItems[i - 1].emplStatus != "P" && filteredItems[i - 1].emplStatus !=
											"U" && filteredItems[i - 1].emplStatus !=
											"T") && (filteredItems[i].emplStatus == "P" || filteredItems[i].emplStatus == "U" || filteredItems[i].emplStatus ==
											"T") && contractTypeCondition.includes(filteredItems[i].contractTypeId) && (standardWorkday - filteredItems[i].workDay) >=
										14) {
										filteredItems[i].paycompvalue = "0";
										for (var j = 0; j < empPayCompValueList.length; j++) {
											if (filteredItems[i].lastDay >= empPayCompValueList[j].startDate && filteredItems[i].lastDay <= empPayCompValueList[j]
												.endDate &&
												empPayCompValueList[j].payComponent == "1028") {
												filteredItems[i].depaycompvalue = empPayCompValueList[j].paycompvalue;
											}
										}
										tempDecreasingInsuarranceList.push(filteredItems[i]);
									}

									// if (empPayCompValueList[0].payComponent == "1028" && empPayCompValueList[0].endDate < that.term.toDate) {
									// 	const employee = Object.assign({}, filteredItems[i]);
									// 	employee.newpaycompvalue = 0;
									// 	employee.oldPaycompvalue = empPayCompValueList[0].paycompvalue;
									// 	employee.modifiedDate = empPayCompValueList[0].endDate;
									// 	tempInsuranceWageList.push(employee);
									// }
									// if (i == filteredItems.length - 1 && contractTypeCondition.includes(filteredItems[i].contractTypeId) && filteredItems[i].emplStatus ==
									// 	"A" && (
									// 		standardWorkday - 14) < parseInt(filteredItems[i].workDay)) {
									// 	filteredItems[i].socialInsWage = 0;
									// 	filteredItems[i].healthInsWage = "0";
									// 	filteredItems[i].unemploymentInsWage = "0";
									// 	filteredItems[i].accidentInsWage = "0";
									// 	filteredItems[i].insurranceOtherEmp = "0";
									// 	filteredItems[i].insurranceOtherCom = "0";
									// 	var socialIns = that._findLastIndex(empPayCompValueList, 'payComponent', '1028');
									// 	var healthIns = that._findLastIndex(empPayCompValueList, 'payComponent', '1028');
									// 	var unemploymentIns = that._findLastIndex(empPayCompValueList, 'payComponent', '1028');
									// 	var accidentIns = that._findLastIndex(empPayCompValueList, 'payComponent', '1028');

									// 	// console.log(socialIns);
									// 	// console.log(filteredItems[i]);
									// 	if (socialIns != null && socialIns != undefined) {
									// 		filteredItems[i].socialInsWage = parseInt(socialIns.paycompvalue);
									// 	}
									// 	//&& filteredItems[i].startDate >= healthIns.startDate && filteredItems[i].startDate <= healthIns.endDate
									// 	if (healthIns != null && healthIns != undefined) {
									// 		filteredItems[i].healthInsWage = healthIns.paycompvalue;
									// 	}

									// 	if (unemploymentIns != null && unemploymentIns != undefined) {
									// 		filteredItems[i].unemploymentInsWage = unemploymentIns.paycompvalue;
									// 	}

									// 	if (accidentIns != null && accidentIns != undefined) {
									// 		filteredItems[i].accidentInsWage = accidentIns.paycompvalue;
									// 	}

									// 	endTermList.push(filteredItems[i]);
									// }
								}
							}
						}
					});
					that.oIncreasingInsurance.setData({
						list: tempIncreasingInsuarranceList
					});
					that.oDecreasingInsurance.setData({
						list: tempDecreasingInsuarranceList
					});
					that.oInsuranceWage.setData({
						list: tempInsuranceWageList
					});
					that.oEndTerm.setData({
						basicSalaryAmount: oDataResources.oData.basicSalaryAmount,
						list: endTermList
					});
					that._processExcel(that);

					that.oIncreasingInsurance.refresh(true);
					that.oDecreasingInsurance.refresh(true);
					that.oInsuranceWage.refresh(true);
					that.oEndTerm.refresh(true);
				},
				"error": function () {}
			};
			var date = this._getTerm();
			if (date.frDate != undefined || date.toDate != undefined) {
				const dt = DateFormat.getDateTimeInstance({
					pattern: "yyyy-MM-dd"
				});
				mParameter.urlParameters["fromDate"] = dt.format(date.fromDate);
				mParameter.urlParameters["toDate"] = dt.format(date.toDate);
			}
			this.oModel.read("/EmpPayCompRecurring", mParameter);
		},

		_import: function (file) {
			var that = this;
			var excelData;
			if (file && window.FileReader) {
				var reader = new FileReader();
				reader.onload = function (e) {
					var data = e.target.result;
					var workbook = XLSX.read(data, {
						type: 'binary'
					});
					workbook.SheetNames.forEach(function (sheetName) {
						// Here is your object for every sheet in workbook
						excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
					});
					console.log(excelData);
					that.excelDataModel.setData({
						excelData
					});

					that._processExcel(that);
				};
				reader.onerror = function (ex) {
					console.log(ex);
				};
				reader.readAsBinaryString(file);
			}
		},

		_processExcel: function (that) {
			// var term = that.getView().byId("cbMonth").getSelectedItem().getKey() + "/" + that.getView().byId("dtpYear").getValue();
			var oData = this.getView().getModel("EndTerm");
			var data = oData.oData.list;
			// console.log(that.excelDataModel.getData());
			//	var excelData = that.excelDataModel.getData();
			const excelData = Object.assign({}, that.excelDataModel.getData());
			if (excelData.excelData != null && excelData.excelData != undefined) {
				var b = excelData.excelData.filter(function (element) {
					return (element.Term == that.term.term && element.Company == that.companyKey);
				});
				excelData.excelData = excelData.excelData.filter(function (element) {
					return (element.Term == that.term.term && element.Company == that.companyKey);
				});
				excelData.excelData.forEach(function (row) {
					var employee = data.find(element => element.userId == row.userId);
					if (employee != null && employee != undefined) {
						employee["OTHERS-NLD"] = row.InsurranceOthersEmployee.toString();
						employee["OTHERS-CTY"] = row.InsurranceOthersCompany.toString();
					}
				});
			}

			that.oEndTerm.setData({
				basicSalaryAmount: oData.oData.basicSalaryAmount,
				list: data
			});
			that.oEndTerm.refresh(true);

			console.log(that.oEndTerm);
			data = this._calculateInsuranceAmountEndTerm(oData.oData.basicSalaryAmount, data);

		},

		onUpload: function (oEvent) {
			this._import(oEvent.getParameter("files") && oEvent.getParameter("files")[0]);
		},

		_calculateInsuranceAmountEndTerm1: function (basicSalary, data) {
			data.forEach(function (item) {
				var socialInsWage = parseInt(item.socialInsWage);
				var healthInsWage = parseInt(item.healthInsWage);
				var unemploymentInsWage = parseInt(item.unemploymentInsWage);
				var accidentInsWage = parseInt(item.accidentInsWage);
				var insurranceOtherEmp = parseInt(item.insurranceOtherEmp);
				var insurranceOtherCom = parseInt(item.insurranceOtherCom);

				item.socialInsEmp = socialInsWage >= basicSalary * 20 ? Math.round(basicSalary * 20 * 0.08) : Math.round(socialInsWage * 0.08);
				item.healthInsEmp = healthInsWage >= basicSalary * 20 ? Math.round(basicSalary * 20 * 0.015) : Math.round(healthInsWage *
					0.015);
				item.unemploymentInsEmp = unemploymentInsWage >= basicSalary * 20 ? Math.round(basicSalary * 20 * 0.01) : Math.round(
					unemploymentInsWage * 0.01);
				item.totalEmp = item.socialInsEmp + item.healthInsEmp + item.unemploymentInsEmp + insurranceOtherEmp;

				item.socialInsCom = socialInsWage >= basicSalary * 20 ? Math.round(basicSalary * 20 * 0.17) : Math.round(socialInsWage * 0.17);
				item.healthInsCom = healthInsWage >= basicSalary * 20 ? Math.round(basicSalary * 20 * 0.03) : Math.round(healthInsWage * 0.03);
				item.unemploymentInsCom = unemploymentInsWage >= basicSalary * 20 ? Math.round(basicSalary * 20 * 0.01) : Math.round(
					unemploymentInsWage * 0.01);
				item.accidentInsCom = accidentInsWage >= basicSalary * 20 ? Math.round(basicSalary * 20 * 0.005) : Math.round(accidentInsWage *
					0.005);
				item.totalCom = item.socialInsCom + item.healthInsCom + item.unemploymentInsCom + item.accidentInsCom + insurranceOtherCom;
			});
			return data;
		},

		_calculateInsuranceAmountEndTerm: function (basicSalary) {
			this.oModel = this.getView().getModel("SFResources");
			var oDataEndTerm = this.getView().getModel("EndTerm");
			let listUniqueUser = [...new Set(oDataEndTerm.oData.list.map(item => item.userId))];
			const dt = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd"
			});
			var filters = [];
			listUniqueUser.forEach(item => {
				var filterByUserId = new sap.ui.model.Filter(
					"userId",
					sap.ui.model.FilterOperator.EQ,
					item
				);
				filters.push(filterByUserId);
			});
			var oDataFomular = this.getView().getModel("Fomular");
			var that = this;
			const data = Object.assign({}, oDataFomular.oData);
			var a = data.list.filter((item) => item.cust_columnType == "No");
			var b = data.list.filter((item) => item.cust_columnType == "Yes");
			a.forEach(function (column, indexColumn) {
				if (column.dynamicVar == null || column.dynamicVar == undefined || column.cust_columnType == "Yes") {
					return;
				}
				column.dynamicVar.forEach(function (dynamicVar, indexVar) {
					if (dynamicVar.table == null || dynamicVar.table == undefined) return;
					if (dynamicVar.condition != null && dynamicVar.condition != undefined) {
						var compare = sap.ui.model.FilterOperator.EQ;
						switch (dynamicVar.condition.compare) {
						case "=":
							compare = sap.ui.model.FilterOperator.EQ;
							break;
						case ">=":
							compare = sap.ui.model.FilterOperator.GE;
							break;
						case "<=":
							compare = sap.ui.model.FilterOperator.LE;
							break;
						case ">":
							compare = sap.ui.model.FilterOperator.GT;
							break;
						case "<":
							compare = sap.ui.model.FilterOperator.LT;
							break;
						default:
						}
						var filterByUserId = new sap.ui.model.Filter(
							dynamicVar.condition.field,
							compare,
							dynamicVar.condition.value
						);
						filters.push(filterByUserId);
					}
					var mParameter = {
						"filters": filters,
						urlParameters: {
							fromDate: dt.format(that.term.fromDate),
							toDate: dt.format(that.term.toDate),
						},
						success: function (oData, Response) {
							oDataEndTerm.oData.list.forEach(function (item, index) {
								var empPayCompValueList = oData.results.filter(function (element) {
									return element.userId == item.userId;
								});

								empPayCompValueList.sort(function (a, b) {
									return new Date(a.startDate) - new Date(b.startDate);
								});
								// var socialIns = that._findLastIndex(empPayCompValueList, 'payComponent', '1028');
								var socialIns = empPayCompValueList[empPayCompValueList.length - 1];
								var insurranceValue = socialIns != null && socialIns != undefined && socialIns.endDate > that.term.toDate ? socialIns.paycompvalue :
									0;

								if (column.condition != null && column.condition != undefined) {
									column.condition.forEach(function (fomular) {
										// var formular = fomular.fomular.replace(dynamicVar.replaceString, insurranceValue);
										var formular = fomular.fomular.split(dynamicVar.replaceString).join(insurranceValue.toString());
										// var value = fomular.value.replace(dynamicVar.replaceString, insurranceValue);
										var value = fomular.value.split(dynamicVar.replaceString).join(insurranceValue.toString());
										console.log(formular);
										console.log(value);
										if (indexVar == column.dynamicVar.length - 1) {
											if (eval(formular)) {
												item[column.columnValue] = eval(value);
												//	return;
											}
										}
									});
								} else {
									column.dynamicVar.forEach(function (dynamicVar1, i) {
										var value = column.value.split(dynamicVar1.replaceString).join(insurranceValue);
										item[column.columnValue] = eval(value);
									});
								}
							});
							if (indexColumn == a.length - 1) {
								b.forEach(function (dependedColumn, indexDependedColumn) {
									oDataEndTerm.oData.list.forEach(function (item, index) {
										if (dependedColumn.dynamicVar[0].table == undefined && dependedColumn.dynamicVar[0].valueField != undefined) {
											var value1;
											dependedColumn.dynamicVar.forEach(function (dynamicVar1, i) {
												if (value1 == undefined || value1 == null) {
													// console.log(value1);
													// console.log(dynamicVar1.replaceString);
													// value1 = awaitItem.value.replace(dynamicVar1.replaceString, item[
													// 	dynamicVar1
													// 	.valueField]);
													if (dependedColumn.condition != null && dependedColumn.condition != undefined) {
														dependedColumn.dynamicVar.forEach(function (dynamicVar2, indexVar2) {
															dependedColumn.condition.forEach(function (fomularCondition) {
																var formular = fomularCondition.fomular.split(dynamicVar2.replaceString).join(item[
																	dynamicVar2
																	.valueField]);
																// var value = fomular.value.replace(dynamicVar.replaceString, insurranceValue);
																var value = fomularCondition.value.split(dynamicVar2.replaceString).join(item[
																	dynamicVar2
																	.valueField]);
																if (indexVar2 == dependedColumn.dynamicVar.length - 1) {
																	if (eval(formular)) {
																		item[dependedColumn.columnValue] = eval(value);
																	}
																}
															});
														});
													} else {
														value1 = dependedColumn.value.split(dynamicVar1.replaceString).join(item[
															dynamicVar1
															.valueField]);
													}
												} else {
													// value1 = value1.replace(dynamicVar1.replaceString, item[dynamicVar1
													// 	.valueField]);

													value1 = value1.split(dynamicVar1.replaceString).join(item[
														dynamicVar1
														.valueField]);
												}
												if (i == dependedColumn.dynamicVar.length - 1 && value1 != undefined) {
													console.log(dependedColumn);
													item[dependedColumn.columnValue] = eval(value1);
												}
												// if (index == oDataEndTerm.oData.list.length - 1) {
												// 	awaitColumnList.push(awaitItem);
												// }
											});
										}
									});
								});
							}
							that.oEndTerm.refresh(true);
						},
						error: function () {},
					};
					that.oModel.read("/" + dynamicVar.table, mParameter);
				});
			});

			// data.forEach(function (item) {
			// 	var socialInsWage = parseInt(item.socialInsWage);
			// 	var healthInsWage = parseInt(item.healthInsWage);
			// 	var unemploymentInsWage = parseInt(item.unemploymentInsWage);
			// 	var accidentInsWage = parseInt(item.accidentInsWage);
			// 	var insurranceOtherEmp = parseInt(item.insurranceOtherEmp);
			// 	var insurranceOtherCom = parseInt(item.insurranceOtherCom);

			// 	item.socialInsEmp = socialInsWage >= basicSalary * 20 ? Math.round(basicSalary * 20 * 0.08) : Math.round(socialInsWage * 0.08);
			// 	item.healthInsEmp = healthInsWage >= basicSalary * 20 ? Math.round(basicSalary * 20 * 0.015) : Math.round(healthInsWage *
			// 		0.015);
			// 	item.unemploymentInsEmp = unemploymentInsWage >= basicSalary * 20 ? Math.round(basicSalary * 20 * 0.01) : Math.round(
			// 		unemploymentInsWage * 0.01);
			// 	item.totalEmp = item.socialInsEmp + item.healthInsEmp + item.unemploymentInsEmp + insurranceOtherEmp;

			// 	item.socialInsCom = socialInsWage >= basicSalary * 20 ? Math.round(basicSalary * 20 * 0.17) : Math.round(socialInsWage * 0.17);
			// 	item.healthInsCom = healthInsWage >= basicSalary * 20 ? Math.round(basicSalary * 20 * 0.03) : Math.round(healthInsWage * 0.03);
			// 	item.unemploymentInsCom = unemploymentInsWage >= basicSalary * 20 ? Math.round(basicSalary * 20 * 0.01) : Math.round(
			// 		unemploymentInsWage * 0.01);
			// 	item.accidentInsCom = accidentInsWage >= basicSalary * 20 ? Math.round(basicSalary * 20 * 0.005) : Math.round(accidentInsWage *
			// 		0.005);
			// 	item.totalCom = item.socialInsCom + item.healthInsCom + item.unemploymentInsCom + item.accidentInsCom + insurranceOtherCom;
			// });
			// return data;
		},

		removeItemOnce: function (arr, value) {
			var index = arr.indexOf(value);
			if (index > -1) {
				arr.splice(index, 1);
			}
			return arr;
		},

		onChangeCompany: function (oEvent) {
			var companyCode = this.getView().byId("cbCompanyByEmployee").getSelectedKey();
			this.oModel = this.getView().getModel("SFResources");
			var that = this;
			this._onOpenDialog(that);
			var mParameter = {
				"urlParameters": {
					"$select": "userId,company,employmentNav/personNav/personalInfoNav/lastName,employmentNav/personNav/personalInfoNav/firstName",
					"$filter": "company eq '" + companyCode + "'",
					"$expand": "employmentNav/personNav/personalInfoNav",
				},
				"success": function (oData, Response) {
					var employeeList = [];
					oData.results.forEach(function (item, index) {
						var employee = {
							id: item.userId,
							name: item.employmentNav.personNav.personalInfoNav.results[0].lastName + " " + item.employmentNav.personNav.personalInfoNav
								.results[0].firstName,
						}
						employeeList.push(employee);
					}, this);

					that.oEmployeeList.setData({
						list: employeeList
					});
					that.oEmployeeList.refresh(true);
					that._onDialogClosed(that);
				},
				"error": function () {
					that._onDialogClosed(that);
				}
			};
			this.oModel.read("/EmpJob", mParameter);
		},

		_findLastIndex: function (array, searchKey, searchValue) {
			var index = array.slice().reverse().findIndex(x => x[searchKey] === searchValue);
			var count = array.length - 1;
			var finalIndex = index >= 0 ? count - index : index;
			if (finalIndex < 0) {
				return;
			}
			return array[finalIndex];
		},

		onSuggest: function (oEvent) {
			var search = this.byId('searchField');
			var binding = search.getBinding("suggestionItems");

			binding.filter(filters);
			binding.attachEventOnce('dataReceived', _ => search.suggest());
		},

		onFilterSelect: function (oEvent) {
			var sKey = oEvent.getParameter("key");
			const dt = DateFormat.getDateTimeInstance({
				pattern: "dd/MM/yyyy"
			});
			switch (sKey) {
			case "open-term":
				selectedTab = "open-term";
				this.sourceData = "EmpEmployment";
				break;
			case "increase":
				selectedTab = "increase";
				this.sourceData = "IncreasingInsurance";
				this.columns = [{
						name: "Mã nhân viên",
						template: {
							content: "{userId}"
						}
					}, {
						name: "Họ và tên",
						template: {
							content: "{name}"
						}
					}, {
						name: "Mã số BHXH",
						template: {
							content: {
								parts: ["socialInsId"],
								formatter: function (value) {
									return value != null ? "	" + value : "";
								},
							}
						}
					}, {
						name: "Ngày sinh",
						template: {
							content: {
								parts: ["dob"],
								formatter: function (value) {
									return "	" + dt.format(value);
								},
							}
						}
					}, {
						name: "Nữ (x)",
						template: {
							content: "{gender}"
						}
					},

					{
						name: "Dân tộc",
						template: {
							content: "{nation}"
						}
					}, {
						name: "Quốc tịch",
						template: {
							content: "{nationality}"
						}
					}, {
						name: "Số CMND/Hộ chiếu/Thẻ căn cước",
						template: {
							content: {
								parts: ["nationalId"],
								formatter: function (value) {
									if (value != undefined || value != null) {
										return "	" + value;
									} else value;
								},
							}
						}
					}, {
						name: "Số điện thoại",
						template: {
							content: {
								parts: ["phone"],
								formatter: function (value) {
									return "	" + value;
								},
							}
						}
					}, {
						name: "Email",
						template: {
							content: "{email}"
						}
					}, {
						name: "Mã hộ gia đình",
						template: {
							content: ""
						}
					}, {
						name: "Tỉnh/TP (thường trú)",
						template: {
							content: "{permanentAddr/province}"
						}
					}, {
						name: "Quận/Huyện (thường trú)",
						template: {
							content: "{permanentAddr/county}"
						}
					}, {
						name: "Xã/phường (thường trú)",
						template: {
							content: "{permanentAddr/state}"
						}
					}, {
						name: "Tỉnh/TP (Tạm trú)",
						template: {
							content: "{lodgingAddr/province}"
						}
					}, {
						name: "Quận/Huyện (Tạm trú)",
						template: {
							content: "{lodgingAddr/county}"
						}
					}, {
						name: "Xã/phường (Tạm trú)",
						template: {
							content: "{lodgingAddr/state}"
						}
					}, {
						name: "Cấp bậc, chức vụ, chức danh nghề",
						template: {
							content: "{jobLevel}"
						}
					}, {
						name: "Nơi làm việc",
						template: {
							content: "{location}"
						}
					}, {
						name: "Số HDLD",
						template: {
							content: "{laborContractId}"
						}
					}, {
						name: "Ngày ký",
						template: {
							content: {
								parts: ["signingDate"],
								formatter: function (value) {
									return "	" + dt.format(value);
								},
							}
						}
					}, {
						name: "Loại hợp đồng",
						template: {
							content: "{contractType}"
						}
					}, {
						name: "Ngày bắt đầu",
						template: {
							content: {
								parts: ["startDate"],
								formatter: function (value) {
									return "	" + dt.format(value);
								},
							}
						}
					}, {
						name: "Ngày kết thúc",
						template: {
							content: {
								parts: ["contractEndDate"],
								formatter: function (value) {
									return "	" + dt.format(value);
								},
							}
						}
					}, {
						name: "Mức lương đóng bảo hiểm",
						template: {
							content: "{paycompvalue}"
						}
					}, {
						name: "Thời điểm đóng",
						template: {
							content: ""
						}
					}
				];
				break;
			case "decrease":
				selectedTab = "decrease";
				this.sourceData = "DecreasingInsurance";
				this.columns = [{
					name: "Mã nhân viên",
					template: {
						content: "{userId}"
					}
				}, {
					name: "Họ và tên",
					template: {
						content: "{name}"
					}
				}, {
					name: "Mã số BHXH",
					template: {
						content: {
							parts: ["socialInsId"],
							formatter: function (value) {
								return value != null ? "	" + value : "";
							},
						}
					}
				}, {
					name: "Ngày sinh",
					template: {
						content: {
							parts: ["dob"],
							formatter: function (value) {
								return "	" + dt.format(value);
							},
						}
					}
				}, {
					name: "Nữ (x)",
					template: {
						content: "{gender}"
					}
				}, {
					name: "Dân tộc",
					template: {
						content: "{nation}"
					}
				}, {
					name: "Quốc tịch",
					template: {
						content: "{nationality}"
					}
				}, {
					name: "Số CMND/Hộ chiếu/Thẻ căn cước",
					template: {
						content: {
							parts: ["nationalId"],
							formatter: function (value) {
								if (value != undefined || value != null) {
									return "	" + value;
								} else value;
							},
						}
					}
				}, {
					name: "Số điện thoại",
					template: {
						content: {
							parts: ["phone"],
							formatter: function (value) {
								return "	" + value;
							},
						}
					}
				}, {
					name: "Email",
					template: {
						content: "{email}"
					}
				}, {
					name: "Mã hộ gia đình",
					template: {
						content: ""
					}
				}, {
					name: "Tỉnh/TP (thường trú)",
					template: {
						content: "{permanentAddr/province}"
					}
				}, {
					name: "Quận/Huyện (thường trú)",
					template: {
						content: "{permanentAddr/county}"
					}
				}, {
					name: "Xã/phường (thường trú)",
					template: {
						content: "{permanentAddr/state}"
					}
				}, {
					name: "Tỉnh/TP (Tạm trú)",
					template: {
						content: "{lodgingAddr/province}"
					}
				}, {
					name: "Quận/Huyện (Tạm trú)",
					template: {
						content: "{lodgingAddr/county}"
					}
				}, {
					name: "Xã/phường (Tạm trú)",
					template: {
						content: "{lodgingAddr/state}"
					}
				}, {
					name: "Cấp bậc, chức vụ, chức danh nghề",
					template: {
						content: "{jobLevel}"
					}
				}, {
					name: "Nơi làm việc",
					template: {
						content: "{location}"
					}
				}, {
					name: "Số HDLD",
					template: {
						content: "{laborContractId}"
					}
				}, {
					name: "Ngày ký",
					template: {
						content: {
							parts: ["signingDate"],
							formatter: function (value) {
								return "	" + dt.format(value);
							},
						}
					}
				}, {
					name: "Loại hợp đồng",
					template: {
						content: "{contractType}"
					}
				}, {
					name: "Ngày bắt đầu",
					template: {
						content: {
							parts: ["startDate"],
							formatter: function (value) {
								return "	" + dt.format(value);
							},
						}
					}
				}, {
					name: "Ngày kết thúc",
					template: {
						content: {
							parts: ["contractEndDate"],
							formatter: function (value) {
								return "	" + dt.format(value);
							},
						}
					}
				}, {
					name: "Mức lương đóng bảo hiểm",
					template: {
						content: "{paycompvalue}"
					}
				}, {
					name: "Số quyết định nghỉ việc",
					template: {
						content: "{endContractNum}"
					}
				}, {
					name: "Ngày nghỉ việc",
					template: {
						content: {
							parts: ["lastDay"],
							formatter: function (value) {
								return "	" + dt.format(value);
							},
						}
					}
				}, {
					name: "Tháng báo giảm",
					template: {
						content: ""
					}
				}];
				break;
			case "wage":
				selectedTab = "wage";
				this.sourceData = "InsuranceWage";
				this.columns = [{
					name: "Mã nhân viên",
					template: {
						content: "{userId}"
					}
				}, {
					name: "Họ và tên",
					template: {
						content: "{name}"
					}
				}, {
					name: "Mã số BHXH",
					template: {
						content: {
							parts: ["socialInsId"],
							formatter: function (value) {
								return value != null ? "	" + value : "";
							},
						}
					}
				}, {
					name: "Ngày sinh",
					template: {
						content: {
							parts: ["dob"],
							formatter: function (value) {
								return "	" + dt.format(value);
							},
						}
					}
				}, {
					name: "Nữ (x)",
					template: {
						content: "{gender}"
					}
				}, {
					name: "Dân tộc",
					template: {
						content: "{nation}"
					}
				}, {
					name: "Quốc tịch",
					template: {
						content: "{nationality}"
					}
				}, {
					name: "Số CMND/Hộ chiếu/Thẻ căn cước",
					template: {
						content: {
							parts: ["nationalId"],
							formatter: function (value) {
								if (value != undefined || value != null) {
									return "	" + value;
								} else value;
							},
						}
					}
				}, {
					name: "Số điện thoại",
					template: {
						content: {
							parts: ["phone"],
							formatter: function (value) {
								return "	" + value;
							},
						}
					}
				}, {
					name: "Email",
					template: {
						content: "{email}"
					}
				}, {
					name: "Mã hộ gia đình",
					template: {
						content: ""
					}
				}, {
					name: "Tỉnh/TP (thường trú)",
					template: {
						content: "{permanentAddr/province}"
					}
				}, {
					name: "Quận/Huyện (thường trú)",
					template: {
						content: "{permanentAddr/county}"
					}
				}, {
					name: "Xã/phường (thường trú)",
					template: {
						content: "{permanentAddr/state}"
					}
				}, {
					name: "Tỉnh/TP (Tạm trú)",
					template: {
						content: "{lodgingAddr/province}"
					}
				}, {
					name: "Quận/Huyện (Tạm trú)",
					template: {
						content: "{lodgingAddr/county}"
					}
				}, {
					name: "Xã/phường (Tạm trú)",
					template: {
						content: "{lodgingAddr/state}"
					}
				}, {
					name: "Cấp bậc, chức vụ, chức danh nghề",
					template: {
						content: "{jobLevel}"
					}
				}, {
					name: "Nơi làm việc",
					template: {
						content: "{location}"
					}
				}, {
					name: "Số HDLD",
					template: {
						content: "{laborContractId}"
					}
				}, {
					name: "Ngày ký",
					template: {
						content: {
							parts: ["signingDate"],
							formatter: function (value) {
								return "	" + dt.format(value);
							},
						}
					}
				}, {
					name: "Loại hợp đồng",
					template: {
						content: "{contractType}"
					}
				}, {
					name: "Ngày bắt đầu",
					template: {
						content: {
							parts: ["startDate"],
							formatter: function (value) {
								return "	" + dt.format(value);
							},
						}
					}
				}, {
					name: "Ngày kết thúc",
					template: {
						content: {
							parts: ["contractEndDate"],
							formatter: function (value) {
								return "	" + dt.format(value);
							},
						}
					}
				}, {
					name: "Mức lương đóng bảo hiểm cũ",
					template: {
						content: ""
					}
				}, {
					name: "Mức lương đóng bảo hiểm mới",
					template: {
						content: "{paycompvalue}"
					}
				}];
				break;
			case "end-term":
				this.sourceData = "EndTerm";
				selectedTab = "end-term";
				this.columns = [{
					label: "Mã nhân viên",
					property: "userId",
					width: 15
				}, {
					label: "Họ và tên",
					property: "name",
					width: 50
				}, {
					label: "Chức danh",
					property: "jobTitle",
					width: 30
				}, {
					label: "Phòng/Bộ phận",
					property: "department",
					width: 20
				}, {
					label: "Khối",
					property: "division",
					width: 25
				}, {
					label: "Line Kinh doanh",
					property: "businessUnit",
					width: 20
				}, {
					label: "Loại hợp đồng",
					property: "contractType",
					width: 25
				}, {
					label: "Email",
					property: "email",
					width: 25
				}, {
					label: "Mã số BHXH",
					property: "socialInsId",
					width: 15
				}, ];
				var columnList = this.oFomular.getData();
				columnList.list.forEach((column) => {
					this.columns.push({
						label: column.columnName,
						type: sap.ui.export.EdmType.Number,
						scale: 0,
						delimiter: true,
						property: column.columnValue,
					});
				});
				break;
			default:
			}
		},

		onExportToExcel: function () {
			this.oModel = this.getView().getModel("SFResources");
			var oData = this.getView().getModel("EndTerm");
			var data = oData.oData.list;
			console.log(oData);
			var oSpreadsheet = new Spreadsheet({
				dataSource: data,
				fileName: "export.xlsx",
				workbook: {
					columns: this.columns,
					context: {
						title: "ABC",
						sheetName: "Cuối kì",
					}
				}
			});
			oSpreadsheet.onprogress = function (iValue) {
				jQuery.sap.log.debug("Export: " + iValue + "% completed");
			};
			oSpreadsheet.build().then(function () {
				jQuery.sap.log.debug("Export is finished");
			}).catch(function (sMessage) {
				jQuery.sap.log.error("Export error: " + sMessage);
			});
		},

		onExportPress: function () {
			// const workbook = new Excel.Workbook();
			// const worksheet = workbook.addWorksheet("My Sheet");

			// worksheet.columns = [{
			// 	header: 'Id',
			// 	key: 'id',
			// 	width: 10
			// }, {
			// 	header: 'Name',
			// 	key: 'name',
			// 	width: 32
			// }, {
			// 	header: 'D.O.B.',
			// 	key: 'dob',
			// 	width: 15,
			// }];

			// worksheet.addRow({
			// 	id: 1,
			// 	name: 'John Doe',
			// 	dob: new Date(1970, 1, 1)
			// });
			// worksheet.addRow({
			// 	id: 2,
			// 	name: 'Jane Doe',
			// 	dob: new Date(1965, 1, 7)
			// });

			// // save under export.xlsx
			// await workbook.xlsx.writeFile('export.xlsx');
			// /* this line is only needed if you are not adding a script tag reference */
			// if (typeof XLSX == 'undefined') XLSX = require('xlsx');
			// const dt = DateFormat.getDateTimeInstance({
			// 	pattern: "dd/MM/yyyy"
			// });
			// /* make the worksheet */
			// //var ws = XLSX.utils.json_to_sheet(data);
			// // var ws2 = XLSX.utils.json_to_sheet(data);
			// var wscols = [{
			// 	wch: 20
			// }, {
			// 	wpx: 200
			// }, {
			// 	wch: 20
			// }, {
			// 	wch: 20
			// }, {
			// 	wch: 20
			// }, {
			// 	wch: 20
			// }, {
			// 	wch: 20
			// }, {
			// 	wch: 20
			// }, {
			// 	wch: 20
			// }, ];

			// var ws = {
			// 	'!ref': 'A1:U5',
			// 	A1: {
			// 		v: 'Bảng cuối kì',
			// 		s: {
			// 			font: {
			// 				sz: 38,
			// 			}
			// 		}
			// 	},
			// 	A3: {
			// 		v: 'Từ ngày'
			// 	},
			// 	B3: {
			// 		v: dt.format(this.term.fromDate),
			// 		s: {
			// 			font: {
			// 				sz: 38,
			// 			}
			// 		}
			// 	},
			// 	A4: {
			// 		v: 'Đến ngày',

			// 	},
			// 	B4: {
			// 		v: dt.format(this.term.toDate),

			// 	},
			// };
			// var a = [];
			// // a.push(["Data 1", 1]);
			// // XLSX.utils.sheet_add_aoa(ws, a, {
			// // 	origin: -1
			// // });
			// var columnList = [];
			// var employeeList = this.oEndTerm.getData();
			// employeeList.list.forEach((employee, index) => {
			// 	var row = {
			// 		"Mã nhân viên": employee.userId,
			// 		"Họ và tên": employee.name,
			// 		"Chức danh": employee.jobTitle,
			// 		"Phòng/Bộ phận": employee.department,
			// 		"Khối": employee.division,
			// 		"Line Kinh doanh": employee.businessUnit,
			// 		"Loại hợp đồng": employee.contractType,
			// 		"Email": employee.email,
			// 		"Mã số BHXH": employee.socialInsId
			// 	};
			// 	var fomularList = this.oFomular.getData();
			// 	fomularList.list.forEach((column) => {
			// 		row[column.columnName] = employee[column.columnValue];
			// 		if (index == 0) {
			// 			wscols.push({
			// 				wch: 20
			// 			});
			// 		}
			// 	});
			// 	columnList.push(row);
			// });
			// XLSX.utils.sheet_add_json(ws, columnList);
			// ws['!cols'] = wscols;
			// const merge = [{
			// 	s: {
			// 		r: 0,
			// 		c: 0
			// 	},
			// 	e: {
			// 		r: 1,
			// 		c: 20
			// 	}
			// }];
			// ws["!merges"] = merge;
			// /* add to workbook */
			// var wb = XLSX.utils.book_new();
			// XLSX.utils.book_append_sheet(wb, ws, "Cuối kì");
			// /* generate an XLSX file */
			// XLSX.writeFile(wb, "Cuối kì.xlsx", {
			// 	cellStyles: true
			// });
		},

		onDataExportPDF: function (oEvent) {
			this.oModel = this.getView().getModel("SFResources");
			var oData = this.getView().getModel("EndTerm");
			var data = oData.oData.list;
			var columns = ["ID", "Name", "ID", "Name", "ID", "Name", "ID", "Name", "ID", "Name", "ID", "Name", "ID", "Name", "ID", "Name", "ID",
				"Name", "ID", "Name", "ID", "Name", "ID", "Name", "ID", "Name"
			];
			var results = [];
			for (var i = 0; i < data.length; i++) {
				results[i] = [data[i].userId, data[i].name];
			}

			var doc = new jsPDF('p', 'pt', 'a4', true);
			var PTSans = "AAEAAAAUAQA...";
			doc.addFont('Roboto-Black.ttf', 'Roboto-Black', 'normal');

			doc.setFont('Roboto');
			doc.setFontSize(10);
			doc.text("Kỳ bảo hiểm", 10, 10);
			doc.addPage();

			doc.autoTable(columns, results);
			doc.save("DemoData.pdf");
		},

		_onOpenDialog: function (that) {
			if (!that._oBusyDialog) {
				Fragment.load({
					id: "busyLoading",
					name: "com.ciber.sf.sfpayroll.view.dialog",
					controller: that
				}).then(function (oFragment) {
					that._oBusyDialog = oFragment;
					that.getView().addDependent(this._oBusyDialog);
					syncStyleClass("sapUiSizeCompact", this.getView(), this._oBusyDialog);
					that._oBusyDialog.open();
				}.bind(that));
			} else {
				that._oBusyDialog.open();
			}
		},

		_onDialogClosed: function (that) {
			that._oBusyDialog.close();
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.ciber.sf.sfpayroll.view.IncreasingInsuranceView
		 */

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