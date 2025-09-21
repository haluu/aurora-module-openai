'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * Inherits from CAbstractSettingsFormView that has methods for showing and hiding settings tab,
 * updating settings values on the server, checking if there was changes on the settings page.
 * 
 * @constructor
 */
function CAiEmailAssistantSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

	this.enableModule = ko.observable(Settings.enableModule());
	this.openAiApiKey = ko.observable(Settings.openAiApiKey());
	this.defaultModel = ko.observable(Settings.defaultModel());
	this.maxTokens = ko.observable(Settings.maxTokens());
	
	// Available models for selection
	this.availableModels = ko.observableArray(Settings.availableModels);
	
	// Validation
	this.apiKeyVisible = ko.observable(false);
	this.isValidApiKey = ko.computed(function () {
		return this.openAiApiKey().length === 0 || this.openAiApiKey().startsWith('sk-');
	}, this);
	
	this.isValidMaxTokens = ko.computed(function () {
		var iTokens = parseInt(this.maxTokens(), 10);
		return !isNaN(iTokens) && iTokens >= 100 && iTokens <= 4096;
	}, this);
	
	this.hasValidSettings = ko.computed(function () {
		return this.isValidApiKey() && this.isValidMaxTokens();
	}, this);
}

_.extendOwn(CAiEmailAssistantSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

/**
 * Name of template that will be bound to this JS-object. 'AiEmailAssistant' - name of the object,
 * 'AiEmailAssistantSettingsFormView' - name of template file in 'templates' folder.
 */
CAiEmailAssistantSettingsFormView.prototype.ViewTemplate = '%ModuleName%_AiEmailAssistantSettingsFormView';

/**
 * Returns array with all settings values which is used for indicating if there were changes on the page.
 * 
 * @returns {Array} Array with all settings values;
 */
CAiEmailAssistantSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.enableModule(),
		this.openAiApiKey(),
		this.defaultModel(),
		this.maxTokens()
	];
};

/**
 * Reverts all settings values to global ones.
 */
CAiEmailAssistantSettingsFormView.prototype.revertGlobalValues = function ()
{
	this.enableModule(Settings.enableModule());
	this.openAiApiKey(Settings.openAiApiKey());
	this.defaultModel(Settings.defaultModel());
	this.maxTokens(Settings.maxTokens());
};

/**
 * Returns Object with parameters for passing to the server while settings updating.
 * 
 * @returns Object
 */
CAiEmailAssistantSettingsFormView.prototype.getParametersForSave = function ()
{
	return {
		'EnableModule': this.enableModule(),
		'OpenAiApiKey': this.openAiApiKey(),
		'DefaultModel': this.defaultModel(),
		'MaxTokens': parseInt(this.maxTokens(), 10)
	};
};

/**
 * Applies new settings values to global settings object.
 * 
 * @param {Object} oParameters Parameters with new values which were passed to the server.
 */
CAiEmailAssistantSettingsFormView.prototype.applySavedValues = function (oParameters)
{
	Settings.update(oParameters.EnableModule, oParameters.OpenAiApiKey, oParameters.DefaultModel, oParameters.MaxTokens);
};

/**
 * Toggles visibility of API key field.
 */
CAiEmailAssistantSettingsFormView.prototype.toggleApiKeyVisibility = function ()
{
	this.apiKeyVisible(!this.apiKeyVisible());
};

/**
 * Clears the API key field.
 */
CAiEmailAssistantSettingsFormView.prototype.clearApiKey = function ()
{
	this.openAiApiKey('');
};

/**
 * Resets max tokens to default value.
 */
CAiEmailAssistantSettingsFormView.prototype.resetMaxTokens = function ()
{
	this.maxTokens(2000);
};

module.exports = new CAiEmailAssistantSettingsFormView();