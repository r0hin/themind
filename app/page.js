"use client";
import { useState } from 'react';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Image from 'next/image';

export default function Home() {
    const inputClass = "bg-transparent py-2 px-4 border-4 border-amber-500 placeholder-amber-100 text-lg font-bold rounded-xl outline-none focus:bg-amber-600 focus:placeholder-white transition";
    const buttonClass = "py-2 px-4 text-lg font-bold rounded-xl transition";

    const [loading, setLoading] = useState(0);

    const [ nickname, setNickname ] = useState('');
    const handleNicknameChange = (e) => {
        setNickname(e.target.value);
    };

    const notifyError = (message) => {
        toast.error(message);
    };

    const checkNickname = () => {
        if (nickname === '') {
            notifyError('Pick a cool nickname.');
            return false;
        }
        return true;
    };

    const handleAction = (type) => {
        if (!checkNickname()) {
            return;
        }
        setLoading(type);
    };

    return (
        <>
            <Image src="/logo.png" width="437" height="173" alt="The Mind" className="mx-auto" />

            <div className="w-full max-w-[25rem] px-6 mt-16">
                <div className="flex flex-col space-y-3">
                    <input
                        type="text"
                        placeholder="Nickname"
                        className={inputClass}
                        onKeyUp={handleNicknameChange}
                    />

                    <button
                        className={`border-4 border-red-500 bg-red-500 hover:bg-red-600 ${buttonClass}`}
                        onClick={() => handleAction(1)}
                    >
                        { loading === 1 ? 'Creating new game...' : 'Start a new game' }
                    </button>
                    <button
                        className={`border-4 border-green-500 bg-green-500 hover:bg-green-600 ${buttonClass}`}
                        onClick={() => handleAction(2)}
                    >
                        { loading === 2 ? 'Joining game...' : 'Join a game' }
                    </button>
                    <button
                        className={`border-4 border-cyan-500 bg-cyan-500 hover:bg-cyan-600 ${buttonClass}`}
                        onClick={() => handleAction(3)}
                    >
                        { loading === 3 ? 'Finding game...' : 'Find a game' }
                    </button>
                </div>
            </div>

            <ToastContainer
                position="bottom-center"
                autoClose={3000}
                draggable={false}
                theme="dark"
            />
        </>
    );
}
