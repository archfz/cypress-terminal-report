export default class CtrError extends Error {
  constructor(message: any) {
    super(`cypress-terminal-report: ${message}`);
  }
}
