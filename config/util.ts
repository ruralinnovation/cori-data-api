import { exec as EXEC, ChildProcess } from 'child_process';

export function exec(command: string, logToConsole = true): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    function stdoutHandler(data: string) {
      if (logToConsole) {
        console.log(data);
      }
    }
    function stderrHandler(data: string) {
      if (logToConsole) {
        console.error(data);
      }
    }
    const child: ChildProcess = EXEC(command, { maxBuffer: 1024 * 1024 * 10 }, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });

    if (child?.stdout && child.stderr) {
      child.stdout.on('data', stdoutHandler);
      child.stderr.on('data', stderrHandler);
    }

    child.once('exit', () => {
      if (child?.stdout && child.stderr) {
        child.stdout.removeListener('data', stdoutHandler);
        child.stderr.removeListener('data', stderrHandler);
      }
    });
  });
}

/**
 * Get the current branch from local git
 * Note: does not work on CI where git is not available. Set the GIT_BRANCH env variable instead.
 */
export async function getLocalGitBranch(): Promise<string> {
  console.log("Check local git branch");

  if (process.env.GIT_BRANCH) {
    return process.env.GIT_BRANCH;
  }
  const output: string = await exec('git status', false);
  console.log(`$ git status
${output}
`)
  const [, branch] = /On\sbranch\s((?:dev|local|pre|prod|test).*).*/.exec(output.toString()) || [];
  console.log("git branch: ", branch);
  if (branch.match(/^dev/) !== null) {
    return "dev"
  } else if (branch.match(/^pre/) !== null) {
    return "pre"
  } else if (branch.match(/^prod/) !== null) {
    return "prod"
  } else {
    return "local";
  }
}
