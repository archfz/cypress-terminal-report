const utils = require('../../src/utils').default
const {expect} = require('chai');

const {checkMessageMarkdown} = utils

describe('utils', () => {
    describe('checkMessageMarkdown', () => {
        it('correctly detects cypress log message markdown and returns processed message with markdown removed', () => {
            const tests = [
                {message: '_text text_text_', isItalic: true, processedMessage: 'text text_text'},
                {message: '_text _text'},
                {message: 'text text_'},
                {message: '**text **text**', isBold: true, processedMessage: 'text **text'},
                {message: '*text text**'},
                {message: '**text text*'},
                {message: '*text text*'},
                {message: '[blue](text text)', color: 'blue', processedMessage: 'text text'},
            ]
            tests.forEach(({message, ...expected}) => {
                expect(checkMessageMarkdown(message)).to.deep.equal({
                    color: undefined,
                    isItalic: false,
                    isBold: false,
                    processedMessage: message,
                    ...expected
               })
           })
       })
   })
})