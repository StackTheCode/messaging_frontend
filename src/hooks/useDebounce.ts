import { useEffect, useRef } from "react";

type Timer = ReturnType<typeof setTimeout> | null;

export const useDebounce = <T extends unknown[]>(callback: (...args: T) => void, delay: number) => {
const timeoutRef = useRef<Timer>(null)    

useEffect(() =>{
    return () =>{
        if(timeoutRef.current){
            clearTimeout(timeoutRef.current)
        }
    }
},[]);

return (...args :T)=>{
    if(timeoutRef.current){
        clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() =>{
        callback(...args);

    },delay)
}
}