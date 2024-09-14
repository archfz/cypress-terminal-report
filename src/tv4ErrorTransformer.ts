export default {
  toReadableString: function (errorList: any) {
    return '\n' + errorList.map((error: any) => {
      return `=> ${error.dataPath.replace(/\//, '.')}: ${error.message}`;
    }).join('\n') + '\n';
  }
};
