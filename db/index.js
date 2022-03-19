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
    const eventQuery = "create table if not exists aicte.events (id UUID PRIMARY KEY,status text,name text,caption text,description text,venue UUID,organiser UUID,fromdate text,todate text,time text,image text)"
    const venueQuery = "create table if not exists aicte.venues (id UUID PRIMARY KEY,name text,contact text,state text,city text,pincode text,staffcount text,capacity text)"
    const venueAvailibility = "create table if not exists aicte.venue_availibility (venueID UUID PRIMARY KEY,eventID UUID,fromdate text,todate text,time text)"
    const inviteQuery = "create table if not exists aicte.invited_users (email text PRIMARY KEY,name text,phone text,eventId UUID)"
    // const chatType = "create type if not exists aicte.chat_type (id UUID,name text,role text,message text)"
    const chatQuery = "create table if not exists aicte.chats_table (chatId UUID PRIMARY KEY,userId UUID,name text,email text,role text,message text)"
    
    await dbClient.execute(userQuery,[])
    await dbClient.execute(eventQuery,[])
    await dbClient.execute(venueQuery,[])
    await dbClient.execute(venueAvailibility,[])
    await dbClient.execute(inviteQuery,[])
    await dbClient.execute(chatQuery,[])
    // await dbClient.execute(chatType,[])

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