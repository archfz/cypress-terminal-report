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
               ['__*text text*__', 'BItext textIB'],
               ['*__text text__*', 'IBtext textBI'],
               ['text text __text text__', 'text text Btext textB'],
               ['_text text_ __text text__', 'Itext textI Btext textB'],
               ['_text text_text_', 'Itext textItext_'],
               ['text text_','text text_'],
               ['**text **text**', 'Btext Btext**'],
               ['*text text**', 'Itext textI*'],
               ['**text text*',  'I*text textI'],
               ['[blue](text text)', '<blue>text text<>'],
               ['[blue](*text text*)', '<blue>Itext textI<>'],
            ]
            tests.forEach(([message, expected]) => {
                expect(applyMessageMarkdown(message, {
                    bold: (str) => `B${str}B`,
                    italic: (str) => `I${str}I`,
                    color: (str, color) => `<${color}>${str}<>`
                })).to.deep.equal(expected)
            })
        })
    })
})