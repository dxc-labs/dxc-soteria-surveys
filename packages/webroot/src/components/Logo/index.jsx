import React, { useState, useEffect } from 'react';
import {makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    logo: {
      maxWidth: 75,
    },
  }));

export default function Logo() {
  const classes = useStyles();
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    try {
        setLogo(require(`./../../assets/img/${process.env.REACT_APP_TENANT}_vertical_logo.png`)); 
    }
    catch(error) {
        setLogo(require('./../../assets/img/default_vertical_logo.png'));
    }
  },[])

  return (
      <div>
        <img src={logo} alt="logo" className={classes.logo}/>
      </div>
  );
} 
