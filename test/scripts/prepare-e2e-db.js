const { spawnSync } = require('child_process');
const { Client } = require('pg');

const connectionConfig = {
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
};

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function waitForDatabase(maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const client = new Client(connectionConfig);

    try {
      await client.connect();
      await client.end();
      return;
    } catch {
      await client.end().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(
    'La base local no estuvo disponible a tiempo para los tests e2e',
  );
}

async function main() {
  run('npm', ['run', 'db:up']);
  await waitForDatabase();
  run('npm', ['run', 'migration:run:local']);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
