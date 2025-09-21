<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\AiEmailAssistant\Classes;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2023, Afterlogic Corp.
 *
 * @property int $UserId
 * @property string $RequestType
 * @property string $InputContent
 * @property string $OutputContent
 * @property int $TokensUsed
 * @property string $Model
 *
 * @package AiEmailAssistant
 * @subpackage Classes
 */
class EmailAssistant extends \Aurora\System\EAV\Entity
{
	protected $aStaticMap = array(
		'UserId'		=> array('int', 0),
		'RequestType'	=> array('string', ''), // 'summarize', 'compose', 'custom'
		'InputContent'	=> array('text', ''),
		'OutputContent'	=> array('text', ''),
		'TokensUsed'	=> array('int', 0),
		'Model'			=> array('string', 'gpt-3.5-turbo'),
		'CreatedAt'		=> array('datetime', ''),
		'Parameters'	=> array('text', '') // JSON encoded additional parameters
	);
}