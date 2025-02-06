import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChatComponent {
  // signal to hold an array of messages
  // Each message has a 'text' and a 'sender' (user or bot)
  messages = signal<{ text: string; sender: string }[]>([
    { text: 'Welcome to the chat!', sender: 'system' }
  ]);
  
  // signal for new message input
  newMessage = signal('');

  sendMessage() {
    const msg = this.newMessage().trim();
    if (!msg) return;
    // add user message
    this.messages.update(old => [...old, { text: msg, sender: 'user' }]);
    this.newMessage.set('');
    // simulate a fake bot response after 1 second
    setTimeout(() => {
      this.messages.update(old => [...old, { text: `Fake response to "${msg}"`, sender: 'bot' }]);
    }, 1000);
  }

  // New method to update message and adjust textarea height dynamically
  onInput(textarea: any) { // use any since vscode-textarea doesn't extend HTMLTextAreaElement
    this.newMessage.set(textarea.value);
    // textarea.style.height = 'auto';
    // textarea.rows = 100;
    // textarea.style.height = textarea.scrollHeight + 'px';
  }
}
