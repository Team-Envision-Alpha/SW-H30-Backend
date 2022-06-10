const express = require("express");
const cors = require("cors");
const path = require('path')
const { ApolloServer } = require("apollo-server-express");
const {
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("apollo-server-core");
const serverless = require('serverless-http');
const { connectDB } = require("./db");

async function startApolloServer() {
  const server = new ApolloServer({
    modules: [
      require("./modules/users"),
      require("./modules/events"),
      require("./modules/venue"),
      require("./modules/invite"),
      require("./modules/chats"),
    ],
    context: ({ req }) => ({ req }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });
  const app = express();
  await server.start();
  server.applyMiddleware({ app });
  app.use('/uploads',express.static(path.join(__dirname,'uploads')))
  require("dotenv").config();
  app.use(express.urlencoded({ extended : true }));
app.use(express.json());
  app.use(cors({ origin: true }));
  connectDB();
  app.listen({ port: process.env.PORT || 4000 }, () => {
    console.log("Server up");
  });
  return app;
}
// startApolloServer();
// export serverless app for AWS Lambda
module.exports.handler = serverless(startApolloServer);
