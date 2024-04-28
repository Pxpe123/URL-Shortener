const os = require("os");
const http = require("http");
const fs = require("fs");

const getPublicIP = async () => {
  const response = await fetch("https://api.ipify.org?format=json");
  const data = await response.json();
  return data.ip;
};

const handleAddRequest = (req, json) => {
  const urlParts = req.url.split("/").slice(2);
  const keyword = urlParts[0];
  let endpoint = urlParts.slice(1).join("/");

  // Check if keyword already exists
  const existingEntry = json.find((entry) => entry.keyword === keyword);
  if (existingEntry) {
    console.log(`Keyword "${keyword}" already exists.`);
    return false;
  }

  console.log("Keyword:", keyword);
  console.log("Endpoint:", endpoint);

  // Check if the endpoint starts with http:// or https://
  if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
    endpoint = "http://" + endpoint; // Append http:// if missing
  }

  // Create new endpoint entry
  const newEndpoint = {
    keyword: keyword,
    url: endpoint,
    connectionCount: 0,
    connections: [],
  };

  // Push new entry to JSON
  json.push(newEndpoint);
  return true;
};

const handleRequest = async (req, res) => {
  const json = JSON.parse(fs.readFileSync("./index.json", "utf8"));

  if (req.url === "/" || req.url === "/favicon.ico") {
    return;
  }

  if (req.url.startsWith("/add")) {
    const added = handleAddRequest(req, json);
    if (!added) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Keyword already exists.");
      return;
    }

    // Write updated JSON to file
    fs.writeFileSync("./index.json", JSON.stringify(json, null, 2), "utf8");

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Created Endpoint.");
    return;
  }

  const keyword = req.url.substr(1);
  const matchingEntry = json.find((entry) => entry.keyword === keyword);

  if (matchingEntry) {
    console.log(`Connection to ${matchingEntry.url}`);

    // Fetch IP location data
    // Code for fetching IP location data...

    const newConnection = {
      pcName: os.hostname(),
      ip: req.connection.remoteAddress,
      timeOfUsage: new Date().toLocaleString(),
      location: {
        // IP location data...
      },
    };

    console.log("New Connection:", newConnection);

    // Update connection count and push new connection
    matchingEntry.connections.push(newConnection);
    matchingEntry.connectionCount += 1;

    // Write updated JSON to file
    fs.writeFileSync("./index.json", JSON.stringify(json, null, 2), "utf8");

    res.writeHead(302, { Location: matchingEntry.url });
    res.end();
  } else {
    console.log(`Keyword "${keyword}" not found.`);
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Keyword not found.");
  }
};

const server = http.createServer(handleRequest);

server.listen(3000, async () => {
  const ip = await getPublicIP();
  console.log(`Server running at http://${ip}:3000/`);
});
