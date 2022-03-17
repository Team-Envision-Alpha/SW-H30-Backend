const cassandra = require("cassandra-driver");
require("dotenv").config();
const dbClient = new cassandra.Client({
  cloud: {
    secureConnectBundle: `${__dirname}/secure-connect-aicte-database.zip`,
  },
  keyspace: "aicte",
  credentials: {
    username: process.env.DB_CLIENT_ID,
    password: process.env.DB_CLIENT_SECRET,
  },
});

async function connectDB() {
  try {
    await dbClient.connect();
    console.log("DB Connected!");

    const userQuery = "create table if not exists aicte.users (id UUID PRIMARY KEY,name text,email text,phone text,role text,password text,department text)"
    
    await dbClient.execute(userQuery,[])
  } catch (err) {
    console.log(err);
  }
  // dbClient.connect(function (err, result) {
  //   if (err) {
  //     console.error(err.message);
  //     console.error("Failed to Connected DB!!");
  //   } else {
  //     console.log("DB Connected!");
  //   }
  // });
}
module.exports = { dbClient, connectDB };