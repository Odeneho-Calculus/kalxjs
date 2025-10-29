## all at once
git add .
git commit -m "feat: new feature"
git push


## pub

npx lerna publish from-package --yes 2>&1 | tee publish.log

# with patch
npx lerna version patch --yes 2>&1 | head -200

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


## how to uninstall the KALXJS framework packages:

# Option 1: Remove from Your Project (if you installed @kalxjs packages in an app)

# Remove @kalxjs/core
npm uninstall @kalxjs/core
# or
pnpm remove @kalxjs/core

# Remove @kalxjs/cli
npm uninstall @kalxjs/cli
# or
pnpm remove @kalxjs/cli

# Remove other packages
npm uninstall @kalxjs/router @kalxjs/store @kalxjs/state


## Option 2: Clean Local node_modules (KALXJS-FRAMEWORK development)

# Navigate to framework directory
cd KALXJS-FRAMEWORK

# Option A: Clean everything
rm -rf node_modules package-lock.json  # (or pnpm-lock.yaml for pnpm)
pnpm install  # Fresh install

# Option B: Clean cache and reinstall
pnpm install --force


### Option 3: Uninstall from Global npm

# Remove CLI globally
npm uninstall -g @kalxjs/cli

# or with pnpm
pnpm remove --global @kalxjs/cli
