import path from "path";
import { ExecutionContext } from "./ExecutionContext";
import { Tool } from "./Tool";
import { ReadFile, ToolRequest } from "../../baml_client/types";
import { extractTextFromFile } from "../../utils/extract-text";
import { ChatRequestBundle } from "../chatWorkflow";
import { UserInteractionRequest } from "./UserInteractionRequest";

export class ReadFileTool implements Tool {
	public didApprove: boolean | undefined;
	public error: any;
	content: string | undefined;

	constructor(
			public toolRequest: ToolRequest,
			private environment: ExecutionContext,
		) {
		}
		get params(): ReadFile {
			return this.toolRequest.tool as ReadFile;
		}
	async *run(): AsyncGenerator<UserInteractionRequest, boolean, ChatRequestBundle> {
		try {
			const relPath = this.params.path;
			if (!relPath) {
				this.error = "Missing file path.";
				return true;
			}
			const absolutePath = path.resolve(this.environment.cwd, relPath);
			this.content = await extractTextFromFile(absolutePath);
            return true;
		} catch (err) {
			this.error = err;
            return true;
		}
	}

	getLLMResponse(): string {
		if (this.error) {
			return this.error.toString();
		} else if (this.content) {
			return this.content;
		} else {
			return "No content found";
		}
	}
}
