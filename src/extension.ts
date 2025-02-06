// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createWebviewPanel } from './webview/webviewprovider';
import { Agent } from './llm/agent';
import { VsExecutionContext } from './llm/tools/ExecutionContext';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "polycrest-coder" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('polycrest-coder.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from polycrest-coder!');
		createWebviewPanel(context);
	});

	context.subscriptions.push(disposable);




	
	const agent = new Agent(new VsExecutionContext());
	const handler: vscode.ChatRequestHandler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken) => {
		await agent.process({request, context, stream, token});
	};

	// create participant
	const p = vscode.chat.createChatParticipant("polycrest-coder.coder", handler);



}

// This method is called when your extension is deactivated
export function deactivate() {}
