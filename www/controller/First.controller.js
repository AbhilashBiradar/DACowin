sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("ABB.Cowin.controller.First", {
		onInit: function () {
			var that=this;
			this.loadDistrict();
			this.loadPreviousData();
			this.reload = false;
			
				if (localStorage.length > 0) {
					setInterval(function(){ that.onSearch() }, 60000);
					this.reload = true;
				}
		},

		loadDistrict: function () {
			var that = this;
			var url = "https://cdn-api.co-vin.in/api/v2/admin/location/districts/16";

			$.ajax({
				crossOrigin: true,
				method: "GET",
				url: url,
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/x-www-form-urlencoded",
				},
				success: function (r) {
					var oModel = new sap.ui.model.json.JSONModel();
					oModel.setData(r);
					that.getView().byId("IDdist").setModel(oModel);
				},
				error: function (e) {
						sap.m.MessageToast.show("Cowin Server down", {	
					});
				},

			});
		},

		loadPreviousData: function () {
			var that = this; 
			if (localStorage.length > 0) {
				if (localStorage.getItem("ABB_DIST_CODE") !== undefined) {
					this.getView().byId("IDdist").setSelectedKey(localStorage.getItem("ABB_DIST_CODE"));
				}
				if (localStorage.getItem("ABB_FEE") !== undefined) {
					this.getView().byId("Fee").setSelectedKey(localStorage.getItem("ABB_FEE"));
				}
				if (localStorage.getItem("ABB_DOSE") !== undefined) {
					this.getView().byId("Dose").setSelectedKey(localStorage.getItem("ABB_DOSE"));
				}
				if (localStorage.getItem("ABB_AGE") !== undefined) {
					this.getView().byId("Age").setSelectedKey(localStorage.getItem("ABB_AGE"));
				}
				
			}

			this.getView().byId("DP1").setDateValue(new Date());
			
		},
		onSearch: function () {

			var distCode = this.getView().byId("IDdist").getSelectedKey();
			localStorage.setItem("ABB_DIST_CODE", distCode);

			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "dd-MM-yyyy"
			});
			var formatedDate = oDateFormat.format(this.getView().byId("DP1").getDateValue());

			var age = this.getView().byId("Age").getSelectedKey();
			localStorage.setItem("ABB_AGE", age);

			var dose = this.getView().byId("Dose").getSelectedKey();
			localStorage.setItem("ABB_DOSE", dose);

			var Fee = this.getView().byId("Fee").getSelectedKey();
			localStorage.setItem("ABB_FEE", Fee);

			var url = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=" + distCode + "&date=" +
				formatedDate;
			var that = this;

			$.ajax({
				crossOrigin: true,
				method: "GET",
				url: url,
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/x-www-form-urlencoded",
				},
				success: function (r) {
					that.formatData(r);

					that.applyFilter(age, dose, Fee);

				},
				error: function (e) {
					
					sap.m.MessageToast.show("Cowin Server down", {
						
					});
				},

			});
			
			
			if(!that.reload){
				setInterval(function(){ that.onSearch() }, 60000);	
			}
			
			
			
			
		},

		formatData: function (r) {

			var list = [];

			if (r.centers.length > 0) {

				for (var i = 0; i < r.centers.length; i++) {

					if (r.centers[i].sessions.length > 0) {
						for (var j = 0; j < r.centers[i].sessions.length; j++) {
							list.push({
								"Name": r.centers[i].name,
								"Pincode": r.centers[i].pincode,
								"AgeGroup": r.centers[i].sessions[j].min_age_limit,
								"Avilable1": r.centers[i].sessions[j].available_capacity_dose1,
								"Avilable2": r.centers[i].sessions[j].available_capacity_dose2,
								"Address": r.centers[i].address,
								"Vaccine": r.centers[i].sessions[j].vaccine,
								"fee_type": r.centers[i].fee_type,
								"Date": r.centers[i].sessions[j].date
							});

						}

					}

				}

			}

			console.log(list);

			var table = this.getView().byId("idProductsTable");
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData({
				'list': list
			});

			table.setModel(oModel);

		},

		applyFilter: function (age, dose, Fee) {

			var table = this.getView().byId("idProductsTable");
			var itemBinding = table.getBinding("items");

			var filterA = new sap.ui.model.Filter("AgeGroup", "EQ", age);

			if (Fee != "Any") {
				var filterB = new sap.ui.model.Filter("fee_type", "EQ", Fee);
			}

			if (dose == "1") {
				var filterC = new sap.ui.model.Filter("Avilable1", "GE", 1);
			}
			if (dose == "2") {
				var filterC = new sap.ui.model.Filter("Avilable2", "GE", 1);
			}

			if (filterB != undefined) {
				itemBinding.filter([filterA, filterB, filterC]);
			} else {
				itemBinding.filter([filterA, filterC]);
			}

			if (itemBinding.getContexts().length > 0) {
				this.beep2();
			}

		},

		beep: function () {
			var snd = new Audio(
				"data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU="
			);

			snd.play();

		},

		beep2: function () {
			var that = this;
			this.beep();
			setTimeout(() => {
				that.beep();
				setTimeout(() => {
					that.beep();
					setTimeout(() => {
						that.beep();
					}, 600);
				}, 600);
			}, 600);
		}

	});
});