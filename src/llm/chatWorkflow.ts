import { CancellationToken, ChatContext, ChatRequest, ChatResponseStream } from "vscode";
class ConversationManager {
    private workflow?: AsyncGenerator<string, void, ChatRequestBundle>;
  
    public async process(request: ChatRequest, context: ChatContext, stream: ChatResponseStream, token: CancellationToken): Promise<string| void> {
      // If there's an active conversation, resume it.
      if (this.workflow) {
        const result = await this.workflow.next({ request, context, stream, token });
        if (result.done) {
          // End of conversation, clear the workflow.
          this.workflow = undefined;
        }
        return result.value;
      } else {
        // Start a new conversation workflow.
        this.workflow = chatWorkflow();
        const result = await this.workflow.next({ request, context, stream, token }); // start the workflow
        return result.value;
      }
    }
  }
  export interface ChatRequestBundle{
    request: ChatRequest;
    context: ChatContext;
    stream: ChatResponseStream;
    token: CancellationToken;
  } 

  async function* chatWorkflow(): AsyncGenerator<string, void, ChatRequestBundle> {





    // Step 1: Do some initial processing
    // (This could be any asynchronous work)
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Ask for follow-up feedback:
    const response1 = yield "I have processed your message. Can you tell me more about X?";
    
    // Now resume with the user’s response stored in response1
    // (Do more processing based on response1)
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Ask another follow-up question if needed:
    const response2 = yield `Thanks for "${response1}". Now, what about Y?`;
    
    // Final processing with response2:
    await new Promise(resolve => setTimeout(resolve, 1000));
    yield `All done! You said "${response1}" and "${response2}".`;
  }