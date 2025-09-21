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
 * @package AiEmailAssistant
 */
class Manager extends \Aurora\System\Managers\AbstractManager
{
	/**
	 * 
	 * @param \Aurora\System\Module\AbstractModule $oModule
	 */
	public function __construct(\Aurora\System\Module\AbstractModule $oModule = null)
	{
		parent::__construct($oModule);
	}
	
	/**
	 * Calls OpenAI API with the given parameters.
	 * 
	 * @param string $sApiKey OpenAI API key.
	 * @param string $sPrompt The prompt to send.
	 * @param string $sModel The model to use.
	 * @param int $iMaxTokens Maximum tokens for the response.
	 * @return array
	 */
	public function CallOpenAI($sApiKey, $sPrompt, $sModel = 'gpt-3.5-turbo', $iMaxTokens = 2000)
	{
		if (empty($sApiKey)) {
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter, null, 'API key is required');
		}
		
		if (empty($sPrompt)) {
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter, null, 'Prompt is required');
		}
		
		$aData = array(
			'model' => $sModel,
			'messages' => array(
				array(
					'role' => 'user',
					'content' => $sPrompt
				)
			),
			'max_tokens' => $iMaxTokens,
			'temperature' => 0.7
		);
		
		$sJsonData = json_encode($aData);
		
		$oCurl = curl_init();
		curl_setopt_array($oCurl, array(
			CURLOPT_URL => 'https://api.openai.com/v1/chat/completions',
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_ENCODING => '',
			CURLOPT_MAXREDIRS => 10,
			CURLOPT_TIMEOUT => 60,
			CURLOPT_FOLLOWLOCATION => true,
			CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
			CURLOPT_CUSTOMREQUEST => 'POST',
			CURLOPT_POSTFIELDS => $sJsonData,
			CURLOPT_HTTPHEADER => array(
				'Content-Type: application/json',
				'Authorization: Bearer ' . $sApiKey
			),
		));
		
		$sResponse = curl_exec($oCurl);
		$iHttpCode = curl_getinfo($oCurl, CURLINFO_HTTP_CODE);
		$sError = curl_error($oCurl);
		curl_close($oCurl);
		
		if ($sError) {
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::SystemError, null, 'cURL error: ' . $sError);
		}
		
		if ($iHttpCode !== 200) {
			$aErrorResponse = json_decode($sResponse, true);
			$sErrorMessage = isset($aErrorResponse['error']['message']) ? $aErrorResponse['error']['message'] : 'HTTP error: ' . $iHttpCode;
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::SystemError, null, $sErrorMessage);
		}
		
		$aResponse = json_decode($sResponse, true);
		
		if (!$aResponse || !isset($aResponse['choices'][0]['message']['content'])) {
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::SystemError, null, 'Invalid response format from OpenAI API');
		}
		
		return array(
			'content' => $aResponse['choices'][0]['message']['content'],
			'usage' => $aResponse['usage'] ?? array(),
			'model' => $aResponse['model'] ?? $sModel
		);
	}
	
	/**
	 * Validates OpenAI API key by making a test call.
	 * 
	 * @param string $sApiKey The API key to validate.
	 * @return boolean
	 */
	public function ValidateApiKey($sApiKey)
	{
		try {
			$this->CallOpenAI($sApiKey, 'Test', 'gpt-3.5-turbo', 10);
			return true;
		} catch (\Exception $oException) {
			return false;
		}
	}
	
	/**
	 * Preprocesses email content for better AI processing.
	 * 
	 * @param string $sContent Raw email content.
	 * @return string Processed content.
	 */
	public function PreprocessEmailContent($sContent)
	{
		// Remove HTML tags if present
		$sContent = strip_tags($sContent);
		
		// Remove excessive whitespace
		$sContent = preg_replace('/\s+/', ' ', $sContent);
		
		// Remove email signatures and footers (common patterns)
		$sContent = preg_replace('/--\s*.*/s', '', $sContent);
		$sContent = preg_replace('/Sent from my .*/i', '', $sContent);
		$sContent = preg_replace('/Best regards?.*/is', '', $sContent);
		$sContent = preg_replace('/Sincerely.*/is', '', $sContent);
		
		// Limit content length to prevent token overflow
		if (strlen($sContent) > 4000) {
			$sContent = substr($sContent, 0, 4000) . '...';
		}
		
		return trim($sContent);
	}
	
	/**
	 * Extracts key information from email headers.
	 * 
	 * @param array $aHeaders Email headers.
	 * @return array Processed header information.
	 */
	public function ProcessEmailHeaders($aHeaders)
	{
		$aProcessed = array();
		
		if (isset($aHeaders['from'])) {
			$aProcessed['sender'] = $aHeaders['from'];
		}
		
		if (isset($aHeaders['subject'])) {
			$aProcessed['subject'] = $aHeaders['subject'];
		}
		
		if (isset($aHeaders['date'])) {
			$aProcessed['date'] = $aHeaders['date'];
		}
		
		if (isset($aHeaders['importance']) || isset($aHeaders['priority'])) {
			$aProcessed['priority'] = $aHeaders['importance'] ?? $aHeaders['priority'];
		}
		
		return $aProcessed;
	}
}