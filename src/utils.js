const semver = require("semver");

const utils = {
  nonQueueTask: function (name, data) {
    if (semver.gte(Cypress.version, '12.17.0')) {
      const { args, promise } = Cypress.emitMap('command:invocation', {name: 'task', args: [name, data]})[0]
      return new Promise((r) => promise.then(r))
        .then(() => Cypress.backend('run:privileged', {
          commandName: 'task',
          args,
          options: {
            task: name,
            arg: data
          },
        }))
        // For some reason cypress throws empty error although the task indeed works.
        .catch(() => {/* noop */})
    }

    if (semver.gte(Cypress.version, '12.15.0')) {
      Cypress.emit('command:invocation', {name: 'task', args: [name, data]})
      return new Promise(resolve => setTimeout(resolve, 5))
        .then(() => Cypress.backend('run:privileged', {
          commandName: 'task',
          userArgs: [name, data],
          options: {
            task: name,
            arg: data
          },
        }))
        // For some reason cypress throws empty error although the task indeed works.
        .catch(() => {/* noop */})
    }

    return Cypress.backend('task', {
      task: name,
      arg: data,
    })
      // For some reason cypress throws empty error although the task indeed works.
      .catch((error) => {/* noop */})
  }
}

module.exports = utils;
