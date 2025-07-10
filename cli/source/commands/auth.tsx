import React, {useEffect, useState} from 'react';
import {Text, Box} from 'ink';
import open from 'open';
import {getOTP} from '../core/auth.js';
import UncontrolledTextInput from 'ink-text-input';
import inquirer from 'inquirer';
import Conf from 'conf';

export default async function AuthCommand(autumnConfig: Conf) {
	open('http://152.67.152.51:3000/dev/cli');

	const otp = await inquirer.prompt([
		{
			type: 'input',
			name: 'otp',
			message: 'Enter OTP:',
		},
	]);

	const keys = await getOTP(otp.otp);
	autumnConfig.set('keys', keys);

	console.log(
		'Success! Keys have been stored locally. You may now use the CLI.',
	);
}
