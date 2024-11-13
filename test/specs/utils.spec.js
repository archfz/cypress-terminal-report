import utils from '../../src/utils'
import {expect} from 'chai'

const {applyMessageMarkdown} = utils

describe('utils', () => {
    describe('applyMessageMarkdown', () => {
        it('correctly detects markdown and returns processed message with functions applied', () => {
            const tests = [
               ['*text text*', 'Itext textI'],
               ['_text text_', 'Itext textI'],
               ['**text text**', 'Btext textB'],
               ['__text text__', 'Btext textB'],
               ['***text text***', 'BItext textIB'],
               ['___text text___', 'BItext textIB'],
               ['_text text_text_', 'Itext text_textI'],
               ['text text_','text text_'],
               ['*text text**', 'Itext text*I'],
               ['**text text*',  'I*text textI'],
            ]
            tests.forEach(([message, expected]) => {
                expect(applyMessageMarkdown(message, {
                    bold: (str) => `B${str}B`,
                    italic: (str) => `I${str}I`,
                }), message).to.deep.equal(expected)
            })
        })
    })
})