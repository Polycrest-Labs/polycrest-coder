import { CancellationToken, LanguageModelChat, LanguageModelChatMessage, LanguageModelChatMessageRole, LanguageModelChatRequestOptions, LanguageModelChatResponse, LanguageModelTextPart, LanguageModelToolCallPart } from "vscode";
import { bamlRuntime } from "./bamlPromptFactory";
import { ToolRequest } from "../baml_client/types";
import { AttemptCompletionTool } from "./tools/AttemptCompletionTool";
import { log } from "../utils/logger";

export class BamlProvider implements LanguageModelChat {
    constructor(private innerProvider: LanguageModelChat) {

    }
    get name() { return this.innerProvider.name; }
    get id() { return this.innerProvider.id; }
    get vendor() { return this.innerProvider.vendor; }
    get family() { return this.innerProvider.family; }
    get version() { return this.innerProvider.version; }
    get maxInputTokens() { return this.innerProvider.maxInputTokens; }
    async sendRequest(messages: LanguageModelChatMessage[], options?: LanguageModelChatRequestOptions, token?: CancellationToken): Promise<LanguageModelChatResponse> {
        const makeRequest = (errorMessage:LanguageModelChatMessage[]|null) => 
            {
                if (errorMessage) {
                    messages = [...messages, ...errorMessage];
                }
                for (let i = 0; i < messages.length; i++) {
                    log("llm","\r\n=============\r\n");
                    let content  = messages[i].content[0];
                    if(content instanceof LanguageModelTextPart){
                        log("llm",content.value);
                        log("llm","\r\n");
                    }
                }
                return this.innerProvider.sendRequest(messages, options, token);
            };   

        const modifiedStream: AsyncIterable<unknown> = {
            async *[Symbol.asyncIterator](): AsyncIterableIterator<unknown> {

                let isComplete = false;
                let errorMessage:LanguageModelChatMessage[] = [];
                let retryCount = 0;
                while (!isComplete) {

                    const response = await makeRequest(errorMessage);
                    let wholeMessage = '';  // Accumulate the whole message
                    for await (const fragment of response.stream) {
                        // Assuming a text part has a 'text' property
                        if (fragment instanceof LanguageModelTextPart) {
                            wholeMessage += fragment.value;
                            yield fragment;
                        }
                        if (token?.isCancellationRequested) {
                            return;
                        }
                    }
                    if (wholeMessage === '') {
                        console.log("No message to send to BAML");
                        return;
                    }
                    try {
                        log("llm", `reponse:${wholeMessage}`);
                        const result = bamlRuntime.getResult("ExecuteAction", wholeMessage);
                        const toolRequest = JSON.parse(result) as ToolRequest;
                        const toolCallPart = new LanguageModelToolCallPart("1", toolRequest.tool.tool_name, toolRequest);
                        isComplete = true;
                        yield toolCallPart;
                    } catch (error) {
                        let lmmMessage = new LanguageModelChatMessage(LanguageModelChatMessageRole.Assistant, wholeMessage);
                        errorMessage.push(lmmMessage);
                        errorMessage.push(new LanguageModelChatMessage(LanguageModelChatMessageRole.User, `There was an error parsing your response. If you intented to communicate to the user please use 'ask_followup_question' or 'attempt_completion'. the error message was: ${error.message}`));
                        
                        retryCount++;
                        
                        
                        console.log(error);
                        console.log(wholeMessage);
                        
                        if (retryCount > 2) {
                            isComplete = true;
                            const tool :ToolRequest = {reason:"Too many retries", tool : {tool_name: "attempt_completion", result: "Too many retries", command: ""}};
                            yield new LanguageModelToolCallPart("1", tool.tool.tool_name, tool);
                        }
                        //TODO: retry including error
                    }
                }
            }
        };
        const textStream: AsyncIterable<string> = {
            async *[Symbol.asyncIterator]() {
                for await (const part of modifiedStream) {
                    // Assuming a text part has a 'text' property
                    if (part && typeof (part as any).text === "string") {
                        yield (part as any).text;
                    }
                }
            },
        };

        return { text: textStream, stream: modifiedStream };
    }
    countTokens(text: string | LanguageModelChatMessage, token?: CancellationToken): Thenable<number> {
        return this.innerProvider.countTokens(text, token);
    }
}
