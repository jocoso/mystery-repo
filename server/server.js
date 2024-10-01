const cors = require("cors");
const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const path = require("path");
const { typeDefs, resolvers } = require("./schemas");
const { connection } = require("./config/connection");
const { authMiddleware } = require("./utils/auth");
const Librarian = require("./utils/librarian");
require("dotenv").config();

const PORT = process.env.PORT || 3001;
const app = express();

// MongoDB connection setup with retry mechanism
const connectWithRetry = () => {
    console.log("Attempting to connect to MongoDB...");
    return connection.once("open", startServer);
};

connection.on("error", (error) => {
    console.error("MongoDB Connection error:", error);
    console.log("Retrying connection in 5 seconds...");
    setTimeout(connectWithRetry, 5000);
};

// CORS configuration to allow requests from frontend
app.use(
  cors({
    origin: [
      "https://book-club-1.onrender.com", // Frontend domain
      "https://book-club-8svz.onrender.com", // Frontend domain
      "http://localhost:5173", // Local development URL (if testing locally)
    ],
    methods: ["GET", "POST", "OPTIONS"], // Allow necessary methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow necessary headers
    credentials: true, // Allow cookies/credentials
  })
);

// Middleware for parsing JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API Route for fetching book data
app.get("/api/bookdata/:endpoint", async (req, res) => {
    const librarian = new Librarian(process.env.GOOGLE_BOOKS_API_URL);
    try {
        const data = await librarian.retrieve(req.params.endpoint);
        if (!data) return res.status(404).json({ message: "Book not found" });
        res.status(200).json(data);
    } catch (err) {
        console.error("Error fetching book data:", err);
        res.status(500).json({
            message: "Failed to fetch book data",
            error: err.message,
        });
    }
});

// Serve static files in production (for Vite)
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../client/dist")));
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    });
}

// Start Apollo Server and Express App
const startServer = async () => {
    try {
        const server = new ApolloServer({
            typeDefs,
            resolvers,
            introspection: true, // Enable introspection
        });

        await server.start();

        // Apply Apollo middleware with authentication
        app.use(
            "/graphql",
            expressMiddleware(server, {
                context: async ({ req }) => authMiddleware({ req }),
            })
        );

        console.log("🚀 Apollo Server running at /graphql");
    } catch (error) {
        console.error("Error starting Apollo Server:", error);
    }

    // Start Express server
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🌍 API server running on http://localhost:${PORT}!`);
        console.log(`🚀 Use GraphQL at http://localhost:${PORT}/graphql`);
    });
};

// Connect to MongoDB and start the server
connectWithRetry();
