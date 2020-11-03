sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"com/BASA/Salud/model/cabecera"
], function (Controller, cabecera) {
	"use strict";

	return Controller.extend("com.BASA.Salud.controller.admMedicamentos", {

		onInit: function () {
			cabecera.getModel();
		}

	});
});