import childProcess from 'child_process';
import { promisify } from 'es6-promisify';
import { prompt } from 'inquirer';
import ora from 'ora';
import selfupdate from 'selfupdate';

const packageInfo = require('../../package');
const update = promisify(selfupdate.update);
const isUpdated = promisify(selfupdate.isUpdated);

export default async () => {
  const checkSpinner = ora('正在检查更新...').start();
  const isLatest = await isUpdated(packageInfo);
  checkSpinner.stop();
  if (isLatest) {
    console.log('当前已是最新版本');
    return;
  }
  const ans = await prompt([
    {
      message: '检测到新版本，是否更新？',
      name: 'shouldUpdate',
      type: 'confirm',
    },
  ]);
  if (!ans.shouldUpdate) {
    return;
  }
  const updateSpinner = ora('正在更新').start();
  try {
    await update(packageInfo);
  } catch (e) {
    childProcess.exec(
      `npm uninstall --global --silent ${packageInfo.name}`,
      uninstllErr => {
        if (uninstllErr) {
          console.error('更新失败', uninstllErr);
          process.exit(1);
        }
        childProcess.exec(
          `npm install --global --silent ${packageInfo.name}`,
          installErr => {
            if (installErr) {
              console.error('更新失败', installErr);
              process.exit(1);
            }
          },
        );
      },
    );
  }
  updateSpinner.stop();
  console.log('更新完成，请重新启动!');
  process.exit(0);
};
