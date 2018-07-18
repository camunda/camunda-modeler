const handlers = [
  require('./after-pack/add-version'),
  require('./after-pack/add-platform-files')
];


async function afterPack(context) {
  return await handlers.map(h => h(context));
}

module.exports = afterPack;