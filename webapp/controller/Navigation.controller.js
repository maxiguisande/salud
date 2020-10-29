sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("com.BASA.Salud.controller.Navigation", {

		onInit: function () {
		},
		
		onCollapseExpandPress: function () {
			let viewId = this.getView().getId();
			let toolPage = sap.ui.getCore().byId(viewId + "--toolPage");
			let sideExpanded = toolPage.getSideExpanded();

			this._setToggleButtonTooltip(sideExpanded);

			toolPage.setSideExpanded(!toolPage.getSideExpanded());
		},
		
		_setToggleButtonTooltip : function(bLarge) {
			const toggleButton = this.getView().byId('sideNavigationToggleButton');
			if (bLarge) {
				toggleButton.setTooltip('Large Size Navigation');
			} else {
				toggleButton.setTooltip('Small Size Navigation');
			}
		}

	});

});