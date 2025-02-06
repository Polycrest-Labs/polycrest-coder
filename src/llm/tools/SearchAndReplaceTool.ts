import path from "path";
import fs from "fs/promises";
import { SearchAndReplace, ToolRequest, WriteToFile } from "../../baml_client/types";
import { ChatRequestBundle } from "../chatWorkflow";
import { ExecutionContext } from "./ExecutionContext";
import { Tool } from "./Tool";
import { UserInteractionRequest } from "./UserInteractionRequest";

export class SearchAndReplaceTool implements Tool {
    public didApprove: boolean | undefined = true;
    public error: string | undefined;
    content: string | undefined;

    constructor(
        public toolRequest: ToolRequest,
        private environment: ExecutionContext,
    ) {
    }
    getLLMResponse(): string {
        if (this.error) {
            return this.error;
        }
        return "Success";
    }
    get params(): SearchAndReplace {
        return this.toolRequest.tool as SearchAndReplace;
    }
    async *run(): AsyncGenerator<UserInteractionRequest, boolean, ChatRequestBundle> {

        const relPath: string | undefined = this.params.path;

        const absolutePath = path.resolve(this.environment.cwd, relPath);
        const fileExists = await fileExistsAtPath(absolutePath);
        if (!fileExists) {
            this.error = `File not found: ${absolutePath}`;
            return true;
        }
        const newContext = yield {approvalRequired: true, message: `Do you want to write to file ${absolutePath}?`};

		if (newContext.request.prompt !== "y") {
			return false;
		}
        // let parsedOperations: Array<{
        //     search: string
        //     replace: string
        //     start_line?: number
        //     end_line?: number
        //     use_regex?: boolean
        //     ignore_case?: boolean
        //     regex_flags?: string
        // }>
        const parsedOperations = this.params.operations;


        // Read the original file content
        const fileContent = await fs.readFile(absolutePath, "utf-8");
        let lines = fileContent.split("\n");
        for (const op of parsedOperations) {
            const flags = op.regex_flags ?? (op.ignore_case ? "gi" : "g");
            const multilineFlags = flags.includes("m") ? flags : flags + "m";

            const searchPattern = op.use_regex
                ? new RegExp(op.search, multilineFlags)
                : new RegExp(op.search, multilineFlags);

            if (op.start_line || op.end_line) {
                const startLine = Math.max((op.start_line ?? 1) - 1, 0);
                const endLine = Math.min((op.end_line ?? lines.length) - 1, lines.length - 1);

                // Get the content before and after the target section
                const beforeLines = lines.slice(0, startLine);
                const afterLines = lines.slice(endLine + 1);

                // Get the target section and perform replacement
                const targetContent = lines.slice(startLine, endLine + 1).join("\n");
                const modifiedContent = targetContent.replace(searchPattern, op.replace);
                const modifiedLines = modifiedContent.split("\n");

                // Reconstruct the full content with the modified section
                lines = [...beforeLines, ...modifiedLines, ...afterLines];
            } else {
                // Global replacement
                const fullContent = lines.join("\n");
                const modifiedContent = fullContent.replace(searchPattern, op.replace);
                lines = modifiedContent.split("\n");
            }
        }

        const newContent = lines.join("\n");
        await fs.writeFile(absolutePath, newContent);



        return true;
    }
}
async function fileExistsAtPath(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}