// ssh-bot-control.js
const { Client } = require("ssh2");

function runRemoteCommand(command, sshConfig) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn
      .on("ready", () => {
        console.log("[SSH] Connected to", sshConfig.host);

        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }

          let stdout = "";
          let stderr = "";

          stream
            .on("close", (code, signal) => {
              console.log(
                `[SSH] Command finished, code=${code}, signal=${signal}`
              );
              conn.end();
              resolve({ stdout, stderr, code, signal });
            })
            .on("data", (data) => {
              stdout += data.toString();
            })
            .stderr.on("data", (data) => {
              stderr += data.toString();
            });
        });
      })
      .on("error", (err) => {
        reject(err);
      })
      .connect(sshConfig);
  });
}

async function startBot(botDir, botName, sshConfig) {
  const START_CMD = `cd ${botDir} && pm2 start bot.js --name ${botName} --watch`;
  // const START_CMD = `cd ${botDir} && pm2 start ${botName}.js --name ${botName}`;
  // const START_CMD = `cd ${botDir} && node bot.js`;
  console.log("[SSH] Start command:", START_CMD);
  return await runRemoteCommand(START_CMD, sshConfig);
}

async function stopBot(botDir, botName, sshConfig) {
  const STOP_CMD = `cd ${botDir} && pm2 stop ${botName}`;
  console.log("[SSH] Stop command:", STOP_CMD);
  return await runRemoteCommand(STOP_CMD, sshConfig);
}

module.exports = { startBot, stopBot, runRemoteCommand };
