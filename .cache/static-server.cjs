const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const types = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".map": "application/json; charset=utf-8",
};

http
	.createServer((req, res) => {
		const url = new URL(req.url, "http://127.0.0.1");
		const pathname = url.pathname === "/" ? "/test/index.html" : url.pathname;
		const file = path.resolve(root, pathname.slice(1));
		if (!file.startsWith(root)) {
			res.writeHead(403);
			res.end("Forbidden");
			return;
		}
		fs.readFile(file, (error, data) => {
			if (error) {
				res.writeHead(404);
				res.end("Not found");
				return;
			}
			res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
			res.end(data);
		});
	})
	.listen(4173, "127.0.0.1");
