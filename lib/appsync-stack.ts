import { Stack, StackProps, Construct, RemovalPolicy } from "@aws-cdk/core";
import { Role, ServicePrincipal, ManagedPolicy } from "@aws-cdk/aws-iam";
import {
  CfnGraphQLApi,
  AuthorizationType,
  CfnApiKey,
  CfnGraphQLSchema,
  CfnDataSource,
  CfnResolver,
} from "@aws-cdk/aws-appsync";
import {
  Table,
  AttributeType,
  BillingMode,
  StreamViewType,
} from "@aws-cdk/aws-dynamodb";

export class AppsyncStack extends Stack {
  public readonly url: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const tableName = "items";

    const itemsGraphQLApi = new CfnGraphQLApi(this, "itemsApi", {
      name: "items-api",
      authenticationType: AuthorizationType.API_KEY,
    });

    new CfnApiKey(this, "apiKey", {
      apiId: itemsGraphQLApi.attrApiId,
    });

    const apiSchema = new CfnGraphQLSchema(this, "itemsSchema", {
      apiId: itemsGraphQLApi.attrApiId,
      definition: `type ${tableName} {
        ${tableName}Id: ID!
        name: String
      }
      type Query {
        all(): ${tableName}
      }
      type Mutation {
        save(name: String!): ${tableName}
        delete(${tableName}Id: ID!): ${tableName}
      }
      type Schema {
        query: Query
        mutation: Mutation
      }`,
    });

    const itemsTable = new Table(this, "itemsTable", {
      tableName,
      partitionKey: {
        name: `${tableName}Id`,
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const itemsTableRole = new Role(this, "itemsDynamoDBRole", {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
    });

    itemsTableRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );

    const datasource = new CfnDataSource(this, "itemsDataSource", {
      apiId: itemsGraphQLApi.attrApiId,
      name: "itemsDynamoDataSource",
      type: "AMAZON_DYNAMODB",
      dynamoDbConfig: {
        tableName: itemsTable.tableName,
        awsRegion: this.region,
      },
      serviceRoleArn: itemsTableRole.roleArn,
    });

    const getAllResolver = new CfnResolver(this, "getAllQueryResolver", {
      apiId: itemsGraphQLApi.attrApiId,
      typeName: "Query",
      fieldName: "all",
      dataSourceName: datasource.name,
      requestMappingTemplate: `{
        "version": "2017-02-28",
        "operation": "Scan"
      }`,
      responseMappingTemplate: `$util.toJson($ctx.result)`,
    });
    getAllResolver.addDependsOn(apiSchema);

    const saveResolver = new CfnResolver(this, "SaveMutationResolver", {
      apiId: itemsGraphQLApi.attrApiId,
      typeName: "Mutation",
      fieldName: "save",
      dataSourceName: datasource.name,
      requestMappingTemplate: `{
        "version": "2017-02-28",
        "operation": "PutItem",
        "key": {
          "${tableName}Id": { "S": "$util.autoId()" }
        },
        "attributeValues": {
          "name": $util.dynamodb.toDynamoDBJson($ctx.args.name)
        }
      }`,
      responseMappingTemplate: `$util.toJson($ctx.result)`,
    });
    saveResolver.addDependsOn(apiSchema);

    const deleteResolver = new CfnResolver(this, "DeleteMutationResolver", {
      apiId: itemsGraphQLApi.attrApiId,
      typeName: "Mutation",
      fieldName: "delete",
      dataSourceName: datasource.name,
      requestMappingTemplate: `{
        "version": "2017-02-28",
        "operation": "DeleteItem",
        "key": {
          "${tableName}Id": $util.dynamodb.toDynamoDBJson($ctx.args.${tableName}Id)
        }
      }`,
      responseMappingTemplate: `$util.toJson($ctx.result)`,
    });
    deleteResolver.addDependsOn(apiSchema);
  }
}
