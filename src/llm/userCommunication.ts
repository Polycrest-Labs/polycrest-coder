// import { CancellationToken, ChatContext, ChatRequest, ChatResponseStream } from "vscode";

// export class UserCommunication {
//     constructor(private stream: ChatResponseStream) {
//     }
//     private _questionResolve: ((value: string) => void) | undefined;
//     private _questionReject: ((reason?: any) => void) | undefined;
//     public async askUserQuestion(question: string): Promise<string> {
//         this.stream.markdown(question);
//         this._resolve?.();
//         return new Promise<string>((resolve, reject) => {
//             this._questionResolve = resolve;
//             this._questionReject = reject;
//         });
       
//     }
//     public async processRequest(request: ChatRequest, context: ChatContext, stream: ChatResponseStream, token: CancellationToken) {
//         if (this._questionResolve) {
//             this._questionResolve(request.prompt);
//         };
//     }
//     public complete(message: string) {
//         this.stream.markdown(message);
//         this._resolve?.();
//         UserCommunicationContext.instance = null;
//     }

//     private _waitPromise: Promise<void> | undefined;
//     private _resolve: ((value: void) => void) | undefined;
//     private _reject: ((reason?: any) => void) | undefined;
//     async waitRound() : Promise<void> {
//         this._waitPromise = new Promise<void>((resolve, reject) => {
//             this._resolve = resolve;
//             this._reject = reject;
//         });
//         return this._waitPromise;
//     }
// }
// export class UserCommunicationContext {
//     constructor(public request:ChatRequest, context:ChatContext, stream : ChatResponseStream,  public token: CancellationToken) {
//     }
//     public static instance: UserCommunicationContext|null = null;
//     public static updateContext(request: ChatRequest, context: ChatContext, stream: ChatResponseStream, token: CancellationToken) {
//         const previous = UserCommunicationContext.instance?.UserCommunication;
//         UserCommunicationContext.instance = new UserCommunicationContext(request, context, stream, token);
//         UserCommunicationContext.instance.UserCommunication = previous;
//         if (!UserCommunicationContext.instance.UserCommunication) {
//             UserCommunicationContext.instance.UserCommunication = new UserCommunication(stream);
//         }
//     }
//     public UserCommunication: UserCommunication|undefined;
// }