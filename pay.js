for (
	var usaepay,
		__assign =
			(this && this.__assign) ||
			function () {
				return (__assign =
					Object.assign ||
					function (t) {
						for (var s, i = 1, n = arguments.length; i < n; i++)
							for (var p in (s = arguments[i]))
								Object.prototype.hasOwnProperty.call(s, p) && (t[p] = s[p]);
						return t;
					}).apply(this, arguments);
			},
		host = "https://sandbox.usaepay.com",
		scripts = document.getElementsByTagName("script"),
		x = 0;
	x < scripts.length;
	x++
) {
	var src = scripts[x].src;
	if (src && src.match(/js\/v\d*\/pay.js/)) {
		host = src.split("/js/")[0];
		break;
	}
}
!(function (usaepay) {
	var Client = (function () {
			function Client(pubKey) {
				(this.pubKey = pubKey), (this.publicKey = pubKey);
			}
			return (
				(Client.prototype.createPaymentCardEntry = function () {
					return new PaymentCard(this);
				}),
				(Client.prototype.createPaymentCheckEntry = function () {
					return new PaymentCheck(this);
				}),
				(Client.prototype.createApplePayEntry = function (applePayConfig) {
					return new ApplePay(this, applePayConfig);
				}),
				(Client.prototype.createGooglePayEntry = function (googlePayconfig) {
					return new GooglePay(this, googlePayconfig);
				}),
				(Client.prototype.getPaymentKey = function (paymentMethod) {
					return paymentMethod.getPaymentKey();
				}),
				Client
			);
		})(),
		PaymentCard =
			((usaepay.Client = Client),
			(function () {
				function PaymentCard(_client) {
					(this.paymentKey = ""),
						(this.payCardHTML = ""),
						(this.payCardConfig = {}),
						(this.client = _client);
				}
				return (
					(PaymentCard.prototype.generateHTML = function (config) {
						var styles_1,
							_this = this,
							isArr =
								("styles" in config &&
									((this.payCardConfig.styles = ""),
									(styles_1 = config.styles),
									(isArr =
										"[object Array]" ==
										Object.prototype.toString.call(styles_1)),
									"object" != typeof styles_1 || isArr
										? "string" == typeof styles_1
											? (this.payCardConfig.styles = styles_1)
											: console.error(
													"Error: only string or object values are accepted for the styles parameter.",
												)
										: Object.keys(styles_1).forEach(function (className) {
												_this.generateStyleClass(
													className,
													styles_1[className],
												);
											})),
								"placeholders" in config &&
									(this.payCardConfig.placeholders = JSON.stringify(
										config.placeholders,
									)),
								"cvv_required" in config &&
									(this.payCardConfig.cvv_required = JSON.stringify(
										config.cvv_required,
									)),
								"mask_ccnum" in config &&
									(this.payCardConfig.mask_ccnum = JSON.stringify(
										config.mask_ccnum,
									)),
								"hide_icon" in config &&
									(this.payCardConfig.hide_icon = JSON.stringify(
										config.hide_icon,
									)),
								"display_errors" in config &&
									(this.payCardConfig.display_errors = JSON.stringify(
										config.display_errors,
									)),
								"custom_error_messages" in config &&
									(this.payCardConfig.custom_error_messages = JSON.stringify(
										config.custom_error_messages,
									)),
								"display_labels" in config &&
									(this.payCardConfig.display_labels = JSON.stringify(
										config.display_labels,
									)),
								"labels" in config &&
									(this.payCardConfig.labels = JSON.stringify(config.labels)),
								"label_position" in config &&
									(this.payCardConfig.label_position = JSON.stringify(
										config.label_position,
									)),
								host + "/js/v2/card.html#" + this.client.publicKey);
						this.payCardHTML =
							'<iframe id="paymentCardIFrame" src="' +
							isArr +
							'" width="100%" height="100%" frameborder="0"></iframe>';
					}),
					(PaymentCard.prototype.generateStyleClass = function (
						className,
						stylesObj,
					) {
						var _this = this,
							styleClass = "";
						(styleClass += ".payjs-" + className + " { "),
							Object.keys(stylesObj).forEach(function (styleName) {
								0 === styleName.indexOf(":")
									? _this.generateStyleClass(
											className + styleName,
											stylesObj[styleName],
										)
									: (styleClass +=
											_this.camelToDash(styleName) +
											": " +
											stylesObj[styleName] +
											"; ");
							}),
							(styleClass += " } "),
							(this.payCardConfig.styles += styleClass);
					}),
					(PaymentCard.prototype.camelToDash = function (str) {
						return str.replace(/([A-Z])/g, function ($1) {
							return "-" + $1.toLowerCase();
						});
					}),
					(PaymentCard.prototype.addHTML = function (divId) {
						var _this = this,
							payContainer = document.getElementById(divId);
						payContainer
							? (payContainer.innerHTML = this.payCardHTML)
							: console.error("could not find " + divId),
							this.addEventListener("ready", function () {
								var contentWin =
									document.getElementById("paymentCardIFrame").contentWindow;
								0 < Object.keys(_this.payCardConfig).length &&
									_this.payCardConfig.constructor === Object &&
									contentWin.postMessage(
										"addConfig::" + JSON.stringify(_this.payCardConfig),
										"*",
									),
									contentWin.postMessage("displayForm::true", "*");
							});
					}),
					(PaymentCard.prototype.addEventListener = function (
						eventType,
						response,
					) {
						window.addEventListener("message", function (event) {
							var paymentCardiFrame =
								document.getElementById("paymentCardIFrame");
							event.source === paymentCardiFrame.contentWindow &&
								(paymentCardiFrame = event.data.split("::"))[0] === eventType &&
								response(paymentCardiFrame[1]);
						});
					}),
					(PaymentCard.prototype.getPaymentKey = function () {
						var _this = this;
						return new Promise(function (resolve, reject) {
							document
								.getElementById("paymentCardIFrame")
								.contentWindow.postMessage("generateToken::true", "*"),
								_this.addEventListener("paymentKey", function (paymentKey) {
									resolve(JSON.parse(paymentKey));
								}),
								_this.addEventListener("error", function (error) {
									var parsedError;
									if ("string" == typeof error)
										try {
											parsedError = JSON.parse(error);
										} catch (_a) {
											console.warn("Failed to parse JSON string:", error);
										}
									else parsedError = error;
									"paymentKey" === parsedError.type && reject(error);
								});
						});
					}),
					PaymentCard
				);
			})()),
		PaymentCheck =
			((usaepay.PaymentCard = PaymentCard),
			(function () {
				function PaymentCheck(_client) {
					(this.paymentKey = ""),
						(this.payCheckHTML = ""),
						(this.payCheckConfig = {}),
						(this.client = _client);
				}
				return (
					(PaymentCheck.prototype.generateHTML = function (config) {
						var styles_2,
							_this = this,
							isArr =
								(config.styles &&
									((this.payCheckConfig.styles = ""),
									(styles_2 = config.styles),
									(isArr =
										"[object Array]" ==
										Object.prototype.toString.call(styles_2)),
									"object" != typeof styles_2 || isArr
										? "string" == typeof styles_2
											? (this.payCheckConfig.styles = styles_2)
											: console.error(
													"Error: only string or object values are accepted for the styles parameter.",
												)
										: Object.keys(styles_2).forEach(function (className) {
												_this.generateStyleClass(
													className,
													styles_2[className],
												);
											})),
								config.placeholders &&
									(this.payCheckConfig.placeholders = JSON.stringify(
										config.placeholders,
									)),
								config.dl_required &&
									(this.payCheckConfig.dl_required = JSON.stringify(
										config.dl_required,
									)),
								config.hide_icon &&
									(this.payCheckConfig.hide_icon = JSON.stringify(
										config.hide_icon,
									)),
								host + "/js/v2/check.html#" + this.client.publicKey);
						this.payCheckHTML =
							'<iframe id="paymentCheckIFrame" src="' +
							isArr +
							'" width="100%" height="100%" frameborder="0"></iframe>';
					}),
					(PaymentCheck.prototype.generateStyleClass = function (
						className,
						stylesObj,
					) {
						var _this = this,
							styleClass = "";
						(styleClass += ".payjs-" + className + " { "),
							Object.keys(stylesObj).forEach(function (styleName) {
								styleName.startsWith(":")
									? _this.generateStyleClass(
											className + styleName,
											stylesObj[styleName],
										)
									: (styleClass +=
											_this.camelToDash(styleName) +
											": " +
											stylesObj[styleName] +
											"; ");
							}),
							(styleClass += " } "),
							(this.payCheckConfig.styles += styleClass);
					}),
					(PaymentCheck.prototype.camelToDash = function (str) {
						return str.replace(/([A-Z])/g, function ($1) {
							return "-" + $1.toLowerCase();
						});
					}),
					(PaymentCheck.prototype.addHTML = function (divId) {
						var _this = this,
							payContainer = document.getElementById(divId);
						payContainer
							? (payContainer.innerHTML = this.payCheckHTML)
							: console.error("could not find " + divId),
							this.addEventListener("ready", function () {
								var contentWin =
									document.getElementById("paymentCheckIFrame").contentWindow;
								0 < Object.keys(_this.payCheckConfig).length &&
									_this.payCheckConfig.constructor === Object &&
									contentWin.postMessage(
										"addConfig::" + JSON.stringify(_this.payCheckConfig),
										"*",
									),
									contentWin.postMessage("displayForm::true", "*");
							});
					}),
					(PaymentCheck.prototype.addEventListener = function (
						eventType,
						response,
					) {
						window.addEventListener("message", function (event) {
							var paymentCheckiFrame =
								document.getElementById("paymentCheckIFrame");
							event.source === paymentCheckiFrame.contentWindow &&
								(paymentCheckiFrame = event.data.split("::"))[0] ===
									eventType &&
								response(paymentCheckiFrame[1]);
						});
					}),
					(PaymentCheck.prototype.getPaymentKey = function () {
						var _this = this;
						return new Promise(function (resolve, reject) {
							document
								.getElementById("paymentCheckIFrame")
								.contentWindow.postMessage("generateToken::true", "*"),
								_this.addEventListener("paymentKey", function (paymentKey) {
									resolve(JSON.parse(paymentKey));
								}),
								_this.addEventListener("error", function (errorMsg) {
									0 < errorMsg.length && reject(errorMsg);
								});
						});
					}),
					PaymentCheck
				);
			})()),
		GooglePay =
			((usaepay.PaymentCheck = PaymentCheck),
			(function () {
				function GooglePay(_client, googlePayConfig) {
					(this.paymentKey = ""),
						(this.callbacks = {}),
						(this.baseRequest = {
							apiVersion: 2,
							apiVersionMinor: 0,
						}),
						(this.client = _client),
						(this.googlePayPaymentRequest = __assign(
							__assign({}, googlePayConfig.paymentDataRequest),
							this.baseRequest,
						)),
						(this.googlePayPaymentOptions = __assign(
							{
								environment: "TEST",
							},
							googlePayConfig.paymentOptions,
						)),
						(this.googlePayConfig = googlePayConfig),
						(this.googlePayConfig.buttonOptions = Object.assign(
							{
								buttonColor: "default",
								buttonType: "short",
							},
							googlePayConfig.buttonOptions,
						)),
						this.addSpinner(googlePayConfig.targetDiv);
				}
				return (
					(GooglePay.prototype.addSpinner = function (targetDiv) {
						var head,
							style,
							payContainer = document.getElementById(targetDiv);
						payContainer
							? ((head = document.getElementsByTagName("head")[0]),
								((style = document.createElement("style")).innerHTML =
									"\n\t\t\t\t\t.gpay-button {\n\t\t\t\t\t\twidth: 100% !important;\n\t\t\t\t\t}\n\n\t\t\t\t\t#payjs-googlePayError {\n\t\t\t\t\t\twidth: 100%;\n\t\t\t\t\t\ttext-align: right;\n\t\t\t\t\t\tcolor: red;\n\t\t\t\t\t\tfont-size: 12px; \n\t\t\t\t\t}\n\n\t\t\t\t\t#paybox-googlePaySpinnerContainer {\n\t\t\t\t\t\tposition: relative;\n\t\t\t\t\t\theight: 100%;\n\t\t\t\t\t\twidth: 100%;\n\t\t\t\t\t}\n\n\t\t\t\t\t#paybox-spinner {\n\t\t\t\t\t\tanimation: rotate 2s linear infinite;\n\t\t\t\t\t\tz-index: 2;\n\t\t\t\t\t\tposition: absolute;\n\t\t\t\t\t\ttop: 50%;\n\t\t\t\t\t\tleft: 50%;\n\t\t\t\t\t\tmargin: -25px 0 0 -25px;\n\t\t\t\t\t\twidth: 30px;\n\t\t\t\t\t\theight: 30px;\n\t\t\t\t\t}\n\n\t\t\t\t\t#paybox-spinnerPath {\n\t\t\t\t\t\tstroke: #000000;\n\t\t\t\t\t\tstroke-linecap: round;\n\t\t\t\t\t\tanimation: dash 1.5s ease-in-out infinite;\n\t\t\t\t\t}\n\n\t\t\t\t\t@keyframes rotate {\n\t\t\t\t\t\t100% {\n\t\t\t\t\t\t\ttransform: rotate(360deg);\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\n\t\t\t\t\t@keyframes dash {\n\t\t\t\t\t\t0% {\n\t\t\t\t\t\t\tstroke-dasharray: 1, 150;\n\t\t\t\t\t\t\tstroke-dashoffset: 0;\n\t\t\t\t\t\t}\n\t\t\t\t\t\t50% {\n\t\t\t\t\t\t\tstroke-dasharray: 90, 150;\n\t\t\t\t\t\t\tstroke-dashoffset: -35;\n\t\t\t\t\t\t}\n\t\t\t\t\t\t100% {\n\t\t\t\t\t\t\tstroke-dasharray: 90, 150;\n\t\t\t\t\t\t\tstroke-dashoffset: -124;\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t"),
								head.appendChild(style),
								(payContainer.innerHTML =
									'\n\t\t\t\t\t<div id="paybox-googlePaySpinnerContainer">\n\t\t\t\t\t\t<svg id="paybox-spinner" viewBox="0 0 50 50">\n\t\t\t\t\t\t\t<circle id="paybox-spinnerPath" cx="25" cy="25" r="10" fill="none" stroke-width="3"></circle>\n\t\t\t\t\t\t</svg>\n\t\t\t\t\t</div>\n\t\t\t\t'))
							: console.error("Could not find " + targetDiv);
					}),
					(GooglePay.prototype.loadLibrary = function () {
						var _this = this;
						return new Promise(function (resolve, reject) {
							var script = document.createElement("script");
							(script.src = "https://pay.google.com/gp/p/js/pay.js"),
								document.getElementsByTagName("head")[0].appendChild(script),
								script.addEventListener("load", function () {
									(_this.googlePayClient =
										new google.payments.api.PaymentsClient(
											_this.googlePayPaymentOptions,
										)),
										resolve("GooglePay library loaded");
								}),
								script.addEventListener("error", function () {
									reject("Failed to load GooglePay Library");
								});
						});
					}),
					(GooglePay.prototype.checkCompatibility = function () {
						var _this = this;
						return new Promise(function (resolve, reject) {
							var relayIFrame,
								payContainer = document.getElementById(
									_this.googlePayConfig.targetDiv,
								);
							payContainer
								? (((relayIFrame = document.createElement("iframe")).id =
										"payjs-googlePayRelay"),
									(relayIFrame.src =
										host + "/js/v2/relay.html#" + _this.client.publicKey),
									(relayIFrame.width = "0"),
									(relayIFrame.height = "0"),
									(relayIFrame.frameBorder = "0"),
									(relayIFrame.style.display = "none"),
									payContainer.appendChild(relayIFrame))
								: (console.error(
										"Could not find " + _this.googlePayConfig.targetDiv,
									),
									reject("Could not find " + _this.googlePayConfig.targetDiv)),
								window.addEventListener("message", function (event) {
									var googlePayiFrame = document.getElementById(
										"payjs-googlePayRelay",
									);
									if (event.source === googlePayiFrame.contentWindow) {
										var googlePayiFrame = event.data.split("::"),
											res = JSON.parse(googlePayiFrame[1]);
										if (res.error)
											switch (googlePayiFrame[0]) {
												case "relayReady":
												case "merchantCapabilities":
													reject("Relay Error: " + res.error);
													break;
												case "paymentKey":
													_this.onStatusUpdate("googlePayError"),
														_this.displayError(
															"Error: could not get payment token.",
														),
														console.error("Relay Error: ", res.error);
											}
										else
											switch (googlePayiFrame[0]) {
												case "relayReady":
													_this.relayMessage(
														"getMerchantCapabilities",
														JSON.stringify({
															route: "/api/v2/pub/merchant_capabilities",
														}),
													);
													break;
												case "merchantCapabilities":
													res.googlepay
														? (_this.setPaymentRequestData(res),
															_this.checkBrowserCompatibility(
																res,
																resolve,
																reject,
															))
														: reject(
																"Your merchant account is not set up to use Google Pay.",
															);
													break;
												case "paymentKey":
													(_this.paymentKey = res.key),
														_this.onStatusUpdate("googlePaySuccess");
											}
									}
								});
						});
					}),
					(GooglePay.prototype.checkBrowserCompatibility = function (
						res,
						resolve,
						reject,
					) {
						res = __assign(__assign({}, this.baseRequest), {
							allowedPaymentMethods: [
								{
									type: "CARD",
									parameters: {
										allowedAuthMethods: res.googlepay.allowed_auth_methods,
										allowedCardNetworks: res.googlepay.allowed_card_networks,
									},
								},
							],
						});
						this.googlePayClient ||
							(this.googlePayClient = new google.payments.api.PaymentsClient(
								this.googlePayPaymentOptions,
							)),
							this.googlePayClient
								.isReadyToPay(res)
								.then(function (response) {
									resolve("Google Pay is supported.");
								})
								.catch(function (err) {
									reject("Google Pay is not supported.");
								});
					}),
					(GooglePay.prototype.setPaymentRequestData = function (res) {
						res = {
							type: "CARD",
							parameters: __assign(
								__assign({}, this.googlePayConfig.cardParameters),
								{
									allowedAuthMethods: res.googlepay.allowed_auth_methods,
									allowedCardNetworks: res.googlepay.allowed_card_networks,
								},
							),
							tokenizationSpecification: {
								type: "PAYMENT_GATEWAY",
								parameters: {
									gateway: "usaepay",
									gatewayMerchantId: res.googlepay.gateway_merchant_id,
								},
							},
						};
						this.googlePayPaymentRequest.allowedPaymentMethods = [res];
					}),
					(GooglePay.prototype.addButton = function () {
						var _this = this,
							buttonConfig = __assign(
								__assign({}, this.googlePayConfig.buttonOptions),
								{
									onClick: function () {
										return _this.onGooglePaymentButtonClicked();
									},
								},
							),
							buttonConfig = this.googlePayClient.createButton(buttonConfig),
							btnTarget = document.getElementById(
								this.googlePayConfig.targetDiv,
							);
						null !== btnTarget
							? (btnTarget.appendChild(buttonConfig),
								(document.getElementById(
									"paybox-googlePaySpinnerContainer",
								).style.display = "none"),
								((buttonConfig = document.createElement("div")).id =
									"payjs-googlePayError"),
								btnTarget.appendChild(buttonConfig))
							: console.error(
									'Could not find targetDiv: "' +
										this.googlePayConfig.targetDiv +
										'"',
								);
					}),
					(GooglePay.prototype.onGooglePaymentButtonClicked = function () {
						var _this = this;
						this.googlePayClient
							.loadPaymentData(this.googlePayPaymentRequest)
							.then(function (paymentData) {
								_this.processPayment(paymentData);
							})
							.catch(function (err) {
								_this.onStatusUpdate("googlePayError"),
									_this.displayError("GooglePay data did not load."),
									console.error("GooglePay Error: ", err);
							});
					}),
					(GooglePay.prototype.processPayment = function (paymentData) {
						paymentData = {
							route: "/api/v2/pub/payment_keys",
							googlepay: paymentData.paymentMethodData.tokenizationData.token,
						};
						this.relayMessage("getPaymentKey", JSON.stringify(paymentData));
					}),
					(GooglePay.prototype.relayMessage = function (title, body) {
						document
							.getElementById("payjs-googlePayRelay")
							.contentWindow.postMessage(title + "::" + body, "*");
					}),
					(GooglePay.prototype.displayError = function (errorMsg) {
						document.getElementById("payjs-googlePayError").innerText =
							errorMsg;
					}),
					(GooglePay.prototype.on = function (status, callback) {
						this.callbacks[status] = callback;
					}),
					(GooglePay.prototype.onStatusUpdate = function (status) {
						this.callbacks[status] && this.callbacks[status]();
					}),
					(GooglePay.prototype.getPaymentKey = function () {
						var _this = this;
						return new Promise(function (resolve) {
							resolve(_this.paymentKey);
						});
					}),
					GooglePay
				);
			})()),
		ApplePay =
			((usaepay.GooglePay = GooglePay),
			(function () {
				function ApplePay(_client, applePayConfig) {
					var _this = this;
					(this.callbacks = {}),
						(this.onApplePayClick = function (event) {
							_this.unlistenForApplePayClick(),
								_this.createApplePaySession(event);
						}),
						(this.client = _client),
						(this.applePayPaymentRequest = __assign(
							__assign({}, applePayConfig.paymentRequest),
							{
								merchantCapabilities: [],
								supportedNetworks: [],
							},
						)),
						(this.applePayConfig = applePayConfig),
						(this.applePayConfig.applePayBtn = Object.assign(
							{
								type: "plain",
								color: "black",
							},
							applePayConfig.applePayBtn,
						)),
						this.addSpinner(applePayConfig.targetDiv);
				}
				return (
					(ApplePay.prototype.addSpinner = function (targetDiv) {
						var head,
							style,
							payContainer = document.getElementById(targetDiv);
						payContainer
							? ((head = document.getElementsByTagName("head")[0]),
								((style = document.createElement("style")).innerHTML =
									".apple-pay-button {\n\t\t\t\t\t\theight: 40px;\n\t\t\t\t\t}\n\n\t\t\t\t\t#payjs-applePayError {\n\t\t\t\t\t\twidth: 100%;\n\t\t\t\t\t\ttext-align: right;\n\t\t\t\t\t\tcolor: red;\n\t\t\t\t\t\tfont-size: 12px; \n\t\t\t\t\t}\n\n\t\t\t\t\t#paybox-applePaySpinnerContainer {\n\t\t\t\t\t\tposition: relative;\n\t\t\t\t\t\theight: 100%;\n\t\t\t\t\t\twidth: 100%;\n\t\t\t\t\t}\n\n\t\t\t\t\t#paybox-spinner {\n\t\t\t\t\t\tanimation: rotate 2s linear infinite;\n\t\t\t\t\t\tz-index: 2;\n\t\t\t\t\t\tposition: absolute;\n\t\t\t\t\t\ttop: 50%;\n\t\t\t\t\t\tleft: 50%;\n\t\t\t\t\t\tmargin: -25px 0 0 -25px;\n\t\t\t\t\t\twidth: 50px;\n\t\t\t\t\t\theight: 50px;\n\t\t\t\t\t}\n\n\t\t\t\t\t#paybox-spinnerPath {\n\t\t\t\t\t\tstroke: #000000;\n\t\t\t\t\t\tstroke-linecap: round;\n\t\t\t\t\t\tanimation: dash 1.5s ease-in-out infinite;\n\t\t\t\t\t}\n\n\t\t\t\t\t@keyframes rotate {\n\t\t\t\t\t100% {\n\t\t\t\t\t\ttransform: rotate(360deg);\n\t\t\t\t\t}\n\t\t\t\t\t}\n\n\t\t\t\t\t@keyframes dash {\n\t\t\t\t\t0% {\n\t\t\t\t\t\tstroke-dasharray: 1, 150;\n\t\t\t\t\t\tstroke-dashoffset: 0;\n\t\t\t\t\t}\n\t\t\t\t\t50% {\n\t\t\t\t\t\tstroke-dasharray: 90, 150;\n\t\t\t\t\t\tstroke-dashoffset: -35;\n\t\t\t\t\t}\n\t\t\t\t\t100% {\n\t\t\t\t\t\tstroke-dasharray: 90, 150;\n\t\t\t\t\t\tstroke-dashoffset: -124;\n\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\t"),
								head.appendChild(style),
								(payContainer.innerHTML =
									'<div id="paybox-applePaySpinnerContainer">\n\t\t\t\t\t\t<svg id="paybox-spinner" viewBox="0 0 50 50">\n\t\t\t\t\t\t\t<circle id="paybox-spinnerPath" cx="25" cy="25" r="10" fill="none" stroke-width="3"></circle>\n\t\t\t\t\t\t</svg>\n\t\t\t\t\t</div>'))
							: console.error("Could not find " + targetDiv);
					}),
					(ApplePay.prototype.checkCompatibility = function () {
						var _this = this;
						return new Promise(function (resolve, reject) {
							window.ApplePaySession
								? window.ApplePaySession.canMakePayments
									? _this.checkPermissions(resolve, reject)
									: reject("Apple Pay is not set up by the user.")
								: reject("Apple Pay is not available from this browser");
						});
					}),
					(ApplePay.prototype.checkPermissions = function (resolve, reject) {
						var relayIFrame,
							_this = this,
							payContainer = document.getElementById(
								this.applePayConfig.targetDiv,
							);
						payContainer
							? (((relayIFrame = document.createElement("iframe")).id =
									"payjs-applePayRelay"),
								(relayIFrame.src =
									host + "/js/v2/relay.html#" + this.client.publicKey),
								(relayIFrame.width = "0"),
								(relayIFrame.height = "0"),
								(relayIFrame.frameBorder = "0"),
								(relayIFrame.style.display = "none"),
								payContainer.appendChild(relayIFrame))
							: console.error(
									"Could not find " + this.applePayConfig.targetDiv,
								),
							window.addEventListener("message", function (event) {
								var applePayiFrame = document.getElementById(
									"payjs-applePayRelay",
								);
								if (event.source === applePayiFrame.contentWindow) {
									var applePayiFrame = event.data.split("::"),
										res = JSON.parse(applePayiFrame[1]),
										applePaySession = void 0;
									if (res.error)
										switch (applePayiFrame[0]) {
											case "relayReady":
											case "merchantCapabilities":
												reject("Relay Error: ", res.error);
												break;
											case "applePayMerchantValidation":
												_this.onStatusUpdate("applePayError"),
													_this.displayError(
														"Error: could not validate merchant.",
													),
													console.error("Relay Error: ", res.error);
												break;
											case "paymentKey":
												_this.onStatusUpdate("applePayError"),
													_this.displayError(
														"Error: could not get payment token.",
													),
													console.error("Relay Error: ", res.error);
										}
									else
										switch (applePayiFrame[0]) {
											case "relayReady":
												_this.relayMessage(
													"getMerchantCapabilities",
													JSON.stringify({
														route: "/api/v2/pub/merchant_capabilities",
													}),
												);
												break;
											case "merchantCapabilities":
												res.applepay
													? ((_this.applePayPaymentRequest.merchantCapabilities =
															res.applepay.capabilities),
														(_this.applePayPaymentRequest.supportedNetworks =
															res.applepay.networks),
														_this.applePayConfig.merchantId ||
															(_this.applePayConfig.merchantId =
																res.applepay.merchant_id),
														resolve("Apple Pay is available."))
													: reject(
															"Your merchant account is not set up to use Apple Pay.",
														);
												break;
											case "applePayMerchantValidation":
												var applePaySession = _this.applePaySession,
													data = JSON.parse(res.payload);
												applePaySession.completeMerchantValidation(data);
												break;
											case "paymentKey":
												(applePaySession = _this.applePaySession),
													(_this.paymentKey = res),
													applePaySession.completePayment(
														window.ApplePaySession.STATUS_SUCCESS,
													),
													_this.onStatusUpdate("applePaySuccess");
										}
								}
							});
					}),
					(ApplePay.prototype.addButton = function () {
						var btnTarget = document.getElementById(
								this.applePayConfig.targetDiv,
							),
							applePayBtn = document.createElement("div");
						(applePayBtn.id = "payjs-applePayBtn"),
							applePayBtn.setAttribute("class", "apple-pay-button"),
							applePayBtn.setAttribute(
								"style",
								"\n\t\t\t\t-webkit-appearance: -apple-pay-button;\n\t\t\t\t-apple-pay-button-type: " +
									this.applePayConfig.applePayBtn.type +
									";\n\t\t\t\t-apple-pay-button-style: " +
									this.applePayConfig.applePayBtn.color +
									";\n\t\t\t",
							),
							btnTarget.appendChild(applePayBtn),
							this.listenForApplePayClick();
						document.getElementById(
							"paybox-applePaySpinnerContainer",
						).style.display = "none";
						applePayBtn = document.createElement("div");
						(applePayBtn.id = "payjs-applePayError"),
							btnTarget.appendChild(applePayBtn);
					}),
					(ApplePay.prototype.listenForApplePayClick = function () {
						document
							.getElementById("payjs-applePayBtn")
							.addEventListener("click", this.onApplePayClick);
					}),
					(ApplePay.prototype.unlistenForApplePayClick = function () {
						document
							.getElementById("payjs-applePayBtn")
							.removeEventListener("click", this.onApplePayClick);
					}),
					(ApplePay.prototype.createApplePaySession = function (event) {
						var _this = this,
							applePaySession =
								((this.applePaySession = new window.ApplePaySession(
									3,
									this.applePayPaymentRequest,
								)),
								this.applePaySession);
						(applePaySession.onvalidatemerchant = function (event) {
							event = JSON.stringify({
								route: "/api/v2/pub/applepay/validate",
								url: event.validationURL,
								display_name: _this.applePayConfig.displayName,
								domain_name: window.location.hostname,
								merchant_id: _this.applePayConfig.merchantId,
							});
							_this.relayMessage("validateApplePayMerchant", event);
						}),
							(applePaySession.oncancel = function (event) {
								_this.listenForApplePayClick(),
									_this.onStatusUpdate("applePayCancelled", event),
									_this.displayError("ApplePay cancelled.");
							}),
							(applePaySession.onpaymentauthorized = function (event) {
								_this.listenForApplePayClick(),
									_this.onStatusUpdate("applePayPaymentAuthorized", event);
								event = {
									route: "/api/v2/pub/payment_keys",
									applepay: event.payment.token,
								};
								_this.relayMessage("getPaymentKey", JSON.stringify(event));
							}),
							this.callbacks.applePayPaymentMethodSelected &&
								(applePaySession.onpaymentmethodselected = function (event) {
									_this.onStatusUpdate("applePayPaymentMethodSelected", event);
								}),
							this.callbacks.applePayCouponCodeChanged &&
								(applePaySession.oncouponcodechanged = function (event) {
									_this.onStatusUpdate("applePayCouponCodeChanged", event);
								}),
							this.callbacks.applePayShippingContactSelected &&
								(applePaySession.onshippingcontactselected = function (event) {
									_this.onStatusUpdate(
										"applePayShippingContactSelected",
										event,
									);
								}),
							this.callbacks.applePayShippingMethodSelected &&
								(applePaySession.onshippingmethodselected = function (event) {
									_this.onStatusUpdate("applePayShippingMethodSelected", event);
								}),
							applePaySession.begin();
					}),
					(ApplePay.prototype.completePaymentMethodSelection = function (
						update,
					) {
						if (!this.applePaySession)
							throw new Error("ApplePay session does not yet exist.");
						this.applePaySession.completePaymentMethodSelection(update);
					}),
					(ApplePay.prototype.completeCouponCodeChange = function (update) {
						if (!this.applePaySession)
							throw new Error("ApplePay session does not yet exist.");
						this.applePaySession.completeCouponCodeChange(update);
					}),
					(ApplePay.prototype.completeShippingContactSelection = function (
						update,
					) {
						if (!this.applePaySession)
							throw new Error("ApplePay session does not yet exist.");
						this.applePaySession.completeShippingContactSelection(update);
					}),
					(ApplePay.prototype.completeShippingMethodSelection = function (
						update,
					) {
						if (!this.applePaySession)
							throw new Error("ApplePay session does not yet exist.");
						this.applePaySession.completeShippingMethodSelection(update);
					}),
					(ApplePay.prototype.relayMessage = function (title, body) {
						document
							.getElementById("payjs-applePayRelay")
							.contentWindow.postMessage(title + "::" + body, "*");
					}),
					(ApplePay.prototype.displayError = function (errorMsg) {
						document.getElementById("payjs-applePayError").innerText = errorMsg;
					}),
					(ApplePay.prototype.on = function (status, callback) {
						this.callbacks[status] = callback;
					}),
					(ApplePay.prototype.onStatusUpdate = function (status, event) {
						this.callbacks[status] && this.callbacks[status](event);
					}),
					(ApplePay.prototype.getPaymentKey = function () {
						var _this = this;
						return new Promise(function (resolve, reject) {
							_this.applePayConfig.extended_response
								? resolve(_this.paymentKey)
								: resolve(_this.paymentKey.key);
						});
					}),
					ApplePay
				);
			})());
	usaepay.ApplePay = ApplePay;
})((usaepay = usaepay || {}));
