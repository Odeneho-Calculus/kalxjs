# 1. Navigate to framework directory
cd KALXJS-FRAMEWORK

# 2. Build only the packages you modified
pnpm run build:core
pnpm run build:cli

# 3. Publish only those packages
lerna publish --scope=@kalxjs/core --scope=@kalxjs/cli
