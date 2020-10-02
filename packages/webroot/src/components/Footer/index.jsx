import React from 'react';
import {Typography,Link} from '@material-ui/core';

export default function Footer() {

  return (
    <div>
     <Typography variant="body2" color="textSecondary" align="center">
        {'Copyright © '}
        <Link color="inherit" href="https://example.com/opensource">
          Project Soteria
        </Link>{' '}
        {new Date().getFullYear()}
        {'.'}
      </Typography>
    </div>
  );
}
