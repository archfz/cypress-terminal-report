import jsonPrune from "./jsonPrune";
import {compare} from "compare-versions";
import type {Failure} from "superstruct";

// Markdown regex: https://gist.github.com/elfefe/ef08e583e276e7617cd316ba2382fc40
function getMarkdownRegex(numWrapperChars: number) {
  const asteriskWrapper = `(?:\\*){${numWrapperChars}}`
  const underscoreWrapper = `(?:_){${numWrapperChars}}`
  return new RegExp(`^${asteriskWrapper}(.+?)${asteriskWrapper}$|^${underscoreWrapper}(.+?)${underscoreWrapper}$`)
}

const MARKDOWN_REGEX = {
  BOLD_AND_ITALIC: getMarkdownRegex(3),
  BOLD: getMarkdownRegex(2),
  ITALIC: getMarkdownRegex(1),
}

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

  validatorErrToStr: (errorList: Failure[]) => 
    '\n' + 
    errorList.map((error) => ` => ${error.path.join('.')}: ${error.message}`).join('\n') + 
    '\n',

  /**
   * The Cypress GUI runner allows markdown in `cy.log` messages. We can take this
   * into account for our loggers as well.
   */
  applyMessageMarkdown(message: string, {bold, italic, processContents}: {
    bold: (str: string) => string,
    italic: (str: string) => string,
    processContents?: (str: string) => string
  }) {
    let contentsHaveBeenProcessed = false
    const maybeProcessContents = (str: string) => {
      if (contentsHaveBeenProcessed || !processContents) return str
      contentsHaveBeenProcessed = true
      return processContents(str)
    }

    // bold and italic, i.e. ***text*** or ___text___
    message = message.replace(MARKDOWN_REGEX.BOLD_AND_ITALIC,
      (str, group1, group2) => bold(italic(maybeProcessContents(group1 || group2))))

    // bold, i.e. **text** or __text__
    message = message.replace(MARKDOWN_REGEX.BOLD,
      (str, group1, group2) => bold(maybeProcessContents(group1 || group2)))

    // italic, i.e. *text* or _text_
    message = message.replace(MARKDOWN_REGEX.ITALIC,
      (str, group1, group2) => italic(maybeProcessContents(group1 || group2)))

    return maybeProcessContents(message)
  }
}

export default utils;
