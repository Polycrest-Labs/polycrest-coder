import * as fs from 'fs';
import * as path from 'path';

export function log(context:string, message:string){
    //console.log(`[${context}] ${message}`);
    //log to file
    const logFilePath = path.join(`c:\\logs\\`, `${context}.txt`);

    fs.appendFileSync(logFilePath, `${message}\n`);
};