/* global QUnit*/

sap.ui.define([
	"sap/ui/test/Opa5",
	"com/BASA/Salud/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/BASA/Salud/test/integration/pages/App",
	"com/BASA/Salud/test/integration/navigationJourney"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.BASA.Salud.view.",
		autoWait: true
	});
});