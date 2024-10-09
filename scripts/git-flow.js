const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function executeCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function askQuestion(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

const branchTypes = ['feature', 'bugfix', 'hotfix', 'release'];
const commitTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'];

async function createBranch() {
  const branchType = await askQuestion(`Branch type (${branchTypes.join('/')}): `);
  if (!branchTypes.includes(branchType)) {
    console.error('Invalid branch type');
    process.exit(1);
  }

  const branchName = await askQuestion('Branch name: ');
  const fullBranchName = `${branchType}/${branchName}`;

  executeCommand(`git checkout -b ${fullBranchName}`);
  console.log(`Created and switched to branch: ${fullBranchName}`);
}

async function commitChanges() {
  const commitType = await askQuestion(`Commit type (${commitTypes.join('/')}): `);
  if (!commitTypes.includes(commitType)) {
    console.error('Invalid commit type');
    process.exit(1);
  }

  const commitMessage = await askQuestion('Commit message: ');
  const fullCommitMessage = `${commitType}: ${commitMessage}`;

  executeCommand('git add .');
  executeCommand(`git commit -m "${fullCommitMessage}"`);
  console.log(`Changes committed: ${fullCommitMessage}`);
}

async function pushChanges() {
  const currentBranch = executeCommand('git rev-parse --abbrev-ref HEAD').trim();
  const shouldPush = await askQuestion(`Push changes to origin/${currentBranch}? (y/n): `);

  if (shouldPush.toLowerCase() === 'y') {
    executeCommand(`git push -u origin ${currentBranch}`);
    console.log(`Changes pushed to origin/${currentBranch}`);
  }
}

async function createPullRequest() {
  const currentBranch = executeCommand('git rev-parse --abbrev-ref HEAD').trim();
  const shouldCreatePR = await askQuestion(`Create pull request for ${currentBranch}? (y/n): `);

  if (shouldCreatePR.toLowerCase() === 'y') {
    const prTitle = await askQuestion('Pull request title: ');
    const prDescription = await askQuestion('Pull request description: ');

    // Note: This command uses GitHub CLI. Make sure it's installed and configured.
    executeCommand(`gh pr create --title "${prTitle}" --body "${prDescription}" --base main`);
    console.log('Pull request created');
  }
}

async function main() {
  console.log('Git Flow Automation');

  const action = await askQuestion('Choose action (create-branch/commit/push/pr): ');

  switch (action) {
    case 'create-branch':
      await createBranch();
      break;
    case 'commit':
      await commitChanges();
      break;
    case 'push':
      await pushChanges();
      break;
    case 'pr':
      await createPullRequest();
      break;
    default:
      console.error('Invalid action');
      process.exit(1);
  }

  rl.close();
}

main();