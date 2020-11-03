sap.ui.define([
	"com/BASA/Salud/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox",
	"sap/ndc/BarcodeScanner",
	"com/BASA/Salud/model/formatter",
	"com/BASA/Salud/services/Services",
	"com/BASA/Salud/model/cabecera",
	"com/BASA/Salud/model/TableData",
	"sap/m/MessageToast"
], function (BaseController, JSONModel, History, MessageBox, scan, formatter, Services, HeaderData, TableData, MessageToast) {
	"use strict";

	return BaseController.extend("com.BASA.Salud.controller.lecturaQR", {

		formatter: formatter,
		onInit: function () {
			//Importante para capturar la vuelta de la pagina 1
			/*	this.getRouter().getRoute("Navigation").attachPatternMatched(this._onObjectMatched, this);*/
		},

		onScanQR: function (oEvent) {
			var that = this;
			sap.ndc.BarcodeScanner.scan(
				function (scanResult) {
					Services.getCabecera(scanResult.text).then(result => {
						that.setCabeceraModel(scanResult.text, result);
					}).catch(function (sError) {
						sap.m.MessageToast.show(sError.message);
					});
				},
				function (Error) {
					var bCompact = !!that.getView().$().closest(".sapUiSizeCompact").length;
					MessageBox.error(
						"No se Pudo Leer el número de Paciente. " + Error, {
							styleClass: bCompact ? "sapUiSizeCompact" : ""
						}
					);
				}
			);
		},

		navigateToMenu: function () {
			var oRoute = sap.ui.core.UIComponent.getRouterFor(this);
			oRoute.navTo("Navigation");
		},

		setCabeceraModel: function (scanID, oData) {
			var that = this;
			var header = {
				centro: scanID.substr(0, 4),
				paciente: scanID.substr(4, 10),
				episodio: scanID.substr(14, 10),
				fullname: "",
				sexo: "",
				edad: "",
				iconURL: "",
				detalle: "",
				fechaHoy: "",
				strUzeit: "",
				ePicture: "",
				fecnac: "",
				estado: "Hospitalizado",
				oReasonCodeArray: [],
				oReasonCodeIdArray: []
			};
			header.iconURL = Services.getPictureService(header.centro, header.paciente, header.episodio);
			//header.iconURL = "/sap/opu/odata/sap/ZSALUD_SRV/cabeceraSet(IEinri='" + header.centro + "',IFalnr='" + header.episodio + "',IPatnr='" + header.paciente + "')/$value";

			var oDateFormatInput = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "dd.MM.yyyy"
			});
			header.fecnac = oDateFormatInput.format(oData.Dob);
			var year = oData.Dob.getFullYear();
			var today = new Date();
			header.edad = today.getFullYear() - year;
			var uzeit = new Date(oData.EUzeit.ms);
			header.strUzeit = "PT" + uzeit.getHours() + "H" + uzeit.getMinutes() + "M" + uzeit.getSeconds() + "S";
			
			var formattedToday = oDateFormatInput.format(today);
			header.fechaHoy = "Administracion de Medicación " + formattedToday;
			
			header.fullname = oData.LastNamePat + ", " + oData.FrstNamePat;
			header.sexo = (oData.Sex === 1 ? "F" : "M");

			var oFilter = [];
			oFilter = [new sap.ui.model.Filter("IEinri", sap.ui.model.FilterOperator.EQ, header.centro),
				new sap.ui.model.Filter("IFalnr", sap.ui.model.FilterOperator.EQ, header.episodio)
			];

			Services.getMovement(oFilter).then(oDataMov => {
				//"02MHCARD / 02UE4PH0 / 02HAB403 / 02CH403A"
				var strConcat = oDataMov.results[0].Department + " / " + oDataMov.results[0].NursTreatOu + " / " + oDataMov.results[0].Room +
					" / " + oDataMov.results[0].Bed;
				header.detalle = strConcat;
				let oModel = HeaderData.initializeModel();
				oModel.setProperty("/Cabecera", header);
				that.setTableData(header.centro, header.episodio, header.strUzeit);
			}).catch(function (sError) {
				sap.m.MessageToast.show(sError.message);
			});
		},
		
		setTableData: function (centro, episodio, uzeit) {
			var that = this;
			var oFilter = [];
					oFilter = [new sap.ui.model.Filter("IEinri", sap.ui.model.FilterOperator.EQ, centro),
					new sap.ui.model.Filter("IFalnr", sap.ui.model.FilterOperator.EQ, episodio),
					new sap.ui.model.Filter("IUzeit", sap.ui.model.FilterOperator.EQ, uzeit)];
				Services.getADMEvents(oFilter).then(oDataME => {
					let oModel = TableData.initializeModel();
				oModel.setProperty("/TableData", oDataME);
				that.navigateToMenu();
				}).catch(function (sError) {
				sap.m.MessageToast.show(sError.message);
			});
					
		},

		lecturaValida: function (oStr) {
			var centro = oStr.text.substr(0, 4);
			var paciente = oStr.text.substr(4, 10);
			var episodio = oStr.text.substr(14, 10);
			var fullname = "";
			var sexo = "";
			var age = "";
			var uzeit;
			var strUzeit;
			var ePicture = "";
			var fecnac = "";
			var oReasonCodeArray = [];
			var oReasonCodeIdArray = [];

			try {
				var x = sap.ui.core.Component.getOwnerComponentFor(this.getView());

				//Guardar datos Principales
				x._IEinri = centro;
				x._IFalnr = episodio;
				x._IPatnr = paciente;

				var that = this;

				if (centro.length === 0 || paciente.length === 0 || episodio.length === 0) {
					MessageToast.show("Error de Lectura con el QR");
					return false;
				}

				// Leer Odata de Cabecera
				// cabecera		-	IEinri , IFalnr , IPatnr
				var sServiceUrl = "/sap/opu/odata/sap/ZSALUD_SRV/";
				var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, {
					json: true,
					loadMetadataAsync: false
				});
				var sPath = "/" + oModel.createKey("cabeceradataSet", {
					IEinri: centro,
					IFalnr: episodio,
					IPatnr: paciente
				});
				oModel.read(sPath, {
					success: function (oData, oResponse) {
						var oDateFormatInput = sap.ui.core.format.DateFormat.getDateTimeInstance({
							pattern: "dd.MM.yyyy"
						});
						var oTimeFormatInput = sap.ui.core.format.DateFormat.getDateTimeInstance({
							pattern: "KK:mm:ss a"
						});

						fecnac = oDateFormatInput.format(oData.Dob);
						var year = oData.Dob.getFullYear();
						var today = new Date();
						age = today.getFullYear() - year;
						uzeit = new Date(oData.EUzeit.ms);
						strUzeit = "PT" + uzeit.getHours() + "H" + uzeit.getMinutes() + "M" + uzeit.getSeconds() + "S";
						x._strUzeit = strUzeit;

						fullname = oData.LastNamePat + ", " + oData.FrstNamePat;
						sexo = (oData.Sex === 1 ? "F" : "M");

						//var edad = getAge(oData.Dob);
						var oFilter = [];
						oFilter = [new sap.ui.model.Filter("IEinri", sap.ui.model.FilterOperator.EQ, centro),
							new sap.ui.model.Filter("IFalnr", sap.ui.model.FilterOperator.EQ, episodio)
						];
						///Consultar Tabla de movimientos
						oModel.read("/movementSet", {
							filters: oFilter,
							async: false,
							success: function (oData, oResponse) {

								//Consultar tabla de Me events  meeventsSet
								// meevents 	-	IEinri , IFalnr

								//"02MHCARD / 02UE4PH0 / 02HAB403 / 02CH403A"
								var strConcat = oData.results[0].Department + " / " + oData.results[0].NursTreatOu + " / " + oData.results[0].Room +
									" / " + oData.results[0].Bed;

								x._oCabeceraModel.getData().values.push({
									fullname: fullname,
									sexo: sexo,
									edad: age,
									fecnac: fecnac,
									detalle: strConcat,
									nropac: paciente,
									episodio: episodio,
									iconUrl: "images/paciente.png",
									estado: "Hospitalizado",
									centro: centro,
									ePicture: ePicture
								});

								///uzeit
								oFilter = [];
								oFilter = [new sap.ui.model.Filter("IEinri", sap.ui.model.FilterOperator.EQ, centro),
									new sap.ui.model.Filter("IFalnr", sap.ui.model.FilterOperator.EQ, episodio),
									new sap.ui.model.Filter("IUzeit", sap.ui.model.FilterOperator.EQ, strUzeit)
								];

								oModel.read("/meeventsSet", {
									filters: oFilter,
									async: false,
									success: function (oData, oResponse) {
										//var that = this;

										$.each(oData.results, function (key, value) {
											var hora = new Date(value.Pbtad.ms).getUTCHours();
											var min = new Date(value.Pbtad.ms).getMinutes();
											var hplan = that.lpad(hora.toString(), "0", 2) + ":" + that.lpad(min.toString(), "0", 2);
											x._oTableModel.getData().values.push({
												meevtid: value.Meevtid,
												episodio: episodio,
												hplan: hplan,
												desc: value.Odescr,
												status: that.getMesId(value.Mesid)
											});

										}.bind(that));

										// endreasoncode	- IEinri
										oFilter = [new sap.ui.model.Filter("IEinri", sap.ui.model.FilterOperator.EQ, "CSGA")];
										oModel.read("/endreasoncodeSet", {
											filters: oFilter,
											async: false,
											success: function (oData, oResponse) {
												//var that = this;

												$.each(oData.results, function (key, value) {
													//oReasonCodeArray.push(value.Descr);
													oReasonCodeArray.push(value.Rcode);
													oReasonCodeIdArray.push({
														code: value.Rcode,
														id: value.Rcodeid
													});

												}.bind(that));

												x._oReasonCodeArray = oReasonCodeArray; ///guardar Array con reason code
												x._oReasonCodeIdArray = oReasonCodeIdArray; ///guardar Array con reason code + Id

											}.bind(this)
										});

										///Una vez realizada ambas consultas se redigige a pacientes 
										that.getRouter().navTo("page2");

									}.bind(that),

									error: function (err, oResponse) {
										MessageToast.show("Error " + err.message);
									}
								});

							}.bind(that),

							error: function (err, oResponse) {
								MessageToast.show("Error " + err.message);
							}
						});

					}.bind(this),

					error: function (err, oResponse) {
						MessageToast.show("Error " + err.message);

					}
				});

			} catch (err) {
				MessageToast.show("Error " + err.message);
			}
		},

		lpad: function (str, padString, length) {
			while (str.length < length) {
				str = padString + str;
			}
			return str;
		},

		getMesId: function (dato) {
			var result = "";

			if (dato === "010") {
				result = "GRA";
			} else if (dato === "020") {
				result = "CON";
			} else if (dato === "030") {
				result = "ENV";
			} else if (dato === "040") {
				result = "ADM";
			} else if (dato === "050") {
				result = "ANU";
			} else if (dato === "060") {
				result = "REC";
			} else if (dato === "070") {
				result = "FIN";
			}

			return result;
		},

		limpiarDatos: function () {
			var x = sap.ui.core.Component.getOwnerComponentFor(this.getView());

			x._oCabeceraModel.getData().values.length = 0;
			x._oTableModel.getData().values.length = 0;
			x._oTableModelDialog.getData().values.length = 0;
		},

		_onObjectMatched: function (oEvent) {
			var oParameters = oEvent.getParameters();
			if (oParameters.name === "page1") {
				this.limpiarDatos();
			}
		},

		handleErrorMessageBoxPress: function (oEvent) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.error(
				"No se Pudo Leer el Paciente.", {
					styleClass: bCompact ? "sapUiSizeCompact" : ""
				}
			);
		}

	});

});