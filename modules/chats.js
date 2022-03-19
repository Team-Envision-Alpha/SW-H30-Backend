const { gql } = require("apollo-server-express");
const { dbClient } = require("../db");
const {  isAuthenticated, isTeamHead } = require("../validators/auth");
const { AuthenticationError, UserInputError } = require("apollo-server-core");
const uuid = require('uuid')
const typeDefs = gql`
    # input SingleChatInput {
    #     id:ID
    #     name:String!
    #     role:String!
    #     message:String!
    # }
    # type SingleChat {
    #     id:ID
    #     name:String!
    #     role:String!
    #     message:String!
    # }
    input ChatInput {
        userId:ID!
        name:String!
        email:String!
        role:String!
        message:String!
        # chats:[SingleChatInput]
    }
    type Chats {
        chatId:ID!
        userId:ID!
        name:String!
        email:String!
        role:String!
        message:String!
    }
    type Query {
        getAllChats:[Chats]
        getUserChats(userId:ID!):[Chats]
    }
    type Mutation {
        addChat(chatInput:ChatInput!): Chats
    }
`
const resolvers = {
    Query:{
        async getAllChats(_,args,context){
            try{
                await isTeamHead(context)
                const query = "select * from aicte.chats_table"
                // const query = "select * from aicte.chats_table where userId = ? allow filtering"
                const chats = await dbClient.execute(query,[])
                return chats.rows
            }catch(err){
                throw new Error(err)
            }
        },
        async getUserChats(_,{userId},context){
            try{
                await isTeamHead(context)
                const query = "select * from aicte.chats_table where userId = ? allow filtering"
                const chats = await dbClient.execute(query,[userId])
                return chats.rows
            }catch(err){
                throw new Error(err)
            }
        },
    },
    Mutation:{
        async addChat(_,{chatInput:{userId,name,email,role,message}},context){
            try{
                await isAuthenticated(context)
                // console.log(chats[0].name);
                // let all_chats = []
                // all_chats = chats.map(({id,name,role,message})=>{return {id,name,role,message}})
                // console.log(all_chats);
                const chatId = uuid.v4()
                const query = "insert into aicte.chats_table (chatId,userId,name,email,role,message) values (?,?,?,?,?,?)"
                await dbClient.execute(query,[chatId,userId,name,email,role,message])
                return {userId,name,email,role,message}
            }catch(err){
                throw new Error(err)
            }
        }
    }
}
module.exports = { typeDefs,resolvers}