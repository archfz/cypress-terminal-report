describe('Recursive logging on console events', () => {
  const Title = () => {
    return <h1>title</h1>;
  };

  it('Component test 1', () => {
    cy.mount(<Title />);
    console.warn('warning');
    cy.get('h2', {timeout: 0});
  });

  it('Component test 2', () => {
    cy.mount(<Title />);
    console.warn('warning');
    cy.get('h2', {timeout: 0});
  });
});
