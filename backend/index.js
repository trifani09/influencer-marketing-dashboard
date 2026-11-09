import { createApiServer } from "./app.js";

const port = Number(process.env.PORT || 3001);
const server = createApiServer();
server.listen(port, () =>
  console.log(`Profile API listening on http://localhost:${port}`),
);
