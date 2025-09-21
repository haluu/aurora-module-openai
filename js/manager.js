'use strict';

module.exports = function (oAppData) {
	var App = require('%PathToCoreWebclientModule%/js/App.js');
	
	if (App.isUserNormalOrTenant())
	{
		var
			TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

			Settings = require('modules/%ModuleName%/js/Settings.js'),
			
			HeaderItemView = null
		;

		Settings.init(oAppData);

		return {
			enableModule: Settings.enableModule,

			/**
			 * Registers settings tab of AI Email Assistant module before application start.
			 * 
			 * @param {Object} ModulesManager
			 */
			start: function (ModulesManager) {
				ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [function () { return require('modules/%ModuleName%/js/views/AiEmailAssistantSettingsFormView.js'); }, Settings.HashModuleName, TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB')]);
			},

			/**
			 * Returns list of functions that are return module screens.
			 * 
			 * @returns {Object}
			 */
			getScreens: function () {
				var oScreens = {};
				oScreens[Settings.HashModuleName] = function () {
					return require('modules/%ModuleName%/js/views/MainView.js');
				};
				return oScreens;
			},

			/**
			 * Returns object of header item view of AI Email Assistant module.
			 * 
			 * @returns {Object}
			 */
			getHeaderItem: function () {
				if (HeaderItemView === null)
				{
					var CHeaderItemView = require('%PathToCoreWebclientModule%/js/views/CHeaderItemView.js');
					HeaderItemView = new CHeaderItemView(TextUtils.i18n('%MODULENAME%/ACTION_SHOW_AI_ASSISTANT'));
				}

				return {
					item: HeaderItemView,
					name: Settings.HashModuleName
				};
			},

			/**
			 * Returns methods available for external use by other modules.
			 * 
			 * @returns {Object}
			 */
			getPublicMethods: function () {
				return {
					summarizeText: function (sText, fCallback) {
						var Ajax = require('modules/%ModuleName%/js/Ajax.js');
						Ajax.send('SummarizeEmail', {EmailContent: sText}, fCallback);
					},
					
					composeEmail: function (sPurpose, sTone, sKeyPoints, sRecipient, fCallback) {
						var Ajax = require('modules/%ModuleName%/js/Ajax.js');
						Ajax.send('ComposeEmail', {
							Purpose: sPurpose,
							Tone: sTone || 'professional',
							KeyPoints: sKeyPoints || '',
							Recipient: sRecipient || ''
						}, fCallback);
					},
					
					getAiResponse: function (sPrompt, sModel, fCallback) {
						var Ajax = require('modules/%ModuleName%/js/Ajax.js');
						Ajax.send('GetOpenAIResponse', {
							Prompt: sPrompt,
							Model: sModel || ''
						}, fCallback);
					}
				};
			}
		};
	}
	
	return null;
};