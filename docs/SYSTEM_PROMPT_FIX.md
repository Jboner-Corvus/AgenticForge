# Fix for Missing system.prompt.md File

## Issue

The worker process was failing to start with the following error:

```
Error: ENOENT: no such file or directory, open '/home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/dist/system.prompt.md'
```

This error occurred because the system.prompt.md file was not being copied to the dist directory during the build process.

## Root Cause

The system.prompt.md file exists in the source directory:
```
/home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/src/modules/agent/system.prompt.md
```

But the worker process expects to find it in the dist directory:
```
/home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/dist/system.prompt.md
```

The copy-assets.js script is responsible for copying this file during the build process, but it was not working correctly.

## Solution

1. **Manual Fix**: Run the copy-assets.js script manually to copy the file:
   ```bash
   cd /home/demon/agentforge/AgenticForge2/AgenticForge/packages/core
   node scripts/copy-assets.js
   ```

2. **Enhanced Script**: Updated the copy-assets.js script to:
   - Ensure the dist directory exists before copying files
   - Add better error handling
   - Provide more informative logging

## Verification

After running the copy-assets.js script, the system.prompt.md file is now present in the dist directory:
```bash
cd /home/demon/agentforge/AgenticForge2/AgenticForge/packages/core
ls -la dist/system.prompt.md
```

This should resolve the worker startup error.

## Prevention

To prevent this issue in the future:

1. The enhanced copy-assets.js script now ensures the dist directory exists
2. Better error handling will help identify issues earlier
3. More informative logging will help with debugging

## Related Files

- [packages/core/src/modules/agent/system.prompt.md](file:///home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/src/modules/agent/system.prompt.md) - Source file
- [packages/core/dist/system.prompt.md](file:///home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/dist/system.prompt.md) - Destination file (after copying)
- [packages/core/scripts/copy-assets.js](file:///home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/scripts/copy-assets.js) - Script that copies the file