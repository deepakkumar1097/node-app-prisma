const { PrismaClient } = require("@prisma/client");
const http = require("http");
const fs = require("fs");

const port = 3000;

const prisma = new PrismaClient();

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    fs.readFile("index.html", "utf-8", (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end("Internal server Error");
        console.error(err); // Log the error
        return;
      }
      res.setHeader("Content-Type", "text/html");
      res.statusCode = 200;
      res.end(data);
    });
  } else if (req.method === "POST" && req.url === "/postdata") {
    let body = [];

    req.on("data", (chunk) => {
      body.push(chunk);
      console.log(body);
    });

    req.on("end", async () => {
      try {
        const postData = JSON.parse(body);

        // Create a new Post record using Prisma
        const post = await prisma.post.create({
          data: {
            email: postData.email,
            name: postData.name,
          },
        });

        res.setHeader("Content-Type", "application/json");
        res.statusCode = 201; // Created
        res.end(
          JSON.stringify({
            message:
              "Data received successfully and inserted into the database",
            data: post,
          })
        );
      } catch (error) {
        console.error("Error creating post:", error); // Log the error
        res.statusCode = 400; // Bad Request
        res.end("Error creating post");
      }
    });
  } else if (req.method === "GET" && req.url === "/getdata") {
    try {
      const dataFromDB = await prisma.post.findMany();
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 201;
      res.end(JSON.stringify(dataFromDB));
    } catch (err) {
      console.error("Error creating post:", err); // Log the error
      res.statusCode = 400; // Bad Request
      res.end("Error creating post");
    }
  } else if (req.method === "GET" && req.url.startsWith("/getdatabyid/")) {
    const id = req.url.replace("/getdatabyid/", ""); // Extract the ID from the URL

    try {
      const dataById = await prisma.post.findUnique({
        where: { id: parseInt(id) },
      }); // Replace 'data' with your Prisma model name

      if (dataById) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(dataById));
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Data not found");
      }
    } catch (error) {
      console.error(error);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Error: Could not retrieve data from the database");
    }
  } else {
    res.statusCode = 404;
    res.end("Not Found");
  }
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
