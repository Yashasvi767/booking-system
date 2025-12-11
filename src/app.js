const express = require("express");
const responseWrapper = require("./middlewares/responseWrapper");
const app = express();


app.use(express.json());
app.use(responseWrapper);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const adminRoutes = require("./routes/adminRoutes");
const slotRoutes = require("./routes/slotRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
// Health check endpoint

app.use("/api/admin", adminRoutes); // gives /api/admin/slots
app.use("/api", slotRoutes);        // gives /api/slots
app.use("/api", bookingRoutes);

const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);



module.exports = app;
