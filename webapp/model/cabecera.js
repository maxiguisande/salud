sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"com/BASA/Salud/utils/FioriComponentHelper"
], function (JSONModel, FioriComponentHelper) {
	"use strict";

	return {
		getModel: function () {
			//gets component
			var component = FioriComponentHelper.getComponent();
			//gets model
			var jsonModel = component.byId("App").getModel("Cabecera");
			//checks if the model exists
			if (!jsonModel) {
				jsonModel = new sap.ui.model.json.JSONModel();
				component.byId("App").setModel(jsonModel, "Cabecera");
			}
			return jsonModel;
		},

		initializeModel: function () {
			var jsonModel = this.getModel();
			jsonModel.setData({
				Cabecera: [],
				Busy: true
			});
			return jsonModel;
		}

	};
});