const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  const token       = core.getInput('token', { required: true });
  const rawList     = core.getInput('workflows', { required: true });
  const interval    = parseInt(core.getInput('poll-interval'), 10);

  // split on commas or newlines, trim, drop empties
  const workflows = rawList
    .split(/[\r\n,]+/)
    .map(w => w.trim())
    .filter(Boolean);

  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;

  for (const wf of workflows) {
    // 1) grab the *latest* run for this workflow (file name or ID) 
    const { data: runs } = await octokit.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: wf,
      per_page: 1
    });

    const run = runs.workflow_runs[0];
    if (!run) {
      core.info(`${wf}: no prior runs found, skipping`);
      continue;
    }

    core.info(`${wf}: awaiting run #${run.id} (status=${run.status})`);
    // 2) poll that exact run until it finishes
    let status = run.status;
    while (['queued', 'in_progress'].includes(status)) {
      await new Promise(res => setTimeout(res, interval));
      const { data: updated } = await octokit.rest.actions.getWorkflowRun({
        owner,
        repo,
        run_id: run.id
      });
      status = updated.status;
      core.info(`${wf} run #${run.id} is still ${status}`);
    }

    core.info(`${wf} run #${run.id} completed ⇒ conclusion=${run.conclusion}`);
  }
}

run().catch(err => core.setFailed(err.message));
