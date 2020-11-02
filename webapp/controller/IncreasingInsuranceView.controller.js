sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/ui/core/util/Export',
	'sap/ui/core/util/ExportTypeCSV',
	'sap/ui/model/json/JSONModel',
	'sap/m/MessageBox',
	'sap/ui/core/format/DateFormat',
	"sap/ui/core/Fragment",
	"sap/ui/core/syncStyleClass"
], function (Controller, Export, ExportTypeCSV, JSONModel, MessageBox, DateFormat, Fragment, syncStyleClass) {
	"use strict";
	const standardWorkday = 21;
	//fixedContractTypeId
	const fixedContractTypeId = '25573';
	//permanentContractTypeId
	const permanentContractTypeId = '25574';
	//AnnexContractTypeId
	const AnnexContractTypeId = '41103';
	const contractTypeCondition = [fixedContractTypeId, permanentContractTypeId, AnnexContractTypeId];
	var selectedTab = ' ';

	return Controller.extend("com.ciber.sf.sfpayroll.controller.IncreasingInsuranceView", {
		onInit: function () {
			this.oInsuranceData = new JSONModel();
			this.oIncreasingInsurance = new JSONModel();
			this.oDecreasingInsurance = new JSONModel();
			this.oWageInsurance = new JSONModel();
			this.oCompanyList = new JSONModel();
			this.oEmployeeList = new JSONModel();
			this.oInsuranceWage = new JSONModel();

			this.columns = [];
			this.sourceData = "EmpEmployment";

			this.getView().byId("dtpYear").setDateValue(new Date());

			this.getView().setModel(this.oInsuranceData, "EmpEmployment");
			this.getView().setModel(this.oCompanyList, "CompanyList");
			this.getView().setModel(this.oEmployeeList, "EmployeeList");
			this.getView().setModel(this.oDecreasingInsurance, "DecreasingInsurance");
			this.getView().setModel(this.oIncreasingInsurance, "IncreasingInsurance");
			this.getView().setModel(this.oInsuranceWage, "InsuranceWage");
		},

		onBeforeRendering: function () {
			this._loadCompanyList();
			//this._callOdataSF();
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
								parts: ["endDate"],
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
				this.sourceData = "EmpEmployment";
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
							parts: ["endDate"],
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
				this.sourceData = "EmpEmployment";
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
							parts: ["endDate"],
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
				this.sourceData = "EmpEmployment";
				selectedTab = "end-term";
				break;
			default:
			}
		},

		onFilter: function (oEvent) {
			var date = this._getTerm();
			var companyId = this.getView().byId("cbCompany").getSelectedItem().getKey();
			var filter;
			if (companyId != "") {
				filter = "company eq '" + companyId + "'";
			}
			this._callOdataSF(filter, date.fromDate, date.toDate);
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
			// download exported file
			oExport.saveFile().catch(function (oError) {
				MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
			}).then(function () {
				oExport.destroy();
			});
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

			this.getView().byId("lblFromDate").setText(frDateStr);
			this.getView().byId("lblToDate").setText(toDateStr);

			//Convert datetime string to date object
			const dt = DateFormat.getDateTimeInstance({
				pattern: "dd/MM/yyyy"
			});
			const jsFrDate = dt.parse(frDateStr);
			const jsToDate = dt.parse(toDateStr);
			var date = {
				"fromDate": jsFrDate,
				"toDate": jsToDate
			};
			return date;
		},

		_callOdataSF: function (filter, frDate, toDate) {
			this.oModel = this.getView().getModel("SFResources");
			var that = this;
			this._onOpenDialog(that);
			var mParameter = {
				"urlParameters": {
					//"$format": "json",
					// "$top":"1500",
					// "$skip":"2000",
					//"$limit":"10",
					"$select": "userId,jobTitle,location,customString2,customDate4,contractType,customDate3,customString13,startDate,contractEndDate," +
						"employmentNav/personNav/personalInfoNav/lastName,employmentNav/personNav/personalInfoNav/firstName,employmentNav/personNav/personalInfoNav/gender," +
						"employmentNav/personNav/personalInfoNav/localNavVNM/customString1Nav/picklistLabels/label," +
						"employmentNav/personNav/personalInfoNav/localNavVNM/countryNav/territoryName,employmentNav/personNav/dateOfBirth,employmentNav/personNav/nationalIdNav/nationalId,employmentNav/personNav/nationalIdNav/cardType," +
						"employmentNav/personNav/phoneNav/phoneNumber,employmentNav/personNav/phoneNav/phoneTypeNav/externalCode," +
						"employmentNav/personNav/emailNav/emailAddress,employmentNav/personNav/emailNav/emailTypeNav/externalCode," +
						"employmentNav/personNav/homeAddressNavDEFLT/addressType,employmentNav/personNav/homeAddressNavDEFLT/countyNav/picklistLabels/label,employmentNav/personNav/homeAddressNavDEFLT/stateNav/picklistLabels/label,employmentNav/personNav/homeAddressNavDEFLT/provinceNav/picklistLabels/label," +
						"employmentNav/empWorkPermitNav/documentNumber,employmentNav/empWorkPermitNav/documentType,employmentNav/empWorkPermitNav/documentTypeNav/externalCode," +
						"employmentNav/compInfoNav/empPayCompRecurringNav/paycompvalue,employmentNav/compInfoNav/empPayCompRecurringNav/payComponent,emplStatusNav/externalCode," +
						"contractTypeNav/picklistLabels/label,contractTypeNav/picklistLabels/locale,contractTypeNav/id," +
						"positionNav/externalName_localized,positionNav/jobLevelNav/label_defaultValue,",
					"$expand": "employmentNav,employmentNav/personNav,employmentNav/personNav/personalInfoNav,employmentNav/personNav/nationalIdNav," +
						"employmentNav/personNav/personalInfoNav/localNavVNM/countryNav,employmentNav/personNav/personalInfoNav/localNavVNM/customString1Nav/picklistLabels," +
						"employmentNav/personNav/phoneNav,employmentNav/personNav/phoneNav/phoneTypeNav," +
						"employmentNav/personNav/emailNav,employmentNav/personNav/emailNav/emailTypeNav," +
						"employmentNav/personNav/homeAddressNavDEFLT,employmentNav/personNav/homeAddressNavDEFLT/countyNav/picklistLabels,employmentNav/personNav/homeAddressNavDEFLT/stateNav/picklistLabels,employmentNav/personNav/homeAddressNavDEFLT/provinceNav/picklistLabels," +
						"positionNav,positionNav/jobLevelNav," +
						"employmentNav/compInfoNav,employmentNav/compInfoNav/empPayCompRecurringNav,emplStatusNav," +
						"contractTypeNav,contractTypeNav/picklistLabels," +
						"employmentNav/empWorkPermitNav,employmentNav/empWorkPermitNav/documentTypeNav"
				},
				"success": function (oData, Response) {
					that._processData(oData, Response);
					that._onDialogClosed(that);
				},
				"error": function () {
					that._onDialogClosed(that);
				}
			};
			if (filter != undefined) {
				mParameter.urlParameters["$filter"] = filter;
			}

			if (frDate != undefined || toDate != undefined) {
				const dt = DateFormat.getDateTimeInstance({
					pattern: "yyyy-MM-dd"
				});
				mParameter.urlParameters["fromDate"] = dt.format(frDate);
				mParameter.urlParameters["toDate"] = dt.format(toDate);
			}

			console.log(mParameter);
			this.oModel.setSizeLimit(500);
			this.oModel.read("/EmpJob", mParameter);
		},

		_loadCompanyList: function () {
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
				"error": function () {}
			};
			this.oModel.read("/FOCompany", mParameter);

		},

		_processData: function (oData, Response) {
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
						payComponent = item.employmentNav.compInfoNav.results[0].empPayCompRecurringNav.results[0].payComponent = "1028" ? "1028" : "";
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
				var emp = {
					userId: item.userId,
					name: name,
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
					endDate: item.contractEndDate,
					oldPaycompvalue: "",
					payComponent: payComponent,
					paycompvalue: paycompvalue,
					timeToPay: "",
					workDay: "23",
					emplStatus: item.emplStatusNav.externalCode,
					lastDay: item.emplStatusNav.externalCode == "T" ? item.startDate : "",
					endContractNum: item.emplStatusNav.externalCode == "T" ? item.customString13 : "",
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
				list: empList
			});
			console.log(empList);
			that.oInsuranceData.refresh(true);
			that._filterIssuranceData();
		},

		_filterIssuranceData: function () {
			var oData = this.getView().getModel("EmpEmployment");
			var tempIncreasingInsuarranceList = [];
			var tempDecreasingInsuarranceList = [];
			var tempInsuranceWageList = [];
			var data = oData.oData.list;
			data.forEach(function (item, index) {
				const foundedIncreasingItem = tempIncreasingInsuarranceList.find(element => element.userId == item.userId);
				const foundedDecreasingItem = tempDecreasingInsuarranceList.find(element => element.userId == item.userId);
				const foundedWageItem = tempInsuranceWageList.find(element => element.userId == item.userId);
				if (foundedIncreasingItem != null || foundedDecreasingItem != null || foundedWageItem != null) {
					return;
				} else {
					var filteredItems = data.filter(function (element) {
						return element.userId == item.userId;
					});
					filteredItems.sort(function (a, b) {
						return new Date(b.date) - new Date(a.date);
					});
					if (filteredItems.length < 2) {
						return;
					}
					for (var i = 1; i < filteredItems.length; i++) {
						if (filteredItems[i].userId == 'CMC003506') {
							filteredItems[i].workDay = "7";
						}
						if (filteredItems[i].userId == 'CMC003507') {
							filteredItems[i].workDay = "19";
						}
						if (filteredItems[i].userId == 'CMC003508') {
							filteredItems[i].workDay = "20";
						}
						if (filteredItems[i].userId == 'CMC003509') {
							filteredItems[i].workDay = "10";
						}
						if (filteredItems[i].userId == 'CMC003511') {
							filteredItems[i].workDay = "7";
						}
						if (filteredItems[i].userId == 'CMC003512') {
							filteredItems[i].workDay = "20";
						}
						if (filteredItems[i].userId == 'CMC003513') {
							filteredItems[i].workDay = "20";
						}

						if (filteredItems[i].userId == 'CMC003514') {
							filteredItems[i].workDay = "20";
						}
						if (filteredItems[i].userId == 'CMC003515') {
							filteredItems[i].workDay = "20";
						}
						if (filteredItems[i].userId == 'CMC003516') {
							filteredItems[i].workDay = "20";
						}
						if (filteredItems[i].userId == 'CMC003517') {
							filteredItems[i].workDay = "20";
						}
						if (filteredItems[i].userId == 'CMC003518') {
							filteredItems[i].workDay = "0";
						}
						if (filteredItems[i].userId == 'CMC003519') {
							filteredItems[i].workDay = "20";
						}
						if (((contractTypeCondition.includes(filteredItems[i].contractTypeId) && !contractTypeCondition.includes(filteredItems[i - 1]
									.contractTypeId)) ||
								((filteredItems[i - 1].emplStatus == "P" || filteredItems[i - 1].emplStatus == "U") && filteredItems[i].emplStatus == "A" &&
									contractTypeCondition.includes(filteredItems[i].contractTypeId))) &&
							(standardWorkday - 14) < parseInt(filteredItems[i].workDay)) {
							tempIncreasingInsuarranceList.push(filteredItems[i]);
						}
						if ((filteredItems[i - 1].emplStatus != "P" && filteredItems[i - 1].emplStatus != "U" && filteredItems[i - 1].emplStatus !=
								"T") && (filteredItems[i].emplStatus == "P" || filteredItems[i].emplStatus == "U" || filteredItems[i - 1].emplStatus ==
								"T") && (standardWorkday - filteredItems[i].workDay) >= 14) {
							tempDecreasingInsuarranceList.push(filteredItems[i]);
						}
						// if ((filteredItems[i - 1].payComponent == "1028" && filteredItems[i].payComponent == "1028") && (filteredItems[i - 1].paycompvalue !=
						// 		filteredItems[i].paycompvalue)) {
						// 	filteredItems[i].oldPaycompvalue = filteredItems[i - 1].paycompvalue;
						// 	filteredItems[i].paycompvalue = filteredItems[i].paycompvalue;
						// 	tempInsuranceWageList.push(filteredItems[i]);
						// }
					}
				}
			});
			console.log(tempIncreasingInsuarranceList);
			console.log(tempDecreasingInsuarranceList);
			this.oIncreasingInsurance.setData({
				list: tempIncreasingInsuarranceList
			});

			this.oDecreasingInsurance.setData({
				list: tempDecreasingInsuarranceList
			});
			this.oIncreasingInsurance.refresh(true);
			this.oDecreasingInsurance.refresh(true);

			//Insurance Wage
			let listUniqueUser = [...new Set(data.map(item => item.userId))];
			var filters = [];
			listUniqueUser.forEach(item => {
				var filterByUserId = new sap.ui.model.Filter(
					"userId",
					sap.ui.model.FilterOperator.EQ, // sap.ui.model.FilterOperator|function|boolean
					item
				);
				filters.push(filterByUserId);
			});

			this.oModel = this.getView().getModel("SFResources");
			var that = this;
			var mParameter = {
				"filters": filters,
				"urlParameters": {
					"$select": "userId,paycompvalue,payComponent,startDate",
				},
				"success": function (oData, Response) {
					data.forEach(function (x) {
						const foundedWageItem = tempInsuranceWageList.find(element => element.userId == x.userId);
						if (foundedWageItem != null) {
							return;
						} else {
							var filteredItems = oData.results.filter(function (element) {
								return element.userId == x.userId;
							});
							filteredItems.sort(function (a, b) {
								return new Date(b.date) - new Date(a.date);
							});
							if (filteredItems.length < 2) {
								return;
							}
							for (var i = 1; i < filteredItems.length; i++) {
								if ((filteredItems[i - 1].payComponent == "1028" && filteredItems[i].payComponent == "1028") && (filteredItems[i - 1].paycompvalue !=
										filteredItems[i].paycompvalue)) {
									const employee = Object.assign({}, x);
									employee.paycompvalue = filteredItems[i].paycompvalue;
									employee.oldPaycompvalue = filteredItems[i - 1].paycompvalue;
									tempInsuranceWageList.push(employee);
								}
							}
							return;
						}
					});
					console.log(tempInsuranceWageList);
					// tempInsuranceWageList = tempInsuranceWageList.filter(function (element) {
					// 	return element !== undefined;
					// });
					that.oInsuranceWage.setData({
						list: tempInsuranceWageList
					});
					that.oInsuranceWage.refresh(true);
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

			// this.oInsuranceWage.setData({
			// 	list: tempInsuranceWageList
			// });

			// this.oInsuranceWage.refresh(true);

			// this.oIncreasingInsurance.setData({
			// 	list: tempList
			// });
			// this.oIncreasingInsurance.refresh(true);
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
		onSuggest: function (oEvent) {
				var search = this.byId('searchField');
				var binding = search.getBinding("suggestionItems");

				binding.filter(filters);
				binding.attachEventOnce('dataReceived', _ => search.suggest());
			}
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