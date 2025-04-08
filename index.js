const app = require("./app");



const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// **Import WebSocket Logic**
const initSocket = require('./socket');
const io = initSocket(server);

// Middleware for handling 404 (Not Found) errors
app.use(notFound);

// Middleware for handling errors
app.use(errorHandler);