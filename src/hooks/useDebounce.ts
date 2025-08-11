import { useCallback, useEffect, useRef } from "react";

type Timer = ReturnType<typeof setTimeout> | null;

export const useDebounce = <T extends unknown[]>(callback: (...args: T) => void, delay: number) => {
const timeoutRef = useRef<Timer>(null);    
const callbackRef = useRef(callback);

useEffect(() =>{
    callbackRef.current = callback;
},[callback]);

useEffect(() =>{
    return () =>{
        if(timeoutRef.current){
            clearTimeout(timeoutRef.current)
        }
    }
},[]);

return useCallback((...args :T)=>{
    if(timeoutRef.current){
        clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() =>{
        callbackRef.current(...args);

    },delay)
},[delay])
}