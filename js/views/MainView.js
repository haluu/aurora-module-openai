'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * View that is used as screen of AI Email Assistant module. Inherits from CAbstractScreenView that has showing and hiding methods.
 * 
 * @constructor
 */
function CAiEmailAssistantView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	/**
	 * Text for displaying in browser title when AI assistant screen is shown.
	 */
	this.browserTitle = ko.observable(TextUtils.i18n('%MODULENAME%/HEADING_BROWSER_TAB'));
	
	// Current operation mode
	this.currentMode = ko.observable('summarize'); // 'summarize', 'compose', 'custom'
	
	// Email summarization
	this.emailContent = ko.observable('');
	this.customSummaryPrompt = ko.observable('');
	this.summaryResult = ko.observable('');
	this.summarizing = ko.observable(false);
	
	// Email composition
	this.emailPurpose = ko.observable('');
	this.emailTone = ko.observable('professional');
	this.emailKeyPoints = ko.observable('');
	this.emailRecipient = ko.observable('');
	this.composedSubject = ko.observable('');
	this.composedBody = ko.observable('');
	this.composing = ko.observable(false);
	
	// Custom AI requests
	this.customPrompt = ko.observable('');
	this.customResponse = ko.observable('');
	this.processingCustom = ko.observable(false);
	
	// General
	this.tokensUsed = ko.observable(0);
	this.lastError = ko.observable('');
	
	// Available options
	this.availableTones = ko.observableArray(Settings.emailTones);
	
	// Computed observables
	this.hasApiKey = ko.computed(function () {
		return Settings.isApiKeyConfigured();
	}, this);
	
	this.canSummarize = ko.computed(function () {
		return this.hasApiKey() && this.emailContent().trim().length > 0 && !this.summarizing();
	}, this);
	
	this.canCompose = ko.computed(function () {
		return this.hasApiKey() && this.emailPurpose().trim().length > 0 && !this.composing();
	}, this);
	
	this.canProcessCustom = ko.computed(function () {
		return this.hasApiKey() && this.customPrompt().trim().length > 0 && !this.processingCustom();
	}, this);
	
	this.isWorking = ko.computed(function () {
		return this.summarizing() || this.composing() || this.processingCustom();
	}, this);
	
	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

_.extendOwn(CAiEmailAssistantView.prototype, CAbstractScreenView.prototype);

CAiEmailAssistantView.prototype.ViewTemplate = '%ModuleName%_MainView';
CAiEmailAssistantView.prototype.ViewConstructorName = 'CAiEmailAssistantView';

/**
 * Called every time when screen is shown.
 */
CAiEmailAssistantView.prototype.onShow = function ()
{
	this.clearResults();
	if (!this.hasApiKey()) {
		this.lastError(TextUtils.i18n('%MODULENAME%/ERROR_NO_API_KEY'));
	}
};

/**
 * Clears all results and error messages.
 */
CAiEmailAssistantView.prototype.clearResults = function ()
{
	this.summaryResult('');
	this.composedSubject('');
	this.composedBody('');
	this.customResponse('');
	this.lastError('');
	this.tokensUsed(0);
};

/**
 * Sets the current operation mode.
 * 
 * @param {string} sMode The mode to set ('summarize', 'compose', 'custom')
 */
CAiEmailAssistantView.prototype.setMode = function (sMode)
{
	this.currentMode(sMode);
	this.clearResults();
};

/**
 * Summarizes the entered email content.
 */
CAiEmailAssistantView.prototype.summarizeEmail = function ()
{
	if (!this.canSummarize()) {
		return;
	}
	
	this.summarizing(true);
	this.lastError('');
	
	var oParameters = {
		EmailContent: this.emailContent(),
		CustomPrompt: this.customSummaryPrompt()
	};
	
	Ajax.send('SummarizeEmail', oParameters, this.onSummarizeResponse, this);
};

/**
 * Callback for email summarization response.
 * 
 * @param {Object} oResponse Response from server
 * @param {Object} oRequest Original request parameters
 */
CAiEmailAssistantView.prototype.onSummarizeResponse = function (oResponse, oRequest)
{
	this.summarizing(false);
	
	if (oResponse && oResponse.Result) {
		this.summaryResult(oResponse.Result.Summary || '');
		this.tokensUsed(oResponse.Result.TokensUsed || 0);
	} else {
		this.lastError(oResponse && oResponse.ErrorMessage ? oResponse.ErrorMessage : TextUtils.i18n('%MODULENAME%/ERROR_SUMMARIZATION_FAILED'));
	}
};

