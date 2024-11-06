import jsonPrune from "./jsonPrune";
import {compare} from "compare-versions";
import {Failure} from "superstruct";

const utils = {
  nonQueueTask: async (name: string, data: Record<string, any>) => {
    if (Cypress.testingType === 'component' && compare(Cypress.version, '12.15.0', '>=')) {
      // In component tests task commands don't need to be verified for some reason.
      await new Promise(resolve => setTimeout(resolve, 5));
      // @ts-ignore
      return await Cypress.backend('run:privileged', {
        commandName: 'task',
        userArgs: [name, data],
        options: {
          task: name,
          arg: data
        },
      }) // For some reason cypress throws empty error although the task indeed works.
        .catch(() => {/* noop */})
    }

    if (compare(Cypress.version, '12.17.0', '>=')) {
      // @ts-ignore
      const {args, promise} = Cypress.emitMap('command:invocation', {name: 'task', args: [name, data]})[0]
      await new Promise((r) => promise.then(r));
      // @ts-ignore
      return await Cypress.backend('run:privileged', {
        commandName: 'task',
        args,
        options: {
          task: name,
          arg: data
        },
      }) // For some reason cypress throws empty error although the task indeed works.
        .catch(() => {/* noop */})
    }

    if (compare(Cypress.version, '12.15.0', '>=')) {
      Cypress.emit('command:invocation', {name: 'task', args: [name, data]})
      await new Promise(resolve_1 => setTimeout(resolve_1, 5));
      // @ts-ignore
      return await Cypress.backend('run:privileged', {
        commandName: 'task',
        userArgs: [name, data],
        options: {
          task: name,
          arg: data
        },
      })// For some reason cypress throws empty error although the task indeed works.
        .catch(() => {/* noop */});
    }

    // @ts-ignore
    return await Cypress.backend('task', {
      task: name,
      arg: data,
    }) // For some reason cypress throws empty error although the task indeed works.
      .catch(() => {/* noop */});
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

  validatorErrToStr(errorList: Failure[]) {
    return '\n' + errorList.map((error) => {
      return ` => ${error.path.join('.')}: ${error.message}`;
    }).join('\n') + '\n';
  },

  /**
   * The Cypress GUI runner allows markdown in `cy.log` messages. We can take this
   * into account for our loggers as well.
   */
  checkMessageMarkdown(message: string) {
    let processedMessage = message
    const isItalic = message.startsWith('_') && message.endsWith('_')
    const isBold = message.startsWith('**') && message.endsWith('**')
  
    // TODO: account for both bold and italic?
    if (isItalic) {
      processedMessage = processedMessage.replace(/^_*/,"").replace(/_*$/,"")
    }
  
    if (isBold) {
      processedMessage = processedMessage.replace(/^(\*\*)*/,"").replace(/(\*\*)*$/,"")
    }

    return {isItalic, isBold, processedMessage}
  }
}

export default utils;
