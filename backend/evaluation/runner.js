#!/usr/bin/env node

const { runEvaluation } = require('../src/evaluation/runner');

runEvaluation()
  .then((output) => {
    console.log(JSON.stringify(output.summary, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

