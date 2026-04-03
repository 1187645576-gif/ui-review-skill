#!/usr/bin/env node

const args = process.argv.slice(2);

if (args[0] === "serve") {
  const port = args.includes("--port") ? Number(args[args.indexOf("--port") + 1]) : undefined;
  require("./server").startServer(port);
} else {
  require("./cli").runCli(args);
}
