import { ChatRequest, LanguageModelChatMessage } from "vscode";
import { Tool } from "./tools/Tool";

export class PromptFactory {
    async createPrompt(request: ChatRequest, previousToolResults:Tool[]) : Promise<Prompt> {
        return {systemPrompt:"safd", userPrompts:["sdf","sdf"]};
    }
    async createPromptMessages(request: ChatRequest, previousToolResults:Tool[]) : Promise<LanguageModelChatMessage[]> {
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

