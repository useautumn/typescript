import React from 'react';
import {Text} from 'ink';
import open from 'open';

export default function AuthCommand() {
	open('https://useautumn.com');
	return <Text>Opening login url in browser...</Text>;
}
