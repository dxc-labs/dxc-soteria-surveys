import React  from 'react';
import {
  Typography
} from '@material-ui/core';

class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { error: null, errorInfo: null };
    }
    
    componentDidCatch(error, errorInfo) {
      // Catch errors in any components below and re-render with error message
      this.setState({
        error: error,
        errorInfo: errorInfo
      })
      // You can also log error messages to an error reporting service here
    }
    
    render() {
      if (this.state.errorInfo) {
        // Error path
        return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Typography variant="h4" color="inherit">
                {this.state.error && this.state.error.toString()}
              </Typography>
            </div>
        );
      }
      // Normally, just render children
      return this.props.children;
    }  
  }

  export default ErrorBoundary; 
