// src/middlewares/responseWrapper.js
function responseWrapper(req, res, next) {
  // success: data can be object or array
  res.success = function (data = null, meta = {}) {
    return res.status(200).json({ data, meta });
  };

  // created: shortcut when creating resources
  res.created = function (data = null, meta = {}) {
    return res.status(201).json({ data, meta });
  };

  // error: code = machine-friendly string, message = human-friendly, details optional, status = http status
  res.failure = function (code = "ERROR", message = "An error occurred", details = null, status = 400) {
    return res.status(status).json({
      error: { code, message, details: details || undefined }
    });
  };

  // convenience for sending not-found
  res.notFound = function (message = "Not found", details = null) {
    return res.failure("NOT_FOUND", message, details, 404);
  };

  // convenience for sending server error
  res.serverError = function (message = "Internal Server Error", details = null) {
    return res.failure("INTERNAL_ERROR", message, details, 500);
  };

  next();
}

module.exports = responseWrapper;
