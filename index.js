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

  type like {
    user: String
  }

  type Post {
    id: ID!
    title: String
    description: String
    comments: [comment]
    likes: [like]
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

    addLikePost(
      id: ID!
      user: String
    ) : like
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
        return await User.findOneAndUpdate({ 'posts._id': args.id },
        { $push: { 'posts.$.comments': { message: args.message, user: currentUser.username } } },
        { new: true })
      },
      addLikePost: async (root, args, context) => {
        const { currentUser } = context;
        const post = await User.findOne({'posts._id': args.id}, { 'posts.$': 1 });
        const likes = post.posts[0].likes;
        const validationUserLike = likes[0]?.user?.includes(currentUser.username);
        console.log(validationUserLike);
        if (validationUserLike)  AuthenticationError('You can give one like per account');     
        return await User.findOneAndUpdate( {'posts._id': args.id},
          { $push: {'posts.$.likes': { user: currentUser.username } } },
        )
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