/**
 * Composes an email based on the specified parameters.
 */
CAiEmailAssistantView.prototype.composeEmail = function ()
{
	if (!this.canCompose()) {
		return;
	}
	
	this.composing(true);
	this.lastError('');
	
	var oParameters = {
		Purpose: this.emailPurpose(),
		Tone: this.emailTone(),
		KeyPoints: this.emailKeyPoints(),
		Recipient: this.emailRecipient()
	};
	
	Ajax.send('ComposeEmail', oParameters, this.onComposeResponse, this);
};

/**
 * Callback for email composition response.
 * 
 * @param {Object} oResponse Response from server
 * @param {Object} oRequest Original request parameters
 */
CAiEmailAssistantView.prototype.onComposeResponse = function (oResponse, oRequest)
{
	this.composing(false);
	
	if (oResponse && oResponse.Result) {
		this.composedSubject(oResponse.Result.Subject || '');
		this.composedBody(oResponse.Result.Body || '');
		this.tokensUsed(oResponse.Result.TokensUsed || 0);
	} else {
		this.lastError(oResponse && oResponse.ErrorMessage ? oResponse.ErrorMessage : TextUtils.i18n('%MODULENAME%/ERROR_COMPOSITION_FAILED'));
	}
};

/**
 * Processes a custom AI prompt.
 */
CAiEmailAssistantView.prototype.processCustomPrompt = function ()
{
	if (!this.canProcessCustom()) {
		return;
	}
	
	this.processingCustom(true);
	this.lastError('');
	
	var oParameters = {
		Prompt: this.customPrompt(),
		Model: '' // Use default model
	};
	
	Ajax.send('GetOpenAIResponse', oParameters, this.onCustomResponse, this);
};

/**
 * Callback for custom prompt response.
 * 
 * @param {Object} oResponse Response from server
 * @param {Object} oRequest Original request parameters
 */
CAiEmailAssistantView.prototype.onCustomResponse = function (oResponse, oRequest)
{
	this.processingCustom(false);
	
	if (oResponse && oResponse.Result) {
		this.customResponse(oResponse.Result.Response || '');
		this.tokensUsed(oResponse.Result.TokensUsed || 0);
	} else {
		this.lastError(oResponse && oResponse.ErrorMessage ? oResponse.ErrorMessage : TextUtils.i18n('%MODULENAME%/ERROR_CUSTOM_PROCESSING_FAILED'));
	}
};

/**
 * Copies text to clipboard.
 * 
 * @param {string} sText Text to copy
 */
CAiEmailAssistantView.prototype.copyToClipboard = function (sText)
{
	if (navigator.clipboard) {
		navigator.clipboard.writeText(sText).then(function() {
			App.Api.showReport(TextUtils.i18n('%MODULENAME%/REPORT_COPIED_TO_CLIPBOARD'));
		});
	} else {
		// Fallback for older browsers
		var textArea = document.createElement('textarea');
		textArea.value = sText;
		document.body.appendChild(textArea);
		textArea.select();
		document.execCommand('copy');
		document.body.removeChild(textArea);
		App.Api.showReport(TextUtils.i18n('%MODULENAME%/REPORT_COPIED_TO_CLIPBOARD'));
	}
};

/**
 * Clears the email content textarea.
 */
CAiEmailAssistantView.prototype.clearEmailContent = function ()
{
	this.emailContent('');
	this.summaryResult('');
};

/**
 * Clears the composition form.
 */
CAiEmailAssistantView.prototype.clearCompositionForm = function ()
{
	this.emailPurpose('');
	this.emailKeyPoints('');
	this.emailRecipient('');
	this.composedSubject('');
	this.composedBody('');
};

/**
 * Clears the custom prompt area.
 */
CAiEmailAssistantView.prototype.clearCustomPrompt = function ()
{
	this.customPrompt('');
	this.customResponse('');
};

/**
 * Opens settings to configure API key.
 */
CAiEmailAssistantView.prototype.openSettings = function ()
{
	App.Api.openSettingsTab(Settings.HashModuleName);
};

module.exports = new CAiEmailAssistantView();