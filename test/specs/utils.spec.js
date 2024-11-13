import utils from '../../src/utils'
import {expect} from 'chai'

const {applyMessageMarkdown} = utils

describe('utils', () => {
    describe('applyMessageMarkdown', () => {
        it('correctly detects markdown and returns processed message with functions applied', () => {
            const LONG_MSG = "abc123".repeat(5)
            const tests = [
               ['*text text*', '<i>text text<i>'],
               ['_text text_', '<i>text text<i>'],
               ['**text text**', '<b>text text<b>'],
               ['__text text__', '<b>text text<b>'],
               ['***text text***', '<b><i>text text<i><b>'],
               ['___text text___', '<b><i>text text<i><b>'],
               ['_text text_text_', '<i>text text_text<i>'],
               ['text text_','text text_'],
               ['*text text','*text text'],
               ['*text text**', '<i>text text*<i>'],
               ['**text text*', '<i>*text text<i>'],
               [`**${LONG_MSG}**`, `<b>${LONG_MSG.substring(0, 20)}...<b>`],
            ]
            tests.forEach(([message, expected]) => {
                expect(applyMessageMarkdown(message, {
                    bold: (str) => `<b>${str}<b>`,
                    italic: (str) => `<i>${str}<i>`,
                    processContents: (c) => c.length > 20 ? (c.substring(0, 20) + '...') : c
                }), message).to.deep.equal(expected)
            })
        })
    })
})