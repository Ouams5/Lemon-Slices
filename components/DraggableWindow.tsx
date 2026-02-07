import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DraggableWindowProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
    initialPos?: { x: number, y: number };
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({ 
    title, onClose, children, className = '', initialPos = { x: 20, y: 20 }
}) => {
    const [pos, setPos] = useState(initialPos);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const handleStart = (clientX: number, clientY: number) => {
        setIsDragging(true);
        dragStart.current = { x: clientX - pos.x, y: clientY - pos.y };
    };

    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        handleStart(e.clientX, e.clientY);
    };

    const onTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation();
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
    };

    useEffect(() => {
        const onMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging) return;
            
            let clientX, clientY;
            if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = (e as MouseEvent).clientX;
                clientY = (e as MouseEvent).clientY;
            }

            setPos({ 
                x: clientX - dragStart.current.x, 
                y: clientY - dragStart.current.y 
            });
        };

        const onEnd = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', onEnd);
        }

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
        };
    }, [isDragging]);

    const windowContent = (
        <div 
            className={`fixed z-[9999] bg-white border-2 border-obsidian shadow-hard flex flex-col ${className}`}
            style={{ top: pos.y, left: pos.x }}
            onMouseDown={(e) => e.stopPropagation()} 
            onClick={(e) => e.stopPropagation()} 
            onKeyDown={(e) => e.stopPropagation()} 
        >
            <div 
                className="bg-obsidian text-white px-2 py-1 flex items-center justify-between cursor-move shrink-0 select-none touch-none"
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
            >
                <span className="font-bold text-xs uppercase mr-4 pointer-events-none">{title}</span>
                <button onClick={onClose} className="hover:text-red-400"><X size={14}/></button>
            </div>
            <div className="overflow-auto custom-scrollbar flex-1 bg-white relative">
                {children}
            </div>
        </div>
    );

    return createPortal(windowContent, document.body);
};