/**
 * Express middleware to handle 404 (Not Found) routes.
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: `Not Found - ${req.originalUrl}`
  });
}

module.exports = notFoundHandler;
