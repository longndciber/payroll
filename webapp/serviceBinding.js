function initModel() {
	var sUrl = "/SF_CMC_DEV/odata/v2/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}