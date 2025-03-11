// Fix for Material UI theme types
import { Theme as MuiTheme } from '@mui/material/styles';

declare global {
  interface Theme extends MuiTheme {}
}

export {}; 