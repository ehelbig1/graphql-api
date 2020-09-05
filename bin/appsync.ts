#!/usr/bin/env node
import { App, Aws } from "@aws-cdk/core";
import { Pipeline } from "../lib/pipeline-stack";

const app = new App();

new Pipeline(app, "Pipeline", {
  env: { account: Aws.ACCOUNT_ID, region: Aws.REGION },
});

app.synth();
