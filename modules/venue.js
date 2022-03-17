const { gql } = require("apollo-server-express");
const { UserInputError } = require('apollo-server-core')
const uuid = require('uuid');
const { dbClient } = require("../db");
const { isAuthenticated } = require("../validators/auth");

const typeDefs = gql`
  # venue typeDefs 
  input VenueInput {
    name: String!
    contact: String!
    state: String!
    city: String!
    pincode: String!
    staffcount: String!
    capacity: String!
  }
  type Venue {
    id: ID!
    name: String!
    contact: String!
    state: String!
    city: String!
    pincode: String!
    staffcount: String!
    capacity: String!
  }
  type BookVenue {
    venueID: ID!
    eventID: ID!
    datetime: String!
  }
  # venue Queries 
  extend type Query {
    getAllVenues: [Venue]
    getVenue(id:ID!): Venue!
  }
  # venue Mutations 
  extend type Mutation{
    addVenue(venueInput:VenueInput): Venue!
    updateVenue(id:ID!,VenueInput:VenueInput): Venue!
    deleteVenue(id:ID!): String!
    bookVenue(venueID:ID!,eventID:ID!,datetime:String!): BookVenue!
  }
`

const resolvers = {
    Query:{
        async getAllVenues(_,args,context){
            try{
                await isAuthenticated(context)
                const query = 'select * from aicte.venues'
                const result = await dbClient.execute(query,[])
                return result.rows
            }catch(err){
                throw new Error(err)
            }
        },
        async getVenue(_,{id},context){
            try{
                await isAuthenticated(context)
                const query = 'select * from aicte.venues where id = ?'
                const event = (await dbClient.execute(query,[id])).rows[0]
                return event
            }catch(err){
                throw new Error(err)
            }
        },
    },
    Mutation:{
        async addVenue(_,{venueInput:{name,contact,state,city,pincode,staffcount,capacity}},context){
            try{
                await isAuthenticated(context);
                if (!(name && contact && state && city && pincode && staffcount && capacity)) {
                  throw new UserInputError("Missing Fields!");
                }
                const id = uuid.v4()
                const query = "insert into aicte.venues (id,name,contact,state,city,pincode,staffcount,capacity) values (?,?,?,?,?,?,?,?)"
                await dbClient.execute(query,[id,name,contact,state,city,pincode,staffcount,capacity])
                return {id,name,contact,state,city,pincode,staffcount,capacity}
            }catch(err){
                throw new Error(err)
            }
        },
        async updateVenue(_,{id,venueInput:{name,contact,state,city,pincode,staffcount,capacity}},context){
            try{
                await isAuthenticated(context)
                if(!(id && name && contact && state && city && pincode && staffcount && capacity)){
                    throw new UserInputError("Missing Fields!")
                }
                const query = "update aicte.venues set name = ?, contact = ?, state = ?, city = ?, pincode = ?, staffcount = ?, capacity = ? where id = ?"
                await dbClient.execute(query,[name,contact,state,city,pincode,staffcount,capacity,id])
                return {id,name,contact,state,city,pincode,staffcount,capacity}
            }catch(err){
                throw new Error(err)
            }
        },
        async deleteVenue(_,{id},context){
            try{
                await isAuthenticated(context)
                if(!id){
                    throw new UserInputError("Missing Venue ID!")
                }
                const query = "delete from aicte.venues where id = ?"
                await dbClient.execute(query,[id])
                return "Event Deleted Successfully!"
            }catch(err){
                throw new Error(err)
            }
        },
        async bookVenue(_,{venueID,eventID,datetime},context){
            try{
                await isAuthenticated(context)
                if(!(venueID,eventID,datetime)){
                    throw new UserInputError("Missing Fields!")
                }
                const query = "insert into aicte.venue_availibility (venueID,eventID,datetime) values (?,?,?)"
                await dbClient.execute(query,[venueID,eventID,datetime])
                return {venueID,eventID,datetime}
            }catch(err){
                throw new Error(err)
            }
        }
    }
}
module.exports = {typeDefs,resolvers}