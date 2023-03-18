import { AuthenticationError, gql, UserInputError } from "apollo-server";
import { ApolloServer } from "apollo-server";
import bcrypt from 'bcrypt';
import User from './models/user.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import './db.js';


const jwtSign = process.env.JWT_SECRET;

const typeDefinitions = gql`
  type User {
    username: String!
    password: String!
    posts: [Post]!
    id: ID!
  }

  type Post {
    title: String!
    description: String!
    time: String!
  }

  type Token {
    value: String!
  }

  type  Query {
    allUser: [User]!
    me: User!
  }

  type Mutation {
    createUser(
      username: String!
      password: String!
    ) : User

    login(
      username: String!
      password: String!
    ) : Token
  
  }
`
const resolvers = {
  Query: {
    allUser: async () => {
      const user = await User.find({});
      return user
    },
    me: (root, args, context) => {
      return context.currentUser;
    }
  },
  Mutation : {
    createUser: async (root, args) => {
      const newUser = new User({...args})
      await newUser.save()
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });
      if (args.password === user.password) {
        const userForToken = {
          username: user.username,
          password: user.password,
          id: user._id 
        }
        return {
          value: jwt.sign(userForToken, jwtSign)
        }       
      } else {
        throw new UserInputError('wrong credentials', { invalidArgs: args.password })
       }
      }
    }
  }


const server = new ApolloServer({
  typeDefs: typeDefinitions,
  resolvers,
  context: async ({ req }) => {
    const auth = req.headers.authorization
    if (!auth) return null
    if (auth && auth.toLowerCase().startsWith('bearer')) {
      const token = auth.substring(7);
      const { id } = jwt.verify(token, jwtSign);
      const currentUser = await User.findById(id).populate('posts')
      return { currentUser }
    }
  }
})

server.listen().then(({ url }) => {
  console.log(`server ready at ${url}`)
})