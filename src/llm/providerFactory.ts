import { ChatRequest, LanguageModelChat } from "vscode";
import { BamlProvider } from "./bamlProvider";

export class ProviderFactory {
    createProvider(request: ChatRequest) : LanguageModelChat {
        return new BamlProvider(request.model);
    }
}