
import { AskFollowUpTool } from "./AskFollowUpTool";
import { AttemptCompletionTool } from "./AttemptCompletionTool";
import { ExecutionContext } from "./ExecutionContext";
import { ListFilesTool } from "./ListFiles";
import { ReadFileTool } from "./ReadFileTool";
import { Tool } from "./Tool";

export class ToolFactory {
	constructor(private environment: ExecutionContext) {}
	createTool(toolName: string, parameters: any): Tool {
		switch (toolName) {
			case "list_files":
				return new ListFilesTool(parameters, this.environment);
			case "read_file":
				return new ReadFileTool(parameters, this.environment);
			case "ask_followup_question":
				return new AskFollowUpTool(parameters, this.environment);
			// case "search_and_replace":
			//     return new SearchAndReplaceTool();
			case "attempt_compeletion":
			    return new AttemptCompletionTool(parameters, this.environment);
			// case "list_code_definition_names":
			//     return new ListCodeDefinitionNamesTool(parameters, this.environment);
			default:
				throw new Error(`Unknown tool name: ${toolName}`);
		}
		throw new Error("Unreachable code");
	}
}
