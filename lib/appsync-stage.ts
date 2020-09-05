import { Stage, Construct, StageProps } from "@aws-cdk/core";
import { AppsyncStack } from "./appsync-stack";

export class AppsyncStage extends Stage {
  public readonly url: string;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const api = new AppsyncStack(this, "API");

    this.url = api.url;
  }
}
