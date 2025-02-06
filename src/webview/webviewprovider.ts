// getUri.ts
import { Uri, Webview } from 'vscode';
import * as vscode from 'vscode';
export function getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
  return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}

export async function createWebviewPanel(context: vscode.ExtensionContext) {
    const subFolder = ["webviewui", "dist", "webviewui", "browser"];
    const panel = vscode.window.createWebviewPanel(
      'angularWebview',
      'Angular Webview',
      vscode.ViewColumn.One,
      { 
        enableScripts: true,

        //localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, ...subFolder, "media"), vscode.Uri.joinPath(context.extensionUri, ...subFolder)]
       }
    );
    
    const stylesUri = getUri( panel.webview, context.extensionUri, [...subFolder,"styles.css"]);
    const polyfillsUri = getUri(panel.webview,  context.extensionUri, [...subFolder,"polyfills.js"]);
    const scriptUri = getUri(panel.webview,  context.extensionUri, [...subFolder,"main.js"]);
   // C:\projects\polycrest-coder\webviewui\dist\webviewui\browser\media\codicon.ttf
   // https://file+.vscode-resource.vscode-cdn.net/c%3A/projects/polycrest-coder/webviewui/dist/webviewui/browser/media/codicon.ttf

    const codiconsFontUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, ...subFolder, "media", 'codicon.ttf'));
    const codiconsUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "webviewui",'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));
    const nonce = getNonce();
    const contentSecurityPolicy = `
  default-src 'none';
  style-src ${panel.webview.cspSource};
  font-src ${panel.webview.cspSource} data:;
  script-src ${panel.webview.cspSource} 'nonce-${nonce}';
`;

    const fontLoader =`
    @font-face {
  font-family: 'Codicon';
  src: url(${codiconsFontUri}) format('truetype');
  font-weight: normal;
  font-style: normal;
}

.codicon {
  font-family: 'Codicon';
}`;
  
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">
        <link rel="stylesheet" type="text/css" href="${stylesUri}">
        <title>Polycrest Labs</title>
        
        <base href="${context.extensionUri}">
       
      </head>
      <body>
        <app-root></app-root>
        <script type="module" nonce="${nonce}" src="${polyfillsUri}"></script>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>
  `;


   // setTimeout(() => {
    panel.webview.html = htmlContent;
    //}, 1000);
  }

  function getWebviewContent(url: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Angular Webview</title>
      </head>
      <body>
        <iframe src="${url}" width="100%" height="100%" frameborder="0"></iframe>
      </body>
      </html>
    `;
  }
  export function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }