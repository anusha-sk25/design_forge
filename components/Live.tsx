"use client";
import React from 'react'
import { useCallback, useEffect, useState } from 'react';

import { useBroadcastEvent, useEventListener, useMyPresence } from '@/liveblocks.config';
import { CursorMode, CursorState, Reaction } from '@/types/type';
import LiveCursors from "./cursor/LiveCursors"
import FlyingReaction from './reaction/FlyingReaction';
import CursorChat from './cursor/CursorChat';
import ReactionSelector from './reaction/ReactionButton';
import useInterval from '@/hooks/useInterval';

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { shortcuts } from '@/constants';


type Props = {
    canvasRef: React.MutableRefObject<HTMLCanvasElement |
        null>;
    undo:()=>void;
    redo:()=>void;
}
const Live = ({ canvasRef, undo, redo }: Props) => {
   
    const [{ cursor }, updateMyPresence] = useMyPresence();

    // store the reactions created on mouse click
    const [reactions, setReactions] = useState<Reaction[]>([]);

    // track the state of the cursor (hidden, chat, reaction, reaction selector)
    const [cursorState, setCursorState] = useState<CursorState>({
        mode: CursorMode.Hidden,
    });
    const setReaction = useCallback((reaction: string) => {
        setCursorState({
            mode: CursorMode.Reaction,
            reaction, isPressed: false
        });
    }, [])
    const broadcast = useBroadcastEvent();

    // Remove reactions that are not visible anymore (every 1 sec)
    useInterval(() => {
        setReactions((reactions) => reactions.filter((reaction) => reaction.timestamp > Date.now() - 4000));
    }, 1000)

    // Broadcast the reaction to other users (every 100ms)
    useInterval(() => {
        if (cursorState.mode === CursorMode.Reaction &&
            cursorState.isPressed && cursor) {
            // concat all the reactions created on mouse click
            setReactions((reactions) => reactions.concat([
                {
                    point: { x: cursor.x, y: cursor.y },
                    value: cursorState.reaction,
                    timestamp: Date.now(),
                }
            ]))
            // Broadcast the reaction to other users
            broadcast({
                x: cursor.x,
                y: cursor.y,
                value: cursorState.reaction,
            })
        }
    }, 100);
    // useEventListener is used to listen to events broadcasted by other users.
    useEventListener((eventData) => {
        const event = eventData.event;
        setReactions((reactions) =>
            reactions.concat([
                {
                    point: { x: event.x, y: event.y },
                    value: event.value,
                    timestamp: Date.now(),
                },
            ])
        );
    });

    useEffect(() => {
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === "/") {
                setCursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: "",
                });
            } else if (e.key === "Escape") {
                updateMyPresence({ message: "" });
                setCursorState({ mode: CursorMode.Hidden });
            }//below this l-57,58 aint in video rn 
            else if (e.key === "e") {
                setCursorState({ mode: CursorMode.ReactionSelector });
            }
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/') {
                e.preventDefault();
            }
        }
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('keydown', onKeyDown);


        return () => {
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("keydown", onKeyDown);
        };

    }, [updateMyPresence]);

    const handlePointerMove = useCallback((event: React.PointerEvent) => {
        event.preventDefault();
        // if cursor is not in reaction selector mode, update the cursor position
        if (cursor == null || cursorState.mode != CursorMode.ReactionSelector) {
            // get the cursor position in the canvas
            const x = event.clientX - event.currentTarget.
                getBoundingClientRect().x;
            const y = event.clientY - event.currentTarget.
                getBoundingClientRect().y;
            // broadcast the cursor position to other users
            updateMyPresence({ cursor: { x, y } });
        }
    }, [])
    // Hide the cursor when the mouse leaves the canvas
    const handlePointerLeave = useCallback((event: React.PointerEvent) => {
        setCursorState({ mode: CursorMode.Hidden })

        updateMyPresence({ cursor: null, message: null });

    }, [])
    // Show the cursor when the mouse enters the canvas
    const handlePointerDown = useCallback((event: React.PointerEvent) => {
        // get the cursor position in the canvas
        const x = event.clientX - event.currentTarget.
            getBoundingClientRect().x;
        const y = event.clientY - event.currentTarget.
            getBoundingClientRect().y;

        updateMyPresence({ cursor: { x, y } });
        // if cursor is in reaction mode, set isPressed to true
        setCursorState((state: CursorState) =>
            cursorState.mode === CursorMode.Reaction ?
                { ...state, isPressed: true } : state)

    }, [cursorState.mode, setCursorState])
    // hide the cursor when the mouse is up
    const handlePointerUp = useCallback((event: React.PointerEvent) => {
        setCursorState((state: CursorState) =>
            cursorState.mode === CursorMode.Reaction ?
                { ...state, isPressed: true } : state)
    }, [cursorState.mode, setCursorState])
    // trigger respective actions when the user clicks on the right menu
    const handleContextMenuClick = useCallback((key: string) => {
        switch (key) {
            case "Chat":
                setCursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: "",
                });
                break;

            case "Reactions":
                setCursorState({ mode: CursorMode.ReactionSelector });
                break;

            case "Undo":
                undo();
                break;

            case "Redo":
                redo();
                break;

            default:
                break;
        }
    }, []);


    return (
        <ContextMenu>
            <ContextMenuTrigger
                id="canvas"
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                className="h-[100vh] w-full flex justify-center items-center 
            text-center"
            >

                <canvas ref={canvasRef} />

                {/* L-170 canvas was where first text-JSX was written and below is to Render the reactions */}
                {reactions.map((r) => (
                    <FlyingReaction
                        key={r.timestamp.toString()}
                        x={r.point.x}
                        y={r.point.y}
                        timestamp={r.timestamp}
                        value={r.value}
                    />
                ))}
                {/* If cursor is in chat mode, show the chat cursor */}
                {cursor && (
                    <CursorChat
                        cursor={cursor}
                        cursorState={cursorState}
                        setCursorState={setCursorState}
                        updateMyPresence={updateMyPresence}
                    />
                )}
                {/* If cursor is in reaction selector mode, show the reaction selector */}
                {cursorState.mode === CursorMode.ReactionSelector && (
                    <ReactionSelector
                        setReaction={(reaction) => {
                            setReaction(reaction);
                        }} />
                )}

                {/* Show the live cursors of other users */}
                <LiveCursors />

            </ContextMenuTrigger>
            <ContextMenuContent className="right-menu-content">
                {shortcuts.map((item) => (
                    <ContextMenuItem key={item.key} onClick={()=>handleContextMenuClick(item.name)}
                    className="right-menu-item">
                        <p>{item.name}</p>
                        <p className="text-xs text-primary-grey-300">{item.shortcut}</p>
                    </ContextMenuItem>
                ))}

            </ContextMenuContent>
        </ContextMenu >
    )
}

export default Live;


