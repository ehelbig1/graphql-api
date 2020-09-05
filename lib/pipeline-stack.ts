import { Artifact } from "@aws-cdk/aws-codepipeline";
import { GitHubSourceAction } from "@aws-cdk/aws-codepipeline-actions";
import { Stack, Construct, StackProps, SecretValue } from "@aws-cdk/core";
import { CdkPipeline } from "@aws-cdk/pipelines";

export class Pipeline extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sourceArtifact = new Artifact();
    const cloudAssemblyArtifact = new Artifact();

    const pipeline = new CdkPipeline(this, "pipeline", {
      pipelineName: "GraphQLAPIPipeline",
      cloudAssemblyArtifact,

      sourceAction: new GitHubSourceAction({
        actionName: "GitHub",
        output: sourceArtifact,
        oauthToken: SecretValue.secretsManager("github-token"),
        owner: "ehelbig1",
        repo: "graphql-api",
      }),
    });
  }
}
