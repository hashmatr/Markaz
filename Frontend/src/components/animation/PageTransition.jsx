import { motion } from 'framer-motion';

const variants = {
    initial: {
        opacity: 0,
        y: 10,
    },
    enter: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.33, 1, 0.68, 1], // Power4.out equivalent
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: {
            duration: 0.3,
            ease: [0.32, 0, 0.67, 0], // Power4.in equivalent
        },
    },
};

export default function PageTransition({ children }) {
    return (
        <motion.div
            initial="initial"
            animate="enter"
            exit="exit"
            variants={variants}
            style={{ width: '100%' }}
        >
            {children}
        </motion.div>
    );
}
