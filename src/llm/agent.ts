import { CancellationToken, ChatContext, ChatRequest, ChatResponseStream, LanguageModelTextPart, LanguageModelToolCallPart, LanguageModelToolResultPart } from 'vscode';
import { ProviderFactory } from './providerFactory';
import { PromptFactory } from './promptFactory';
import { BamlPromptFactory } from './bamlPromptFactory';
import { ToolFactory } from './tools/ToolFactory';
import { Tool } from './tools/Tool';
import { ChatRequestBundle } from './chatWorkflow';
import { ExecutionContext } from './tools/ExecutionContext';
export class Agent {
  constructor(private executionContext:ExecutionContext) {
    this.promptFactory = new BamlPromptFactory(this.executionContext);
    this.toolFactory = new ToolFactory(this.executionContext);
  }
  providerFactory: ProviderFactory = new ProviderFactory();
  promptFactory: BamlPromptFactory;
  toolFactory: ToolFactory;
 
  workflow?: AsyncGenerator<string, void, ChatRequestBundle>;



  public async process(request: ChatRequestBundle): Promise<void> {
    try {
      // If there's an active conversation, resume it.
      if (this.workflow) {
        let result = await this.workflow.next(request);
        
        if (result.done) {
          // End of conversation, clear the workflow.
          //most have been the end of previous conversation. must start another one.
          this.workflow = this.chatWorkflow(request);
          result = await this.workflow.next();
        }
        if (result.value) {
          request.stream.markdown(result.value);
        }
      } else {
        // Start a new conversation workflow.
        this.workflow = this.chatWorkflow(request);
        const result = await this.workflow.next(); // start the workflow
        if (result.value) {
          request.stream.markdown(result.value);
        }
        if (result.done) {
          // End of conversation, clear the workflow.
          this.workflow = undefined;
        }
      }
    } catch (error) {
      request.stream.markdown(`##Error: ${error}`);
      this.workflow = undefined;
      throw error;
    }
  }

  async *chatWorkflow(context: ChatRequestBundle): AsyncGenerator<string, void, ChatRequestBundle> {
    const toolRequested: Tool[] = [];
    let isComplete = false;
    let toolRun = false;
    while (!context.token.isCancellationRequested && !isComplete) {
      const promptMessages = await this.promptFactory.createPromptMessages(context.request, toolRequested);
      const provider = this.providerFactory.createProvider(context.request);

      const resultStream = await provider.sendRequest(promptMessages, {}, context.token);

      for await (const response of resultStream.stream) {
        if (response instanceof LanguageModelTextPart) {
          context.stream.markdown(response.value);
        }
        if (response instanceof LanguageModelToolCallPart) {
          toolRun = true;
          context.stream.markdown(response.name);
          const tool = this.toolFactory.createTool(response.name, response.input);
          toolRequested.push(tool);

          let toolRunIterator = tool.run();
          let toolRunState = await toolRunIterator.next();
          while (!toolRunState.done) {
            context = yield toolRunState.value.message;
            toolRunState = await toolRunIterator.next(context);
            if (context.token.isCancellationRequested) {
              context.stream.markdown("Request cancelled");
              return;
            }
          }
          let continueRunning = toolRunState.value;
          if (!continueRunning) {
            isComplete = true;
            return;
          }
        }
      }
      if (!toolRun && !isComplete) {
        context.stream.markdown("###ERROR! No tool was run");
        isComplete = true;
      }
    }
  }

}
