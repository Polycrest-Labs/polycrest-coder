import { ChatRequest } from "vscode";
import { Prompt, PromptFactory } from "./promptFactory";
import { BamlRuntime } from "@polycrestlabs/baml";
import { getBamlFiles } from "../baml_client/inlinedbaml";
import { Request as BamlRequest } from "../baml_client/types";
import { Tool } from "./tools/Tool";
import { ExecutionContext } from "./tools/ExecutionContext";
import { listFiles } from "../utils/listFiles";
import path from "path";
import { ListFilesTool } from "./tools/ListFiles";


export class BamlPromptFactory extends PromptFactory {
    constructor(private executionContext:ExecutionContext){
        super();
    }
    async createPrompt(request: ChatRequest, previousToolResults:Tool[]) : Promise<Prompt> {
         const absolutePath = path.resolve(this.executionContext.cwd, '.');
         const [files, didHitLimit] = await listFiles(absolutePath, false, 200);

        const bamlRequest: BamlRequest = {
			request: request.prompt,
			file_list: [],
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
}

export const bamlRuntime = BamlRuntime.fromFiles(
	"baml_src",
	getBamlFiles(),
	Object.fromEntries(Object.entries(process.env).filter(([key, value]) => value !== undefined)) as Record<string, string>,
);