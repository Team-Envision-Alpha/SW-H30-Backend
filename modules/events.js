const { gql } = require("apollo-server-express");
const { UserInputError } = require('apollo-server-core')
const uuid = require('uuid');
const { dbClient } = require("../db");
const { isAuthenticated } = require("../validators/auth");
const { uploadImage, deleteImage } = require("../utils/image");

const typeDefs = gql`
  # events typeDefs 
  input InvitedUserInput {
    email: String!
    name: String!
    phone: String!
}
  type InvitedUser {
    email: String!
    name: String!
    phone: String!
}
  input EventInput {
    name: String!
    description: String!
    venue: ID!
    organiser: ID!
    caption: String!
    fromdate: String!
    todate: String!
    time: String!
    image: String!
    departmentInvited:[String]
    usersInvited:[InvitedUserInput]
    status:String!
  }
  type Event {
    id: ID!
    name: String!
    description: String!
    venue: ID!
    organiser: ID!
    caption: String!
    datetime: String!
    image:String!
    status:String!
    fromdate: String!
    todate: String!
    time: String!
  }
  # event Queries 
  extend type Query {
    getAllEvents: [Event]
    getEvent(id:ID!): Event!
  }
  # event Mutations 
  extend type Mutation{
    createEvent(eventInput:EventInput): Event!
    updateEvent(id:ID!,eventInput:EventInput): Event!
    deleteEvent(id:ID!): String!
  }
`

const resolvers = {
    Query:{
        async getAllEvents(_,args,context){
            try{
                await isAuthenticated(context)
                const query = 'select * from aicte.events'
                const events = (await dbClient.execute(query,[])).rows
                return events
            }catch(err){
                throw new Error(err)
            }
        },
        async getEvent(_,{id},context){
            try{
                await isAuthenticated(context)
                const query = 'select * from aicte.events where id = ?'
                const event = (await dbClient.execute(query,[id])).rows[0]
                return event
            }catch(err){
                throw new Error(err)
            }
        },
    },
    Mutation:{
        async createEvent(_,{eventInput:{name,description,venue,organiser,caption,fromdate,todate,time,image,status,usersInvited,departmentInvited}},context){
            try{
                // await isAuthenticated(context)
                if(!(name && description && venue && organiser && caption && fromdate && todate && image && status)){
                    throw new UserInputError("Missing Fields!")
                }
                console.log(name)
                const id = uuid.v4()
                const image_url = await uploadImage(image,id)
                const query = "insert into aicte.events (id,name,description,venue,organiser,caption,fromdate,todate,time,image,status) values (?,?,?,?,?,?,?,?,?,?,?)"
                await dbClient.execute(query,[id,name,description,venue,organiser,caption,fromdate,todate,time,image_url,status])
                let queries = []
                queries = await usersInvited.map(({name,email,phone})=>{
                    return {
                        query:"insert into aicte.invited_users (eventId,name,email,phone) values (?,?,?,?)",
                        params:[id,name,email,phone]
                    }   
                })
                // console.log(queries);
                // let users_by_department = []
                // users_by_department = departmentInvited.map(async departmemt=>{
                //     const q = 'select email,phone,name from aicte.users where department = ? allow filtering'
                //     const users = await dbClient.execute(q,[departmemt])
                //     return users.rows
                // })
                // console.log(users_by_department);
                // await users_by_department.forEach((userArray)=>{
                //     console.log(userArray);
                //     // userArray.forEach(({name,email,phone})=>{
                //     //     queries.push({
                //     //         query:"insert into aicte.invited_users (eventId,name,email,phone) values (?,?,?,?)",
                //     //         params:[id,name,email,phone]
                //     //     })
                //     // })
                // })
                await dbClient.batch(queries)
                return {id,name,description,venue,organiser,caption,fromdate,todate,time,image:image_url}
            }catch(err){
                throw new Error(err)
            }
        },
        async updateEvent(_,{id,eventInput:{name,description,venue,organiser,caption,fromdate,todate,time,image}},context){
            try{
                await isAuthenticated(context)
                if(!(id && name && description && venue && organiser && caption && fromdate && todate && time && image)){
                    throw new UserInputError("Missing Fields!")
                }
                if(!image.includes(id)){
                    await deleteImage(id)
                    image = await uploadImage(image,id)
                }
                const query = "update aicte.events set name = ?, description = ?, venue = ?, organiser=? caption = ?, fromdate = ?,todate = ?, time = ? where id = ?"
                await dbClient.execute(query,[name,description,venue,organiser,caption,fromdate,todate,time,id])
                return {id,name,description,venue,organiser,caption,fromdate,todate,time}
            }catch(err){
                throw new Error(err)
            }
        },
        async deleteEvent(_,{id},context){
            try{
                await isAuthenticated(context)
                if(!id){
                    throw new UserInputError("Missing Event ID!")
                }
                await deleteImage(id)
                const query = "delete from aicte.events where id = ?"
                await dbClient.execute(query,[id])
                return "Event Deleted Successfully!"
            }catch(err){
                throw new Error(err)
            }
        },
    }
}
module.exports = {typeDefs,resolvers}