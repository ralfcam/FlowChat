#!/bin/bash

# Install missing dependencies
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled @mui/system

# Create a basic fix for Theme type issues
echo "// Fix for Material UI theme types
import { Theme as MuiTheme } from '@mui/material/styles';

declare global {
  interface Theme extends MuiTheme {}
}

export {};
" > src/types/theme.d.ts

# Create directory for types if it doesn't exist
mkdir -p src/types

echo "Fixes applied. Try running npm start again." 