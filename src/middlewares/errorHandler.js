// src/middlewares/errorHandler.js
const isProd = process.env.NODE_ENV === "production";

function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;

  // Normalize error fields
  const code = err.code || err.name || "INTERNAL_ERROR";
  const message = err.expose
    ? err.message
    : (status < 500 ? err.message : "Internal Server Error");

  // Logging (clean separation: verbose in dev, minimal in prod)
  if (!isProd) {
    console.error("Error:", {
      message: err.message,
      stack: err.stack,
      code,
      status,
      details: err.details || null,
    });
  } else {
    console.error(`Error: ${code} ${err.message}`);
  }

  // Clean JSON response
  return res.status(status).json({
    error: {
      code,
      message,
      details: err.details || undefined,
    }
  });
}

module.exports = errorHandler;

