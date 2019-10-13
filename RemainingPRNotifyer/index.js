/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */

const createScheduler = require('probot-scheduler')
const { WebClient } = require('@slack/web-api');
const slackAPI = new WebClient(process.env.SLACK_BOT_TOKEN);

module.exports = app => {
  // Your code here
  app.log('Yay, the app was loaded!')

  createScheduler(app, {
    delay: !!process.env.DISABLE_DELAY, // delay is enabled on first run
    // interval: 24 * 60 * 60 * 1000 // 1 day
    interval: 1 * 1 * 60 * 1000 // 1 min
  })

  app.on('schedule.repository', context => {
    const { owner, repo } = context.repo()
    const repoText = `Repository: ${owner}/${repo}`
    postSlack(repoText)
  })
}

async function postSlack(text) {
  console.log(text)
  try {
    const result = await slackAPI.chat.postMessage({
      text: `test`,
      channel: `${process.env.SLACK_CHANNEL}`,
    });
    console.log('Message sent successfully', result.ts);
  } catch (error) {
    console.log('An error occurred', error);
  }
}