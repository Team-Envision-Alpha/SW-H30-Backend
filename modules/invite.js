const { gql } = require("apollo-server-express");
const { UserInputError } = require("apollo-server-core");
const uuid = require("uuid");
const { dbClient } = require("../db");
const { isAuthenticated } = require("../validators/auth");

const typeDefs = gql`
    input InviteInput {
        eventId:ID!
        userId: ID
        email: String!
        name: String!
        phone: String!
    }
    type InvitedUser {
        userid: ID
        email: String!
        name: String!
        phone: String!
    }
    # invite user Queries 
    extend type Query {
        getAllInvitedUsers(eventId:ID!) : [InvitedUser]
    }
    # invite user Mutations 
    extend type Mutation{
        inviteUser(inviteInput:[InviteInput]) : String!
    }
`;

const resolvers = {
  Query: {
      async getAllInvitedUsers(_,{eventId},context){
        try{
            await isAuthenticated(context)
            if(!eventId) throw new UserInputError('Missing Event ID!')
            const query = 'select * from aicte.invited_users where eventId = ? allow filtering'
            const users = await dbClient.execute(query,[eventId])
            return users.rows
        }catch(err){
            throw new Error(err)
        }
      }
  },
  Mutation: {
      async inviteUser(_,{inviteInput},context){
        try{
            await isAuthenticated(context)
            let queries = []
            queries = await inviteInput.map(({eventId,userId,name,email,phone})=>{
                return {
                    query:"insert into aicte.invited_users (eventId,userId,name,email,phone) values (?,?,?,?,?)",
                    params:[eventId,userId,name,email,phone]
                }
            })
            await dbClient.batch(queries)
            return "Invited "
        }catch(err){
            throw new Error(err)
        }
      }
  },
};
module.exports = { typeDefs, resolvers };
