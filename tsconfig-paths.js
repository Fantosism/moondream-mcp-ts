const tsConfigPaths = require('tsconfig-paths');

const baseUrl = './src';
const paths = {
  '@/*': ['*'],
  '@/types': ['types/index'],
  '@/utils': ['utils/index'],
  '@/handlers': ['handlers/index'],
  '@/pipelines': ['pipelines/index']
};

tsConfigPaths.register({
  baseUrl,
  paths,
});