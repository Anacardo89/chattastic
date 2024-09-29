
// Load the HTTP module to create an HTTP server
const http = require('http');

// Configure the HTTP server to respond with "Hello, World!" to all requests
const hostname = '127.0.0.1'; // Localhost
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200; // Set the response status to 200 (OK)
  res.setHeader('Content-Type', 'text/plain'); // Set the content type to plain text
  res.end('Hello, World!\n'); // Send the response
});

// Start the server and listen on the specified hostname and port
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});