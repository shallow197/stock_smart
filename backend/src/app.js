const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { authRouter } = require("./routes/auth");
const { productsRouter } = require("./routes/products");
const { clientsRouter } = require("./routes/clients");
const { logsRouter } = require("./routes/logs");
const { dashboardRouter } = require("./routes/dashboard");
const { settingsRouter } = require("./routes/settings");

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  const uploadDir = process.env.UPLOAD_DIR || "uploads";
  app.use("/uploads", express.static(path.resolve(uploadDir)));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/clients", clientsRouter);
  app.use("/api/logs", logsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/settings", settingsRouter);

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.statusCode || 500;
    if (status >= 500) {
      // éviter de divulguer trop d'infos en prod
      return res.status(status).json({ message: "Erreur serveur." });
    }
    return res.status(status).json({ message: err.message || "Erreur." });
  });

  return app;
}

module.exports = { createApp };

