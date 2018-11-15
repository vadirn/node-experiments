const parseArgs = require('minimist');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

const argv = parseArgs(process.argv.slice(2), {
  string: ['name'],
});

if (argv.name) {
  const timestamp = new Date().getTime();

  const filename = `${timestamp}_${argv.name.replace(' ', '_').toLowerCase()}.sql`;

  fs.ensureFile(path.resolve(__dirname, '..', 'src', 'migrations', filename)).then(() => {
    console.log(
      chalk.green('success'),
      `Saved "./src/migrations/${filename}"`,
      chalk.gray('cmd+click to open the file')
    );
  });
} else {
  console.log(chalk.red('error'), 'Please provide a name for migration');
}
