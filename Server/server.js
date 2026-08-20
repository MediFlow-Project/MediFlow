const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const http = require("http");
const app = require("./app");
const { initSocket } = require("./sockets");

const port = process.env.PORT || 3000;
const server = http.createServer(app);

initSocket(server);

server.listen(port, () => {
  console.log(`MediFlow API listening on http://localhost:${port}`);
});
