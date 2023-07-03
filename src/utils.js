import semver from "semver";

const utils = {
  nonQueueTask: function (name, data) {
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
        .catch((error) => {/* noop */})
    }

    return Cypress.backend('task', {
      taskName: name,
      arg: data,
    })
      // For some reason cypress throws empty error although the task indeed works.
      .catch((error) => {/* noop */})
  }
}

export default utils;
