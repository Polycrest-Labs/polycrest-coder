import path from "path";
import { ExecutionContext } from "./ExecutionContext";
import { Tool } from "./Tool";
import { ListFiles, ToolRequest } from "../../baml_client/types";
import { listFiles } from "../../utils/listFiles";
import { getReadablePath } from "../../utils/path";
import { ChatRequestBundle } from "../chatWorkflow";
import { UserInteractionRequest } from "./UserInteractionRequest";

export class ListFilesTool implements Tool {
   constructor(
		public toolRequest: ToolRequest,
		private environment: ExecutionContext,
	) {
    }
	get params(): ListFiles {
		return this.toolRequest.tool as ListFiles;
	}
	results: [string[], boolean] | undefined;
	didApprove: boolean | undefined;
	error: string | any;
	async *run(): AsyncGenerator<UserInteractionRequest, boolean, ChatRequestBundle> {
		// Implementation of listing files in
		const relDirPath: string | undefined = this.params.path;
		const recursive = this.params.recursive;
		if (!relDirPath) {
			this.error = "No path provided";
			return true;
		}
		try {
			const absolutePath = path.resolve(this.environment.cwd, relDirPath);
			const [files, didHitLimit] = await listFiles(absolutePath, recursive, 200);
            this.results = [files, didHitLimit];
		
            return true;
		} catch (error) {
			this.error = error;
            return true;
		}
	}
	getLLMResponse(): string {
		if (this.error) {
			return this.error.toString();
		} else if (this.results) {
			return ListFilesTool.formatFilesList(
				path.resolve(this.environment.cwd, this.params.path),// getReadablePath(this.environment.cwd, this.params.path),
				this.results[0],
				this.results[1],
			);
		} else {
			return "No results found";
		}
	}
	static formatFilesList(absolutePath: string, files: string[], didHitLimit: boolean): string {
		const sorted = files
			.map((file) => {
				// convert absolute path to relative path
				const relativePath = path.relative(absolutePath, file).toPosix();
				return file.endsWith("/") ? relativePath + "/" : relativePath;
			})
			// Sort so files are listed under their respective directories to make it clear what files are children of what directories. Since we build file list top down, even if file list is truncated it will show directories that cline can then explore further.
			.sort((a, b) => {
				const aParts = a.split("/"); // only works if we use toPosix first
				const bParts = b.split("/");
				for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
					if (aParts[i] !== bParts[i]) {
						// If one is a directory and the other isn't at this level, sort the directory first
						if (i + 1 === aParts.length && i + 1 < bParts.length) {
							return -1;
						}
						if (i + 1 === bParts.length && i + 1 < aParts.length) {
							return 1;
						}
						// Otherwise, sort alphabetically
						return aParts[i].localeCompare(bParts[i], undefined, { numeric: true, sensitivity: "base" });
					}
				}
				// If all parts are the same up to the length of the shorter path,
				// the shorter one comes first
				return aParts.length - bParts.length;
			});
		if (didHitLimit) {
			return `${sorted.join(
				"\n",
			)}\n\n(File list truncated. Use list_files on specific subdirectories if you need to explore further.)`;
		} else if (sorted.length === 0 || (sorted.length === 1 && sorted[0] === "")) {
			return "No files found.";
		} else {
			return sorted.join("\n");
		}
	}
}
