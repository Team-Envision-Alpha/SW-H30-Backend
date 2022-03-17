const { gql } = require("apollo-server-express");
const { UserInputError } = require('apollo-server-core')
const uuid = require('uuid');
const { dbClient } = require("../db");
const { isAuthenticated } = require("../validators/auth");
const { uploadImage, deleteImage } = require("../utils/image");

const typeDefs = gql`
  # events typeDefs 
  input EventInput {
    name: String!
    description: String!
    venue: ID!
    organiser: String!
    caption: String!
    datetime: String!
    image: String!
  }
  type Event {
    id: ID!
    name: String!
    description: String!
    venue: ID!
    organiser: String!
    caption: String!
    datetime: String!
    image:String!
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
        async createEvent(_,{eventInput:{name,description,venue,organiser,caption,datetime,image}},context){
            try{
                await isAuthenticated(context)
                if(!(name && description && venue && organiser && caption && datetime && image)){
                    throw new UserInputError("Missing Fields!")
                }
                const id = uuid.v4()
                const image_url = await uploadImage(image,id)
                const query = "insert into aicte.events (id,name,description,venue,organiser,caption,datetime,image) values (?,?,?,?,?,?,?,?)"
                await dbClient.execute(query,[id,name,description,venue,organiser,caption,datetime,image_url])
                return {id,name,description,venue,organiser,caption,datetime,image:image_url}
            }catch(err){
                throw new Error(err)
            }
        },
        async updateEvent(_,{id,eventInput:{name,description,venue,organiser,caption,datetime,image}},context){
            try{
                await isAuthenticated(context)
                if(!(id && name && description && venue && organiser && caption && datetime && image)){
                    throw new UserInputError("Missing Fields!")
                }
                if(!image.includes(id)){
                    await deleteImage(id)
                    image = await uploadImage(image,id)
                }
                const query = "update aicte.events set name = ?, description = ?, venue = ?, organiser=? caption = ?, datetime = ? where id = ?"
                await dbClient.execute(query,[name,description,venue,organiser,caption,datetime,id])
                return {id,name,description,venue,organiser}
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