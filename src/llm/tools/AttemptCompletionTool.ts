import { AttemptCompletion, ToolRequest } from "../../baml_client/types";
import { ChatRequestBundle } from "../chatWorkflow";
import { ExecutionContext } from "./ExecutionContext";
import { Tool, } from "./Tool";
import { UserInteractionRequest } from "./UserInteractionRequest";


export class AttemptCompletionTool implements Tool {
    constructor(
        public toolRequest: ToolRequest,
        private environment: ExecutionContext
    ) {
    }
    get params(): AttemptCompletion {
        return this.toolRequest.tool as AttemptCompletion;
    }
    async *run(): AsyncGenerator<UserInteractionRequest, boolean, ChatRequestBundle> {
        yield {message: this.params.result};
        return false;
    }
    getLLMResponse(): string {
        return '';
    }

}
