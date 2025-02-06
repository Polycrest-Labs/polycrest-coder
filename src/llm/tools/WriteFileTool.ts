import path from "path";
import fs from "fs";
import { ToolRequest, WriteToFile } from "../../baml_client/types";
import { ChatRequestBundle } from "../chatWorkflow";
import { ExecutionContext } from "./ExecutionContext";
import { Tool } from "./Tool";
import { UserInteractionRequest } from "./UserInteractionRequest";

export class WriteFileTool implements Tool {
	public didApprove: boolean | undefined = true;
	public error: any;
	content: string | undefined;

	constructor(
		public toolRequest: ToolRequest,
		private environment: ExecutionContext,
	) {
	}
	get params(): WriteToFile {
		return this.toolRequest.tool as WriteToFile;
	}
	async *run(): AsyncGenerator<UserInteractionRequest, boolean, ChatRequestBundle> {

		const filePath = this.params.path;
		const fileContent = this.params.content;
		const absolutePath = path.resolve(this.environment.cwd, filePath);


		const newContext = yield {approvalRequired: true, message: `Do you want to write to file ${absolutePath}?`};

		if (newContext.request.prompt !== "y") {
			return false;
		}

		try {
			await new Promise<void>((resolve, reject) => {
				WriteFileTool.createDirectoryIfNotExists(absolutePath);
				fs.writeFile(absolutePath, fileContent, (err) => {
					if (err) {reject(err);}
					else {resolve();}
				});
			});
		} catch (err) {
			this.error = err;
			return true;
		}
		return true;
	}

	static createDirectoryIfNotExists(filePath: string): void {
		const directory = path.dirname(filePath);
		if (!fs.existsSync(directory)) {
			fs.mkdirSync(directory, { recursive: true });
		}
	}

	getLLMResponse(): string {
		if (this.didApprove) {
			return "File write operation was approved and completed successfully.";
		} else if (this.error) {
			return `File write operation failed with error: ${this.error.message}`;
		} else {
			return "File write operation was not approved.";
		}
	}
}

