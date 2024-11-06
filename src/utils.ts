import jsonPrune from './jsonPrune';
import {compare} from 'compare-versions';
import {Failure} from 'superstruct';

const utils = {
  nonQueueTask: async (name: string, data: Record<string, any>) => {
    if (Cypress.testingType === 'component' && compare(Cypress.version, '12.15.0', '>=')) {
      // In component tests task commands don't need to be verified for some reason.
      await new Promise((resolve) => setTimeout(resolve, 5));
      // @ts-ignore
      return await Cypress.backend('run:privileged', {
        commandName: 'task',
        userArgs: [name, data],
        options: {
          task: name,
          arg: data,
        },
      }) // For some reason cypress throws empty error although the task indeed works.
        .catch(() => {
          /* noop */
        });
    }

    if (compare(Cypress.version, '12.17.0', '>=')) {
      // @ts-ignore
      const {args, promise} = Cypress.emitMap('command:invocation', {
        name: 'task',
        args: [name, data],
      })[0];
      await new Promise((r) => promise.then(r));
      // @ts-ignore
      return await Cypress.backend('run:privileged', {
        commandName: 'task',
        args,
        options: {
          task: name,
          arg: data,
        },
      }) // For some reason cypress throws empty error although the task indeed works.
        .catch(() => {
          /* noop */
        });
    }

    if (compare(Cypress.version, '12.15.0', '>=')) {
      Cypress.emit('command:invocation', {name: 'task', args: [name, data]});
      await new Promise((resolve_1) => setTimeout(resolve_1, 5));
      // @ts-ignore
      return await Cypress.backend('run:privileged', {
        commandName: 'task',
        userArgs: [name, data],
        options: {
          task: name,
          arg: data,
        },
      }) // For some reason cypress throws empty error although the task indeed works.
        .catch(() => {
          /* noop */
        });
    }

    // @ts-ignore
    return await Cypress.backend('task', {
      task: name,
      arg: data,
    }) // For some reason cypress throws empty error although the task indeed works.
      .catch(() => {
        /* noop */
      });
  },

  jsonStringify(value: any, format = true) {
    let json = '';

    try {
      json = JSON.stringify(value, null, format ? 2 : undefined);
    } catch (e) {
      try {
        let pruned = JSON.parse(jsonPrune(value, 20, 1000));
        json = JSON.stringify(pruned, null, format ? 2 : undefined);
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
  },

  validatorErrToStr: (errorList: Failure[]) =>
    '\n' +
    errorList.map((error) => ` => ${error.path.join('.')}: ${error.message}`).join('\n') +
    '\n',
};

export default utils;
