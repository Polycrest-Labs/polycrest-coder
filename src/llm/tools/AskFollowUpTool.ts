import { AskUser, ToolRequest } from "../../baml_client/types";
import { ChatRequestBundle } from "../chatWorkflow";
import { ExecutionContext } from "./ExecutionContext";
import { Tool } from "./Tool";
import { UserInteractionRequest } from "./UserInteractionRequest";

export class AskFollowUpTool implements Tool {
     constructor(
                    public toolRequest: ToolRequest,
                    private environment: ExecutionContext,
                ) {
                }
                get params(): AskUser {
                    return this.toolRequest.tool as AskUser;
                }
    userResponse: string | undefined;            
    
    async *run(): AsyncGenerator<UserInteractionRequest, boolean, ChatRequestBundle> {
        let context = yield {message: this.params.message};
        this.userResponse = context.request.prompt;
        return true;
    };
    getLLMResponse(): string {
        if (!this.userResponse) {
            return "User did not respond";
        }
        return this.userResponse;
    }

}