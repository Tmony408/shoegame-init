// Not Found Middleware
const notFound = (req, res, next) => {
  const error = new Error(`Not Found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.log(err.stack)
  return res.status(statusCode).json({
    success: false,
    error: err?.message
    // stack: err?.stack
  });
};

module.exports = { notFound, errorHandler };
