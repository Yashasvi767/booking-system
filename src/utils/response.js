function success(data, meta = {}) {
  return { data, meta };
}

function failure(code, message, details = null) {
  return {
    error: { code, message, details }
  };
}

module.exports = { success, failure };
