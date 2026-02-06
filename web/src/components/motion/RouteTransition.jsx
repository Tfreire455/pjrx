import React from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

export function RouteTransition({ children }) {
  const location = useLocation();

  return (
    <>
        {children}
    </>
  );
}