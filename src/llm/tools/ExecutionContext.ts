
import * as vscode from "vscode";

export interface ExecutionContext {
	cwd: string;
//	diffViewProvider: DiffViewProvider;
	//askApproval: (type: ClineAsk, partialMessage?: string) => Promise<boolean>;
	//askUserQuestion: (question: string) => Promise<string>;
	//environmentDetails:string;
}
export class VsExecutionContext implements ExecutionContext {
	cwd: string;
	//environmentDetails: string;
	constructor() {
		this.cwd = VsExecutionContext.getWorkingDirectory()??'';
		if (this.cwd === '') {
			console.error('No working directory found');
		}
		//this.environmentDetails = environmentDetails;
	}
	static getWorkingDirectory() {
		const cwd = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath).at(0);
		return cwd;
	}
	
}	