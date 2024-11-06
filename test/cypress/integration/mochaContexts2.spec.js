describe('Context 1', () => {
  afterEach(() => {});

  it('testc1', () => {
  });

  describe('Nested no after each', () => {
    it('Nested test no after each', () => {
    });
  });
});

describe('Context 2', () => {
  afterEach(() => {});

  it('testc2', () => {
  });

  describe('Nested with after each', () => {
    afterEach(() => {});

    it('Nested test with after each', () => {
    });
  });
});
