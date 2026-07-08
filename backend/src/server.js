require("dotenv").config();

const { createApp } = require("./app");

const port = Number(process.env.PORT || 4000);
const app = createApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API démarrée sur http://localhost:${port}`);
});

