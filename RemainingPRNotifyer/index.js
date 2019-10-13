/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */

const createScheduler = require('probot-scheduler')
const { WebClient } = require('@slack/web-api');
const slackAPI = new WebClient(process.env.SLACK_BOT_TOKEN);
const moment = require('moment');

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
    const endDate = moment.utc().format()
    const startDate = moment.utc().subtract(7, 'days').format()
    const prList = await getAllPullRequests(context, owner, repo)
    const prText = await getPullRequestsText(prList, startDate, endDate)
    let text = `${moment(startDate).format("YYYY-MM-DD")} ~ ${moment(endDate).format("YYYY-MM-DD")} にマージされたプルリクエストは`
    if (prText.length) {
      text += `${prText.length}件でした。\n${prText.join("\n")}`
    } else {
      text += "ありませんでした。"
    }
    postSlack(text)
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

async function getPullRequestsText(prList, startDate, endDate) {
  console.log(prList)
  return prList.filter(x => {
    console.log(moment(x.merged_at).utc().isBetween(startDate, endDate))
    return x.state === "closed" && moment(x.merged_at).utc().isBetween(startDate, endDate)
  }).map(x => {
     return `<${x.html_url}|${x.title}> by <${x.user.html_url}|${x.user.login}>`
  })
}

async function getAllPullRequests(context, owner, repo) {
  let pullRequests = await context.github.paginate(
    context.github.pullRequests.getAll({
      owner,
      repo,
      state: 'closed',
      per_page: 100
    }),
    res => res.data
  )
  return pullRequests
}