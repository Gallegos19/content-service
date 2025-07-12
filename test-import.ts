console.log('Current working directory:', process.cwd());
console.log('Testing module resolution...');

// Test with absolute path
const absolutePath = require.resolve('./src/domain/services/content.service.ts');
console.log('Absolute path to content.service.ts:', absolutePath);

try {
  // Test with direct require
  console.log('Trying direct require with absolute path...');
  const directRequire = require(absolutePath);
  console.log('Direct require successful:', directRequire);
  
  // Test with module alias
  console.log('Trying require with module alias...');
  const moduleAlias = require('module-alias');
  moduleAlias.addAliases({
    '@domain': __dirname + '/src/domain'
  });
  
  const contentService = require('@domain/services/content.service');
  console.log('Module alias require successful:', contentService);
} catch (error) {
  console.error('Error during require:');
  console.error(error);
  
  if (error instanceof Error && 'code' in error && error.code === 'MODULE_NOT_FOUND') {
    console.error('Module not found. Paths checked:');
    try {
      const paths = require.resolve.paths('@domain/services/content.service') || [];
      console.error('-', paths);
    } catch (e) {
      console.error('Could not get resolve paths:', e);
    }
  }
}
