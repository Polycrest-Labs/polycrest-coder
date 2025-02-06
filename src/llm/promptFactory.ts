import { ChatRequest, LanguageModelChatMessage } from "vscode";
import { Tool } from "./tools/Tool";
import { WorkflowRequest } from "./WorkflowRequest";

export class PromptFactory {
    async createPrompt(request: WorkflowRequest, previousToolResults:Tool[]) : Promise<Prompt> {
        return {systemPrompt:"safd", userPrompts:["sdf","sdf"]};
    }
    async createPromptMessages(request: WorkflowRequest, previousToolResults:Tool[]) : Promise<LanguageModelChatMessage[]> {
        const prompt = await this.createPrompt(request,previousToolResults);
        const messages = [
            LanguageModelChatMessage.Assistant(prompt.systemPrompt),
        ];
        for(const userPrompt of prompt.userPrompts){
            messages.push(LanguageModelChatMessage.User(userPrompt));
        }
        return messages;
    } 
}
export interface Prompt {
    systemPrompt:string;
    userPrompts:string[];
}

