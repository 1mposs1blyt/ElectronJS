// ssh-bot-control.js
const { Client } = require("ssh2");

function runRemoteCommand(command, sshConfig, botDir) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .on("ready", () => {
        console.log("[SSH] Connected to", sshConfig.host);
        if (botDir) {
          conn.sftp((err, sftp) => {
            if (err) throw err;

            const remoteFilePath = `${botDir}\\${sshConfig.bot_file_name}`;
            sftp.stat(remoteFilePath, (err, stats) => {
              if (err) {
                // Handle the error, most likely 'ENOENT' for "No such file or directory"
                console.log(
                  `[SSH] File ${remoteFilePath} does not exist or an error occurred:`,
                  err.message
                );
                conn.end();
              } else {
                console.log(
                  `[SSH] File ${remoteFilePath} exists. Size: ${stats.size} bytes.`
                );
              }
            });
          });
        }
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
function CheckPM2Process(command, sshConfig) {
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
  const CHECK_CMD = `npx pm2 describe ${botName}`;
  const pm2_status = await CheckPM2Process(CHECK_CMD, sshConfig);
  console.log({ pm2_status: pm2_status.code });
  if (pm2_status.code == 1) {
    const START_CMD = `cd ${botDir} && npx pm2 start ${sshConfig.bot_file_name} --name ${botName} --watch`;
    console.log("[SSH] Start command:", START_CMD);
    return await runRemoteCommand(START_CMD, sshConfig, botDir);
  } else if (pm2_status.code == 0) {
    console.log("Bot already in pm2");
    return {
      success: true,
      error: "Бот уже запущен!",
    };
  }
}
async function stopBot(botDir, botName, sshConfig) {
  const CHECK_CMD = `npx pm2 describe ${botName}`;
  const pm2_status = await CheckPM2Process(CHECK_CMD, sshConfig);
  console.log({ botDir, botName });
  console.log(sshConfig);
  if (pm2_status.code == 0) {
    console.log("Bot stopped successful!");
    //  cd ${botDir} &&
    const STOP_CMD = `npx pm2 stop ${botName} && npx pm2 delete ${botName}`;
    console.log("[SSH] Stop command:", STOP_CMD);
    return await runRemoteCommand(STOP_CMD, sshConfig);
  } else if (pm2_status.code == 1) {
    console.log("Bot already stopped!");
    return {
      success: false,
      error: "Any ERROR!",
    };
  }
}

module.exports = { startBot, stopBot };
