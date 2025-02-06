import { Uri } from 'vscode';

export interface WorkflowRequest {
  userRequest: string;
  references: Uri[];
}
