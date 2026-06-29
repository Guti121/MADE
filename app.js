import express, { json } from "express";
import { userRoutes } from "./src/routes/userRoutes.js";
import cookieParser from "cookie-parser";
import { brandRoutes } from "./src/routes/brandRoutes.js";
import { locationRoutes } from "./src/routes/locationRoutes.js";
import { componentRouter } from "./src/routes/components/componentRoutes.js";
import { stockRouter } from "./src/routes/stock/stockRoutes.js";
import { formulaRouter } from "./src/routes/formula/formulaRoutes.js";
import { containerRouter } from "./src/routes/containers/containerRoutes.js";
import { stockContainerRouter } from "./src/routes/containers/stockContainersRoutes.js";
import { saleRouter } from "./src/routes/sales/saleRouters.js";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(json());
app.use(cookieParser());
app.disable("x-powered-by");

app.use("/api/user", userRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/component", componentRouter);
app.use("/api/stock", stockRouter);
app.use("/api/formula", formulaRouter);
app.use("/api/container", containerRouter);
app.use("/api/stock-container", stockContainerRouter);
app.use("/api/sale", saleRouter);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Invalid JSON format",
    });
  }

  console.error(err);

  return res.status(500).json({
    error: "Internal server error",
  });
});
const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`);
});
