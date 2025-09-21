'use strict';

var
	ko = require('knockout'),
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ServerModuleName: '%ModuleName%',
	HashModuleName: 'ai-email-assistant',
	
	/**
	 * Setting indicates if module is enabled by user or not.
	 * The Core subscribes to this setting changes and if it is **true** displays module tab in header and its screens.
	 * Otherwise the Core doesn't display module tab in header and its screens.
	 */
	enableModule: ko.observable(false),
	
	/**
	 * OpenAI API key for the user
	 */
	openAiApiKey: ko.observable(''),
	
	/**
	 * Default OpenAI model to use
	 */
	defaultModel: ko.observable('gpt-3.5-turbo'),
	
	/**
	 * Maximum tokens to use for responses
	 */
	maxTokens: ko.observable(2000),
	
	/**
	 * Available OpenAI models
	 */
	availableModels: [
		{ value: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo (Recommended)' },
		{ value: 'gpt-4', text: 'GPT-4 (More capable, slower)' },
		{ value: 'gpt-4-turbo-preview', text: 'GPT-4 Turbo (Latest)' }
	],
	
	/**
	 * Available email tones for composition
	 */
	emailTones: [
		{ value: 'professional', text: 'Professional' },
		{ value: 'friendly', text: 'Friendly' },
		{ value: 'formal', text: 'Formal' },
		{ value: 'casual', text: 'Casual' },
		{ value: 'urgent', text: 'Urgent' },
		{ value: 'apologetic', text: 'Apologetic' },
		{ value: 'persuasive', text: 'Persuasive' }
	],
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var oAppDataSection = oAppData['%ModuleName%'];
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.enableModule(Types.pBool(oAppDataSection.EnableModule, this.enableModule()));
			this.openAiApiKey(Types.pString(oAppDataSection.OpenAiApiKey, this.openAiApiKey()));
			this.defaultModel(Types.pString(oAppDataSection.DefaultModel, this.defaultModel()));
			this.maxTokens(Types.pInt(oAppDataSection.MaxTokens, this.maxTokens()));
		}
	},
	
	/**
	 * Updates settings of AI Email Assistant module after editing.
	 * 
	 * @param {boolean} bEnableModule New value of setting 'EnableModule'
	 * @param {string} sOpenAiApiKey New value of setting 'OpenAiApiKey'
	 * @param {string} sDefaultModel New value of setting 'DefaultModel'
	 * @param {int} iMaxTokens New value of setting 'MaxTokens'
	 */
	update: function (bEnableModule, sOpenAiApiKey, sDefaultModel, iMaxTokens)
	{
		this.enableModule(bEnableModule);
		this.openAiApiKey(sOpenAiApiKey);
		this.defaultModel(sDefaultModel);
		this.maxTokens(iMaxTokens);
	},
	
	/**
	 * Checks if API key is configured
	 * 
	 * @returns {boolean}
	 */
	isApiKeyConfigured: function ()
	{
		return this.openAiApiKey().length > 0;
	}
};