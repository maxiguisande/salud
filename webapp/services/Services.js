sap.ui.define([
	"com/BASA/Salud/utils/Constants"
], function (Constants) {
	"use strict";
	return {

		_oModel: null,
		getOdataModel: function (sPath) {
			/*
				let browserLanguage = sap.ui.getCore().getConfiguration().getSAPLogonLanguage();
			*/
			if (this._oModel) {
				return this._oModel;
			}
			//builds model
			this._oModel = new sap.ui.model.odata.ODataModel(sPath, {
				json: true,
				headers: {
					"DataServiceVersion": "2.0",
					"Cache-Control": "no-cache, no-store",
					"Pragma": "no-cache"
				}
			});
			return this._oModel;
		},

		callGetService: function (sEntity, aFilter) {
			const oDataModel = this.getOdataModel(Constants.endPoint.BACKEND);
			return new Promise((res, rej) => {
				oDataModel.read(sEntity, {
					filters: aFilter,
					success: res,
					error: rej
				});
			});
		},

		callGetEntityService: function (aFilter) {
			const oDataModel = this.getOdataModel(Constants.endPoint.BACKEND);
			var centro = aFilter.substr(0, 4),
				paciente = aFilter.substr(4, 10),
				episodio = aFilter.substr(14, 10);
			var sPath = "/" + oDataModel.createKey("cabeceradataSet", {
				IEinri: centro,
				IFalnr: episodio,
				IPatnr: paciente
			});

			return new Promise((res, rej) => {
				oDataModel.read(sPath, {
					success: res,
					error: rej
				});
			});
		},
		
		getPicture: function (centro,paciente,episodio) {
			const oDataModel = this.getOdataModel(Constants.endPoint.BACKEND);
			var sPath = "/" + oDataModel.createKey("cabeceraSet", {
				IEinri: centro,
				IFalnr: episodio,
				IPatnr: paciente
			});

			return "/sap/opu/odata/sap/ZSALUD_SRV" + sPath + "/$value";
		},
		
		callPostService: function (sEntity, oPayload) {
			//busy
			const oDataModel = this.getOdataModel(Constants.endPoint.BACKEND);
			return new Promise((res, rej) => {
				oDataModel.create(sEntity, oPayload, {
					success: res,
					error: rej
				});
			});
		},

		getCabecera: function (aFilter) {
			return this.callGetEntityService(aFilter);
		},
		
		getPictureService: function (centro, paciente, episodio) {
			return this.getPicture(centro, paciente, episodio);
		},
		
		getMovement: function (aFilter) {
			return this.callGetService(Constants.entity.MOVIMIENTOS,aFilter);
		},
		
		getADMEvents: function (aFilter) {
			return this.callGetService(Constants.entity.EVENTOSME,aFilter);
		}
	};
});