import { ChatPromptReference, ChatRequest, Uri } from "vscode";
import { Prompt, PromptFactory } from "./promptFactory";
import { BamlRuntime } from "@polycrestlabs/baml";
import { getBamlFiles } from "../baml_client/inlinedbaml";
import { Request as BamlRequest, FileReference } from "../baml_client/types";
import { Tool } from "./tools/Tool";
import { ExecutionContext } from "./tools/ExecutionContext";
import { listFiles } from "../utils/listFiles";
import path from "path";
import fs from "fs/promises";
import { ListFilesTool } from "./tools/ListFiles";
import { extractTextFromFile } from "../utils/extract-text";
import { WorkflowRequest } from "./WorkflowRequest";


export class BamlPromptFactory extends PromptFactory {
    constructor(private executionContext:ExecutionContext){
        super();
    }
    async createPrompt(request: WorkflowRequest, previousToolResults:Tool[]) : Promise<Prompt> {

        const fileList = await BamlPromptFactory.getFileListFromReference(request.references);


         const absolutePath = path.resolve(this.executionContext.cwd, '.');
         const [files, didHitLimit] = await listFiles(absolutePath, false, 200);

        const bamlRequest: BamlRequest = {
			request: request.userRequest,
			file_list: fileList,
			environment_details: {
                osName: process.platform,
                cwd: this.executionContext.cwd,
                cwdFileList: ListFilesTool.formatFilesList(path.resolve(this.executionContext.cwd, '.'),files, didHitLimit),
            },
			previous_tool_results: previousToolResults.map((tool) =>{return  { response: tool.getLLMResponse() , tool_request:tool.toolRequest };}),
		};
        const prompts  = bamlRuntime.renderPrompt2("ExecuteAction",{request:bamlRequest});
        return {systemPrompt: prompts.system, userPrompts: prompts.chat.map((chat) => chat.message)};
    }
    static async getFileListFromReference(references: readonly Uri[]): Promise<FileReference[]> {
        const fileList: FileReference[] = [];
        for (const reference of references) {
           
                const isDirectory = (await fs.stat(reference.fsPath)).isDirectory();
                if (isDirectory) continue;

                const fileContent = await extractTextFromFile(reference.fsPath);;
                const fileReference: FileReference = {
                    path: reference.fsPath,
                    content: fileContent,
                };
                fileList.push(fileReference);
            
        }
        return fileList;
    }
}

export const bamlRuntime = BamlRuntime.fromFiles(
	"baml_src",
	getBamlFiles(),
	Object.fromEntries(Object.entries(process.env).filter(([key, value]) => value !== undefined)) as Record<string, string>,
);