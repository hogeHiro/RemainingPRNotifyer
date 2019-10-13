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
    notifyPullRequestToSlack(context)
  })
}

async function notifyPullRequestToSlack(context) {
    const { owner, repo } = context.repo()
    const prList = await getAllPullRequests(context, owner, repo)
    const prText = await getPullRequestsText(prList)
    postSlack(prText)
}

async function postSlack(text) {
  console.log(text)
  try {
    const result = await slackAPI.chat.postMessage({
      text: `${text}`,
      channel: `${process.env.SLACK_CHANNEL}`,
    });
    console.log('Message sent successfully', result.ts);
  } catch (error) {
    console.log('An error occurred', error);
  }
}

async function getPullRequestsText(prList) {
  return prList.map(x => `${x.number}: ${x.title} by ${x.user.login}`).join(`¥n`)
}

async function getAllPullRequests(context, owner, repo) {
  let pullRequests = await context.github.paginate(
    context.github.pullRequests.getAll({
      owner,
      repo,
      state: 'all',
      per_page: 100
    }),
    res => res.data
  )
  return pullRequests
}