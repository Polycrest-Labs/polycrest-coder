# WebviewUI

This project is a Visual Studio Code extension providing a chat interface powered by an LLM.
It is built with Angular 19 and uses Angular signals for reactive state management, along with VSCode custom elements for UI styling.

## Features

- Chat interface with scrollable messages and dynamic, auto-resizing text area.
- Fake bot responses simulate interaction (integration pending).
- Built with Angular signals for a modern reactive approach.
- Uses VSCode custom elements (e.g., `<vscode-button>`, `<vscode-textarea>`) for consistent styling.

## File Structure

- **src/index.html**  
  Main HTML file that bootstraps the application.

- **src/app/app.component.html**  
  Embeds the chat component into the application.

- **src/app/components/chat/**  
  - **chat.component.ts:** Contains the logic for handling messages and dynamic textarea resizing.  
  - **chat.component.html:** Layout for the chat interface, including messages and input area.  
  - **chat.component.scss:** Styles to ensure the chat interface has a scrollable message area with a fixed input section.

## Setup

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Run `ng serve` to start the Angular development server.
4. Open the extension in VS Code to see the chat UI in action.

## Future Improvements

- Integrate a real LLM for dynamic responses.
- Enhance UI interactions and accessibility.
- Add further customization options for the chat interface.
