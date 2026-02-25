import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

import { env } from '../app.env';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: false,
      typePaths: ['./schema.graphql'],
      debug: env.GRAPHQL_DEBUG,
      introspection: env.GRAPHQL_INTROSPECTION,
      playground: env.GRAPHQL_PLAYGROUND,
      path: env.GRAPHQL_PATH,
      sortSchema: true,
      csrfPrevention: false,
      context: ({ req }) => ({ req }),
    }),
  ],
})
export class GraphqlConfigModule {}
