import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname, search } = useLocation();

    useEffect(() => {
        const resetScroll = () => {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            if (document.body) document.body.scrollTop = 0;
            // Also reset scroll for main container just in case it's the scrollable element
            const main = document.querySelector('main');
            if (main) main.scrollTop = 0;
        };

        // Try immediately
        resetScroll();

        // Try after a tiny delay
        const timer = setTimeout(resetScroll, 10);

        // Try again after a slightly longer delay for async loads
        const timer2 = setTimeout(resetScroll, 100);

        return () => {
            clearTimeout(timer);
            clearTimeout(timer2);
        };
    }, [pathname, search]);
    return null;
}
