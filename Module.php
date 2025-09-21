<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\AiEmailAssistant;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2023, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	public $oApiAiManager = null;
	
	public function init() 
	{
		$this->oApiAiManager = new Manager($this);
		
		\Aurora\Modules\Core\Classes\User::extend(
			self::GetName(),
			[
				'EnableModule' => array('bool', true),
				'OpenAiApiKey' => array('string', ''),
				'DefaultModel' => array('string', 'gpt-3.5-turbo'),
				'MaxTokens' => array('int', 2000)
			]
		);		
	}
	
	/**
	 * Obtains list of module settings for authenticated user.
	 * 
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);
		
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!empty($oUser) && $oUser->isNormalOrTenant())
		{
			return array(
				'EnableModule' => $oUser->{$this::GetName().'::EnableModule'},
				'OpenAiApiKey' => $oUser->{$this::GetName().'::OpenAiApiKey'},
				'DefaultModel' => $oUser->{$this::GetName().'::DefaultModel'},
				'MaxTokens' => $oUser->{$this::GetName().'::MaxTokens'}
			);
		}
		
		return null;
	}
	
	/**
	 * Updates settings of the AI Email Assistant Module.
	 * 
	 * @param boolean $EnableModule indicates if user turned on AI Email Assistant Module.
	 * @param string $OpenAiApiKey OpenAI API key for the user.
	 * @param string $DefaultModel Default OpenAI model to use.
	 * @param int $MaxTokens Maximum tokens to use for responses.
	 * @return boolean
	 */
	public function UpdateSettings($EnableModule, $OpenAiApiKey = '', $DefaultModel = 'gpt-3.5-turbo', $MaxTokens = 2000)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		
		$iUserId = \Aurora\System\Api::getAuthenticatedUserId();
		if (0 < $iUserId)
		{
			$oUser = \Aurora\Modules\Core\Module::Decorator()->GetUserUnchecked($iUserId);
			$oUser->setExtendedProp($this::GetName().'::EnableModule', $EnableModule);
			$oUser->setExtendedProp($this::GetName().'::OpenAiApiKey', $OpenAiApiKey);
			$oUser->setExtendedProp($this::GetName().'::DefaultModel', $DefaultModel);
			$oUser->setExtendedProp($this::GetName().'::MaxTokens', $MaxTokens);
			\Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);
		}
		return true;
	}
	
	/**
	 * Summarizes email content using OpenAI API.
	 * 
	 * @param string $EmailContent The email content to summarize.
	 * @param string $CustomPrompt Optional custom prompt for summarization.
	 * @return array
	 */
	public function SummarizeEmail($EmailContent, $CustomPrompt = '')
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		$sApiKey = $oUser->{$this::GetName().'::OpenAiApiKey'};
		
		if (empty($sApiKey)) {
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter, null, 'OpenAI API key is required');
		}
		
		$sPrompt = !empty($CustomPrompt) ? $CustomPrompt : 
			"Please provide a concise summary of the following email content. Focus on the key points, actions needed, and important details:\n\n" . $EmailContent;
		
		$aResult = $this->oApiAiManager->CallOpenAI($sApiKey, $sPrompt, $oUser->{$this::GetName().'::DefaultModel'}, $oUser->{$this::GetName().'::MaxTokens'});
		
		return array(
			'Summary' => $aResult['content'],
			'TokensUsed' => $aResult['usage']['total_tokens'] ?? 0
		);
	}
	
	/**
	 * Composes professional email using OpenAI API.
	 * 
	 * @param string $Purpose The purpose or topic of the email.
	 * @param string $Tone The desired tone (professional, friendly, formal, etc.).
	 * @param string $KeyPoints Key points to include in the email.
	 * @param string $Recipient Optional recipient information.
	 * @return array
	 */
	public function ComposeEmail($Purpose, $Tone = 'professional', $KeyPoints = '', $Recipient = '')
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		$sApiKey = $oUser->{$this::GetName().'::OpenAiApiKey'};
		
		if (empty($sApiKey)) {
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter, null, 'OpenAI API key is required');
		}
		
		$sPrompt = "Please compose a $Tone email about: $Purpose\n\n";
		
		if (!empty($Recipient)) {
			$sPrompt .= "Recipient: $Recipient\n\n";
		}
		
		if (!empty($KeyPoints)) {
			$sPrompt .= "Key points to include:\n$KeyPoints\n\n";
		}
		
		$sPrompt .= "Please provide a well-structured email with appropriate subject line, greeting, body, and closing. Format the response as JSON with 'subject' and 'body' fields.";
		
		$aResult = $this->oApiAiManager->CallOpenAI($sApiKey, $sPrompt, $oUser->{$this::GetName().'::DefaultModel'}, $oUser->{$this::GetName().'::MaxTokens'});
		
		// Try to parse JSON response, fallback to plain text if it fails
		$aEmailData = json_decode($aResult['content'], true);
		if (!$aEmailData) {
			// If not JSON, treat the whole response as body and generate a simple subject
			$aEmailData = array(
				'subject' => 'Re: ' . substr($Purpose, 0, 50),
				'body' => $aResult['content']
			);
		}
		
		return array(
			'Subject' => $aEmailData['subject'] ?? '',
			'Body' => $aEmailData['body'] ?? $aResult['content'],
			'TokensUsed' => $aResult['usage']['total_tokens'] ?? 0
		);
	}
	
	/**
	 * General OpenAI API call for custom prompts.
	 * 
	 * @param string $Prompt The prompt to send to OpenAI.
	 * @param string $Model Optional model override.
	 * @return array
	 */
	public function GetOpenAIResponse($Prompt, $Model = '')
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		$sApiKey = $oUser->{$this::GetName().'::OpenAiApiKey'};
		
		if (empty($sApiKey)) {
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter, null, 'OpenAI API key is required');
		}
		
		$sModelToUse = !empty($Model) ? $Model : $oUser->{$this::GetName().'::DefaultModel'};
		
		$aResult = $this->oApiAiManager->CallOpenAI($sApiKey, $Prompt, $sModelToUse, $oUser->{$this::GetName().'::MaxTokens'});
		
		return array(
			'Response' => $aResult['content'],
			'TokensUsed' => $aResult['usage']['total_tokens'] ?? 0,
			'Model' => $sModelToUse
		);
	}
}