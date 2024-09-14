import semver from "semver";
import jsonPrune from "./jsonPrune";

const utils = {
  nonQueueTask: function (name: any, data: any) {
    if (Cypress.testingType === 'component' && semver.gte(Cypress.version, '12.15.0')) {
      // In component tests task commands don't need to be verified for some reason.
      return new Promise(resolve => setTimeout(resolve, 5))
        // @ts-expect-error TS(2575): No overload expects 2 arguments, but overloads do ... Remove this comment to see the full error message
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

    if (semver.gte(Cypress.version, '12.17.0')) {
      // @ts-expect-error TS(2339): Property 'args' does not exist on type '(...args: ... Remove this comment to see the full error message
      const { args, promise } = Cypress.emitMap('command:invocation', {name: 'task', args: [name, data]})[0]
      return new Promise((r) => promise.then(r))
        // @ts-expect-error TS(2575): No overload expects 2 arguments, but overloads do ... Remove this comment to see the full error message
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
        // @ts-expect-error TS(2575): No overload expects 2 arguments, but overloads do ... Remove this comment to see the full error message
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

    // @ts-expect-error TS(2575): No overload expects 2 arguments, but overloads do ... Remove this comment to see the full error message
    return Cypress.backend('task', {
      task: name,
      arg: data,
    })
      // For some reason cypress throws empty error although the task indeed works.
      .catch((error: any) => {/* noop */});
  },

  jsonStringify(value: any, format = true) {
    let json = '';

    try {
      json = JSON.stringify(value, null, format ? 2 : undefined);
    } catch (e) {
      try {
        let prunned = JSON.parse(jsonPrune(value, 20, 1000));
        json = JSON.stringify(prunned, null, format ? 2 : undefined);
      } catch (e) {
        if (typeof value.toString === 'function') {
          return '[unprocessable=' + value.toString() + ']';
        }
        return '[unprocessable]';
      }
    }

    if (typeof json === 'undefined') {
      return 'undefined';
    }

    return json;
  }
}

export default utils;
