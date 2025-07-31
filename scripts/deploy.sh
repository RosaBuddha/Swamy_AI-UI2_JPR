#!/bin/bash

# Simple deployment script that increments version before building
echo "🚀 Starting deployment..."

# Increment version
echo "📝 Incrementing version..."
node scripts/increment-version.js

if [ $? -ne 0 ]; then
  echo "❌ Failed to increment version"
  exit 1
fi

# Read new version
VERSION=$(cat VERSION)
echo "✅ Version incremented to: v.$VERSION"

# Optional: Add git commit and tag
# git add VERSION version-info.json
# git commit -m "Version bump to v.$VERSION"
# git tag "v.$VERSION"

echo "🎉 Ready for deployment with version v.$VERSION"
echo ""
echo "To deploy to production:"
echo "  npm run build"
echo "  npm run start"
echo ""
echo "Version info will be available at /api/version"