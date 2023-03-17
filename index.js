const { gql } = require("apollo-server");
const { ApolloServer } = require("apollo-server-express");

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

  type  Query {
    allUser: [User]!
    me: User
  }

  type Mutation {
    createUser(
      username: String!
      password: String!
      ) : User
    
    createPost(
      title: String!
      description: String!
      time: String!
    )
  }
`

const resolvers = {

}


const server = new ApolloServer({
  typeDefs: typeDefinitions,
  resolvers
})

server.listen().then(({ url }) => {
  console.log(`server ready at ${url}`)
})