export const logAndExit = (message: any, code = 1) => {
  console.log(message);
  process.exit(code);
};
