export default class CtrError extends Error {
  constructor(message: string) {
    super(`cypress-terminal-report: ${message}`);
  }
}
