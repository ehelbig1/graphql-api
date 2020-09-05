import * as cdk from "@aws-cdk/core";

export class AppsyncStack extends cdk.Stack {
  public readonly url: string;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
  }
}
