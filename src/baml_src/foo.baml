
class UserResponse {
  message_to_user string
}
class SearchAndReplaceOperations {
    search string @description("(required) The text or pattern to search for")
    replace string @description("(required) The text to replace the search pattern with")
    start_line int @description("(optional) The line number to start the search and replace operation from. If not provided, it will start from the beginning of the file.")
    end_line int @description("(optional) The line number to end the search and replace operation. If not provided, it will end at the last line of the file.")
    use_regex bool @description("(optional) Whether to interpret the search pattern as a regular expression. Use true for regex search, false or omit for plain text search.")
    regex_flags string @description("(optional) Flags to apply to the regex search pattern. For example, 'i' for case-insensitive search.")
    ignore_case bool @description("(optional) Whether to ignore case when searching. Use true to ignore case, false or omit to match case.")
}
class ListCodeDefinitionNames{
    tool_name "list_code_definition_names" @description(#"
      Request to list definition names (classes, functions, methods, etc.) used in source code files at the top level of the specified directory. This tool provides insights into the codebase structure and important constructs, encapsulating high-level concepts and relationships that are crucial for understanding the overall architecture.
    "#)
    path string
}
class SearchAndReplace {
    tool_name "search_and_replace" @description(#"
        Request to perform search and replace operations on a file. Each operation can specify a search pattern (string or regex) and replacement text, with optional line range restrictions and regex flags. Shows a diff preview before applying changes.
    "#)
    path string
    operations SearchAndReplaceOperations[]
}
class ListFiles {
  tool_name "list_files" @description(#"
    Request to list files and directories within the specified directory. If recursive is true, it will list all files and directories recursively. If recursive is false or not provided, it will only list the top-level contents. Do not use this tool to confirm the existence of files you may have created, as the user will let you know if the files were created successfully or not.
  "#)
  path string
  recursive bool @description("(optional) Whether to list files recursively. Use true for recursive listing, false or omit for top-level only.")
  }
class AskUser {
    tool_name "ask_followup_question" @description(#"Use this tool to prompt the user for input or to display a message to the user. This can be helpful when you need to gather additional information or provide instructions to the user."#)
  message string 
}
class ReadFile {
  tool_name "read_file" @description(#"
    Use this when you need to examine the contents of an existing file you do not know the contents of, for example to analyze code, review text files, or extract information from configuration files. The output includes line numbers prefixed to each line (e.g. "1 | const x = 1"), making it easier to reference specific lines when creating diffs or discussing code. Automatically extracts raw text from PDF and DOCX files. Do not try to load files that you do not know if they exist or the user has not specified.
  "#)
  path string @description(#"
    Provide relative path to the file you want to read. You must provide a path to a flie you know about or the user has specified
  "#)
}


class WriteToFile {
  tool_name "write_to_file" @description(#"
    Request to write full content to a file at the specified path. If the file exists, it will be overwritten with the provided content. If the file doesn't exist, it will be created. This tool will automatically create any directories needed to write the file.
  "#)
  path string
  content string
}

class AttemptCompletion {
  tool_name "attempt_compeletion" @description(#"
    After each tool use, the user will respond with the result of that tool use, i.e. if it succeeded or failed, along with any reasons for failure. Once you've received the results of tool uses and can confirm that the task is complete, use this tool to present the result of your work to the user. Optionally you may provide a CLI command to showcase the result of your work. The user may respond with feedback if they are not satisfied with the result, which you can use to make improvements and try again.
IMPORTANT NOTE: This tool CANNOT be used until you've confirmed from the user that any previous tool uses were successful. 
 "#)
  result string @description(#"
    The result of the task. Formulate this result in a way that is final and does not require further input from the user. Don't end your result with questions or offers for further assistance.
  "#)
  command string @description(#"
    A CLI command to execute to show a live demo of the result to the user. For example, use \`open index.html\` to display a created html website, or \`open localhost:3000\` to display a locally running development server. But DO NOT use commands like \`echo\` or \`cat\` that merely print text. This command should be valid for the current operating system. Ensure the command is properly formatted and does not contain any harmful instructions.
    "#)
}
class ToolRequest {
  reason string
  //request_description string @description("A short description of the request. When the results are provide back to you this will be included in the response")
  tool ListFiles | ReadFile | AskUser | AttemptCompletion | WriteToFile  | SearchAndReplace // | ListCodeDefinitionNames
}


class ProjectEnvironment {
  osName string
  cwd string
  cwdFileList string
}
class ToolRequestResponse {
  tool_request ToolRequest
  response string
}
class FileReference {
  path string
  content string
}
class Request {
  request string
  file_list FileReference[]
  environment_details ProjectEnvironment
  previous_tool_results ToolRequestResponse[]
}

function ExecuteAction(request:Request) -> ToolRequest {
  client GPT4
  prompt #"
{{ _.role("system") }}
<SystemPrompt>
  <Overview>
    You are a code-generation assistant designed to help users create high-quality, efficient, and well-documented code. You have access to various tools to aid in code analysis, debugging, and generation.
  </Overview>
  <Instructions>
    <Instruction>Provide accurate and efficient code solutions tailored to the user's problem.</Instruction>
    <Instruction>Follow best coding practices and include clear, helpful comments within the code.</Instruction>
    <Instruction>Explain code logic and structure clearly when requested.</Instruction>
    <Instruction>Ask clarifying questions if the requirements are ambiguous.</Instruction>
    <Instruction>Leverage available tools to validate, analyze, and optimize code when applicable.</Instruction>
  </Instructions>
  <Capabilities>
    <Capability>Generate code in multiple programming languages</Capability>
    <Capability>Offer detailed explanations and documentation for code snippets</Capability>
    <Capability>Assist with debugging and code optimization</Capability>
    <Capability>Utilize integrated tools for code analysis and testing</Capability>
  </Capabilities>
  <Behavior>
    <BehaviorInstruction>Respond in a clear, concise, and professional manner.</BehaviorInstruction>
    <BehaviorInstruction>Ensure that all code adheres to modern coding standards and is well-structured.</BehaviorInstruction>
  </Behavior>
  <SystemInformation>
    <OperatingSystem>{{request.environment_details.osName}}</OperatingSystem>
    <CurrentWorkingDirectory>{{request.environment_details.cwd}}</CurrentWorkingDirectory>
    <CurrentWorkingDirectoryFileList>{{request.environment_details.cwdFileList}}</CurrentWorkingDirectoryFileList>
    <Note>
      When the user initially gives you a task, a recursive list of all filepaths in the current working directory will be included in CurrentWorkingDirectoryFileList. This provides an overview of the project's file structure, offering key insights into the project from directory/file names (how developers conceptualize and organize their code) and file extensions (the language used). This can also guide decision-making on which files to explore further. If you need to further explore directories such as outside the current working directory, you can use the list_files tool. If you pass 'true' for the recursive parameter, it will list files recursively. Otherwise, it will list files at the top level, which is better suited for generic directories where you don't necessarily need the nested structure, like the Desktop.
    </Note>
  </SystemInformation>
</SystemPrompt>
<Tools>
You must response using one of these tools. If you want to communicate with the user use the "ask_followup_question" tool Anything outside of these tools will not be processed. 
{{ ctx.output_format }}
</Tools>
{{ _.role("user")}} 
<UserRequest>
  <Request>{{ request.request }}</Request>
  {% if request.file_list%}}
<ReferencedFiles>
  {% for file in request.file_list %}
  <Path>{{file.path}}</Path><Content>{{file.content}}</Content>
  {% endfor %}
</ReferencedFiles>
{% endif %}
</UserRequest>
{% if request.previous_tool_results%}}
<PreviousToolResults>
  {% for result in request.previous_tool_results %}
  <ToolRequest>
    <Request>{{result.tool_request}}</Request>
    <Response>
      {{result.response}}
    </Response>
  </ToolRequest>
  {% endfor %}
</PreviousToolResults>
{% endif %}
  
You Must Select a Tool To Use For the Next Step. You cannot communicate directly with the user.
  "#
}



test AskUser {
  functions [ExecuteAction]
  args {
    request {
        request "Make this better"
        file_list ["index.html", "index.js"]
        environment_details {
            osName "Windows"
            defaultShell "cmd"
            homedir "C:\\Users\\User"
            cwd "C:\\Projects\\ProjectA"
        }
        previous_tool_results []
    }
  }

}

test HelloWorld {
  functions [ExecuteAction]
  args {
    request {
        request "Create a html file with a header and a paragraph"
        file_list ["index.html"]
        environment_details {
            osName "Windows"
            defaultShell "cmd"
            homedir "C:\\Users\\User"
            cwd "C:\\Projects\\ProjectA"
        }
        previous_tool_results []
    }
  }
}

test HelloWorldTwoStep {
  functions [ExecuteAction]
  args {
    request {
        request "Create a html file with a header and a paragraph"
        file_list ["index.html"]
        environment_details {
            osName "Windows"
            defaultShell "cmd"
            homedir "C:\\Users\\User"
            cwd "C:\\Projects\\ProjectA"
        }
        previous_tool_results  [{ 
            tool_request { 
                reason "What should the header say?" 
                tool {
                    tool_name "ask_followup_question"
                    message "What should the header say?" 
                 }
          
        }
          response "The header should say 'Hello, World!'"
         }]
            
    }
  }

}

test HelloWorldThreeStep {
  functions [ExecuteAction]
  args {
    request {
        request "Create a html file with a header and a paragraph"
        file_list ["index.html"]
        environment_details {
            osName "Windows"
            defaultShell "cmd"
            homedir "C:\\Users\\User"
            cwd "C:\\Projects\\ProjectA"
        }
        previous_tool_results  [
        { 
            tool_request { 
                reason "What should the header say?" 
                tool {
                    tool_name "ask_followup_question"
                    message "What should the header say?" 
                 }
            }
            response "The header should say 'Hello, World!'"
         }
         { 
            tool_request { 
                reason "Create an HTML file with a specific header and a paragraph." 
                tool {
                    tool_name "write_to_file"
                    path "index.html"
                    content "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n    <p>This is a sample paragraph.</p>\n</body>\n</html>" 
                 }
            }
            response "Success"
         }
         ]
            
    }
  }

}

test HelloWorldFourStep {
  functions [ExecuteAction]
  args {
    request {
        request "Create a html file with a header and a paragraph"
        file_list ["index.html"]
        environment_details {
            osName "Windows"
            defaultShell "cmd"
            homedir "C:\\Users\\User"
            cwd "C:\\Projects\\ProjectA"
        }
        previous_tool_results  [
        { 
            tool_request { 
                reason "What should the header say?" 
                tool {
                    tool_name "ask_followup_question"
                    message "What should the header say?" 
                 }
            }
            response "The header should say 'Hello, World!'"
         }
         { 
            tool_request { 
                reason "Create an HTML file with a specific header and a paragraph." 
                tool {
                    tool_name "write_to_file"
                    path "index.html"
                    content "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n    <p>This is a sample paragraph.</p>\n</body>\n</html>" 
                 }
            }
            response "Success"
         }
         { 
            tool_request { 
                reason "Verify if the HTML file creation was successful." 
                tool {
                    tool_name "ask_followup_question"
                    message "The HTML file with the specified header and paragraph has been created successfully. Would you like to see the file, or do you need any additional modifications?" 
                 }
            }
            response "No, I don't need any additional modifications."
         }
         ]
            
    }
  }

}




