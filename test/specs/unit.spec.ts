import {expect} from 'chai';
import NestedOutputProcessorDecorator from '../../src/outputProcessor/NestedOutputProcessorDecorator';
import type {IOutputProcecessor} from '../../src/outputProcessor/BaseOutputProcessor';

describe('NestedOutputProcessorDecorator', () => {
  it('should expand output path and date tokens', () => {
    const files: string[] = [];
    const createProcessor = (file: string): IOutputProcecessor => {
      files.push(file);
      return {
        initialize: () => {},
        write: () => {},
        getTarget: () => file,
        getSpentTime: () => 0,
      };
    };
    const decorator = new NestedOutputProcessorDecorator(
      '*|[relpath]/[basename]-[yyyy][mm][dd]-[HH][MM][SS].txt',
      'cypress/integration',
      createProcessor
    );

    decorator.getProcessor('cypress/integration/folder/example.spec.js');

    expect(files[0]).to.match(/^folder\/example\.spec-\d{4}\d{2}\d{2}-\d{2}\d{2}\d{2}\.txt$/);
    expect(decorator.getTarget()).to.equal('[relpath]/[basename]-[yyyy][mm][dd]-[HH][MM][SS].txt');
  });

  it('should preserve the legacy path-prefix and extension format', () => {
    const files: string[] = [];
    const createProcessor = (file: string): IOutputProcecessor => {
      files.push(file);
      return {
        initialize: () => {},
        write: () => {},
        getTarget: () => file,
        getSpentTime: () => 0,
      };
    };
    const decorator = new NestedOutputProcessorDecorator(
      'logs|json',
      'cypress/integration',
      createProcessor
    );

    decorator.getProcessor('cypress/integration/folder/example.spec.js');

    expect(files[0]).to.equal('logs/folder/example.spec.json');
    expect(decorator.getTarget()).to.equal('logs');
  });
});
