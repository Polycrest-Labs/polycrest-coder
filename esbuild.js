const esbuild = require("esbuild");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function main() {
	// Build context for extension
	const extensionContext = await esbuild.context({
		entryPoints: ['src/extension.ts'],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outdir: 'dist',
		external: ['vscode'], // keep vscode external for extension
		logLevel: 'silent',
		plugins: [
			// ...existing plugins...
			esbuildProblemMatcherPlugin,
		],
		loader: { '.node': 'copy' }
	});
	// Build context for CLI (alias "vscode" to stub)
	const cliContext = await esbuild.context({
		entryPoints: ['src/cli.ts'],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outdir: 'dist',
		// Removed external: ['vscode'] to bundle using our stub
		logLevel: 'silent',
		plugins: [
			// ...existing plugins...
			esbuildProblemMatcherPlugin,
			{
				name: 'vscode-alias',
				setup(build) {
					build.onResolve({ filter: /^vscode$/ }, args => ({
						path: require.resolve('./src/vscode-stub.js')
					}));
				}
			},
		],
		loader: { '.node': 'copy' }
	});
	if (watch) {
		await Promise.all([extensionContext.watch(), cliContext.watch()]);
	} else {
		await Promise.all([extensionContext.rebuild(), cliContext.rebuild()]);
		await Promise.all([extensionContext.dispose(), cliContext.dispose()]);
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
