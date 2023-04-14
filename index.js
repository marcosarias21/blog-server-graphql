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

  type comment {
    message: String!
    user: String
  }
  type Post {
    title: String
    description: String
    comments: [comment]
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
    
    createPost(
      title: String
      description: String
      ) : Post!
    
    createComment(
      id: ID!
      message: String!
    ) : comment
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
      try {
        return await newUser.save()        
      } catch (error) {
        UserInputError(error)
      }
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
      },
      createPost: async (root, args, context) => {
        console.log(args.description)
        const { currentUser } = context;
        console.log(currentUser.posts);
        if (!currentUser) AuthenticationError('You need to be logged in')
        return await User.findByIdAndUpdate(currentUser._id, {
          $push: {
            posts: { description: args.description, title: args.title },
          },
        })
      },
      createComment: async (root, args, context) => {
        console.log(args);
        const { currentUser } = context;
        if (!currentUser) AuthenticationError('You need to be logged in')
        return await User.findByIdAndUpdate(args.id, {
          $push: {
            posts: { comments: { message: args.message, user: currentUser.username }  },
          },
        })
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