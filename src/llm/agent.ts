import { CancellationToken, ChatContext, ChatRequest, ChatResponseStream, LanguageModelTextPart, LanguageModelToolCallPart, LanguageModelToolResultPart, Uri } from 'vscode';
import { ProviderFactory } from './providerFactory';
import { PromptFactory } from './promptFactory';
import { BamlPromptFactory } from './bamlPromptFactory';
import { ToolFactory } from './tools/ToolFactory';
import { Tool } from './tools/Tool';
import { ChatRequestBundle } from './chatWorkflow';
import { ExecutionContext } from './tools/ExecutionContext';
import { WorkflowRequest } from './WorkflowRequest';
export class Agent {
  constructor(private executionContext: ExecutionContext) {
    this.promptFactory = new BamlPromptFactory(this.executionContext);
    this.toolFactory = new ToolFactory(this.executionContext);
  }
  providerFactory: ProviderFactory = new ProviderFactory();
  promptFactory: BamlPromptFactory;
  toolFactory: ToolFactory;

  workflow?: AsyncGenerator<string, void, ChatRequestBundle>;

  worklowRequest: WorkflowRequest|undefined;

  async startNewWorkflow(context: ChatRequestBundle): Promise<IteratorResult<string,void>> {
    
    const references:Uri[] = [];
    if (context.request.references) {
      for (const ref of context.request.references) {
        if (ref.value instanceof Uri) {
          references.push(ref.value);
        }
      }
    }
    this.worklowRequest = {userRequest:context.request.prompt, references:references};
    this.workflow = this.chatWorkflow(this.worklowRequest, context);
    let result = await this.workflow.next();
    if (result.value) {
      context.stream.markdown(result.value);
    }
    return result;
  }

  public async process(request: ChatRequestBundle): Promise<void> {
    try {
      // If there's an active conversation, resume it.
      if (this.workflow) {
        let result = await this.workflow.next(request);

        if (result.done) {
          // End of conversation, clear the workflow.
          //most have been the end of previous conversation. must start another one.
          await this.startNewWorkflow(request);
        } else {
          if (result.value) {
            request.stream.markdown(result.value);
          }
        }
      } else {
        // Start a new conversation workflow.
        let result = await this.startNewWorkflow(request);
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

  async *chatWorkflow(worklowRequest:WorkflowRequest, context: ChatRequestBundle): AsyncGenerator<string, void, ChatRequestBundle> {
    const toolRequested: Tool[] = [];
    let isComplete = false;
    let toolRun = false;
    while (!context.token.isCancellationRequested && !isComplete) {
      const promptMessages = await this.promptFactory.createPromptMessages(worklowRequest, toolRequested);
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
