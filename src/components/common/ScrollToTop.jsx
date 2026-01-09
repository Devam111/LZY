import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  // Extracts the pathname property from the location object
  const { pathname, hash } = useLocation();

  // This effect runs every time the pathname changes
  useEffect(() => {

       // We want to let HashLink do its job.
    if (hash) {
      return;
    } 
    // Scrolls the window to the top left corner
    window.scrollTo(0, 0);
  }, [pathname, hash]); // The effect dependency is the pathname

  // This component does not render anything to the DOM
  return null;
};

export default ScrollToTop;