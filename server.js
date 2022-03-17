const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("apollo-server-express");
const {
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("apollo-server-core");
const { connectDB } = require("./db");


async function startApolloServer() {
  const server = new ApolloServer({
    modules: [
      require('./modules/users'),
      require('./modules/events')
    ],
    context: ({ req }) => ({ req }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });
  const app = express();
  await server.start();
  server.applyMiddleware({ app });
  require("dotenv").config();
  connectDB()
  app.use(cors({ origin: true }));

  app.listen({ port: process.env.PORT || 4001 }, () => {
    console.log("Server up");
  });
}

startApolloServer();
