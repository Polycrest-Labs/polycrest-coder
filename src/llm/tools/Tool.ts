//import { ToolRequest } from "../../../baml_client/types"

import { ToolRequest } from "../../baml_client/types";
import { ChatRequestBundle } from "../chatWorkflow";
import { UserInteractionRequest } from "./UserInteractionRequest";

export interface Tool {
	run(): AsyncGenerator<UserInteractionRequest, boolean, ChatRequestBundle>,
	getLLMResponse(): string,
	toolRequest: ToolRequest
}
