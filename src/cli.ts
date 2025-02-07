
// Add any other imports you need

import { cwd } from "process";
import { Agent } from "./llm/agent";

async function main() {
    const cliContext = {cwd: cwd()};
    const agent = new Agent(cliContext);
    // Simulate a request or process your CLI inputs
    const sampleRequest = { 
        text: "sample", 
        command: "run", 
        prompt: "sample prompt", 
        references: [], 
        toolReferences: [], 
        toolInvocationToken: "", 
        model: "default" 
    };
    console.log("Running agent with sample input...");
    // Note: You might need to adapt the interface and your processing logic here
    // await agent.process({
    //     request: sampleRequest, 
    //     context: {}, 
    //     stream: { write: (message: string) => console.log(message) },
    //     token: undefined
    // });
}
if (require.main === module) {
    main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}