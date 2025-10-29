# 1. Navigate to framework directory
cd KALXJS-FRAMEWORK

# 2. Build only the packages you modified
pnpm run build:core
pnpm run build:cli

# 3. Publish only those packages
lerna publish --filter=@kalxjs/core --filter=@kalxjs/cli



# Bump core version (patch, minor, or major)
pnpm version patch


### Most Conservative Single-Package Approach:
cd KALXJS-FRAMEWORK/packages/core
pnpm publish

cd ../cli
pnpm publish

## 1. Clear npm Cache
npm cache clean --force
