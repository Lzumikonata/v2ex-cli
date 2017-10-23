const chalk = require('chalk')
const ora = require('ora')
const inquirer = require('inquirer')
const { storage } = require('../src/utils')
const { create, generateOnce, download, check } = require('../src/pages/sessions')
const termImg = require('term-img')

const promps = [{
  type: 'input',
  name: 'username',
  message: 'username',
  validate: input => !!input
}, {
  type: 'password',
  name: 'password',
  message: 'password:',
  validate: input => !!input
}]
const verification = [{
  type: 'input',
  name: 'code',
  message: 'verification code:',
  validate: input => !!input
}]

return console.log(chalk.green('Login is unavailable, use [v2 cookie] set cookie'))

;(async() => {
  const log = new ora('verify link..').start()
  const verifyLog = new ora('you also need to fill in the verification code..')
  const signinLog = new ora('signin...')
  try {
    const { cookie, result } = await generateOnce()
    log.succeed('verify completed')
    const verify = result.find(key => key.name === 'verify')
    let asnwers = await inquirer.prompt(promps)
    if (verify) {
      verifyLog.start()
      const codeImage = await download(verify.img, cookie)
      if (!codeImage) return log.fail('download verification code image fails')
      const path = await storage.write('code.png', new Buffer(codeImage, 'binary'), 'binary')
      verifyLog.clear()
      verifyLog.stop()
      console.log('\n')
      termImg(path)
      const asnwerCode = await inquirer.prompt(verification)
      asnwers.verify = asnwerCode.code
    }
    asnwers.once = (result.find(r => r.name === 'once') || {}).value
    const user = result.reduce((pre, next) => {
      const value = asnwers[next.name]
      return !value ? pre : Object.assign(pre, { [String(next.key)]: value })
    }, {})
    signinLog.start()
    const userToken = await create(user, cookie)
    if (userToken && userToken.cookie) {
      storage.write('test', userToken.cookie)
      const res = await check(cookie)
    }
    signinLog.succeed('signin successed, cookie saved.')
  } catch (e) {
    log.fail(e)
    verifyLog.stop()
    signinLog.stop()
  }
  
})()
