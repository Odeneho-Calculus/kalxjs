# 1. Navigate to framework directory
cd KALXJS-FRAMEWORK

# 2. Build only the packages you modified
pnpm run build:core
pnpm run build:cli

# 3. Publish only those packages
lerna publish --filter=@kalxjs/core --filter=@kalxjs/cli

### Most Conservative Single-Package Approach:
cd KALXJS-FRAMEWORK/packages/core
npm publish

cd ../cli
npm publish
