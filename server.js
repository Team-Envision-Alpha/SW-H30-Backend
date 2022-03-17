const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("apollo-server-express");
const {
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("apollo-server-core");


async function startApolloServer() {
  const server = new ApolloServer({
    modules: [
    ],
    context: ({ req }) => ({ req }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });
  const app = express();
  await server.start();
  server.applyMiddleware({ app });
  require("dotenv").config();
  app.use(cors({ origin: true }));
  
  app.listen({ port: process.env.PORT || 4000 }, () => {
    console.log("Server up");
  });
}

startApolloServer();
