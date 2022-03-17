const { gql } = require("apollo-server-express");
const { dbClient } = require("../db");
const uuid = require('uuid')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const { isAdmin, isAuthenticated } = require("../validators/auth");
const { AuthenticationError, UserInputError } = require("apollo-server-core");

const typeDefs = gql`
  # user type defs 
  input UserInput {
    email: String! 
    phone: String!
    name: String!
    department:String!
    role: String
    password: String!
  }
  type User {
    id: ID
    email: String!
    name: String!
    phone: String!
    role: String
    department:String!
    password: String!
    token: String!
  }
  # user Queries 
  extend type Query {
    getUser: User!
    getAllUsers: [User]
  }
  # user Mutations 
  extend type Mutation{
    registerUser(userInput: UserInput): User! 
    loginUser(email: String!,password: String!) : User!
    updateUser(id:ID!,name:String!,email:String,role:String!,department:String!,phone:String!): User! 
    updateUserPassword(id:ID!): String! 
    deleteUser(id:ID!): String! 
  }
`

const resolvers = {
    Query:{
        // get all users - @access admin
        async getAllUsers(_,args,context){
            try{
                const user = await isAdmin(context)
                // console.log(user);
                const query = 'select * from aicte.users'
                const result = await dbClient.execute(query,[])
                return result.rows
            }catch(err){
                throw new Error(err)
            }
        },
        // get single user - @access authenticated user
        async getUser(_,args,context){
            try{
                const user = await isAuthenticated(context)
                return user
            }catch(err){
                throw new Error(err)
            }
        }
    },
    Mutation:{
        // register user - @access only admin
        async registerUser(_,{userInput:{email,phone,name,password,role,department}},context,info){
            try{
                const user = await isAdmin(context)
                if(user){
                    if(!(email && phone && name && password && role && department)){
                        throw new UserInputError("Missing Fields!")
                    }
                    const findUser = `select * from aicte.users where email = '${email}' allow filtering`
                    const existing_user = await dbClient.execute(findUser,[])
                    if(existing_user.rowLength){
                        throw new Error("User Exists!!")
                    }
                    const id = uuid.v4()
                    password = await bcrypt.hash(password,12)
                    const save_user = `insert into aicte.users (id,name,email,phone,role,password,department) values (?,?,?,?,?,?,?)`
                    await dbClient.execute(save_user,[id,name,email,phone,role,password,department])
                    return {
                        id,name,email,phone,role,department,message:"user registration successfull!"
                    }
                }else{
                    throw new AuthenticationError('unauthorized')
                }
            }catch(err){
                throw new Error(err)
            }
        },
        // user login - @access public
        async loginUser(_,{email,password},context){
            try{
                const findUser = `select * from aicte.users where email = ? allow filtering`
                const user = await dbClient.execute(findUser,[email])
                if(!user.rowLength){
                    throw new Error("User Doesn't Exists!!")
                }
                const verify_password = await bcrypt.compare(password,user.rows[0].password)
                if(!verify_password){
                    throw new Error('Invalid Credentials!')
                }
                const token = jwt.sign({...user.rows[0]},process.env.JWT_SECRET,{expiresIn:"5d"})
                return {...user.rows[0],token}
            }catch(err){
                throw new Error(err)
            }
        },
         // update user data - @access authenticated user
        async updateUser(_,{id,email,phone,name,role,department},context){
            try{
                await isAuthenticated(context)
                if(!(email && phone && name && id && role && department)){
                    throw new UserInputError("Missing Fields!")
                }
                const findUser = `select * from aicte.users where email = ? allow filtering`
                const user = await dbClient.execute(findUser,[email])
                if(!user.rowLength){
                    throw new Error("User Doesn't Exists!!")
                }
                const query = 'update aicte.users set email = ?, phone = ?, name = ?, role = ?, department = ? where id = ?'
                await dbClient.execute(query,[email,phone,name,role,department,id])
                return {id,name,email,phone,role,department}
            }catch(err){
                throw new Error(err)
            } 
        },
         // update user password - @access only admin
        async updateUserPassword(_,{id,password},context){
            try{
                if(!(id && password)){
                    throw new UserInputError("Missing Fields!")
                }
                await isAdmin(context)
                password = await bcrypt.hash(password,12)
                const query = "update aicte.users set password = ?, where id = ?"
                await dbClient.execute(query,[password,id])
                return "Password Updated Successfully!"
            }catch(err){
                throw new Error(err)
            }
        },
         // delete user - @access only admin
        async deleteUser(_,{id},context){
            try{
                if(!id){
                    throw new UserInputError("Missing User ID!")
                }
                await isAuthenticated(context)
                const query = "delete from aicte.users where id = ?"
                await dbClient.execute(query,[id])
                return "User Deleted Successfully!"
            }catch(err){
                throw new Error(err)
            }
        },
    }
}
module.exports = {typeDefs,resolvers}