import Image from 'next/image';

export default function Home() {
    const inputClass = "bg-transparent py-2 px-4 border-4 border-amber-500 placeholder-amber-100 text-lg font-bold rounded-xl outline-none focus:bg-amber-600 focus:placeholder-white transition";
    const buttonClass = "py-2 px-4 text-lg font-bold rounded-xl transition";

    return (
        <>
            <Image src="/logo.png" width="437" height="173" alt="The Mind" className="mx-auto" />

            <div className="w-full max-w-[25rem] px-6 mt-16">
                <div className="flex flex-col space-y-3">
                    <input
                        type="text"
                        placeholder="Nickname"
                        className={inputClass}
                    />

                    <button className={`border-4 border-red-500 bg-red-500 hover:bg-red-600 ${buttonClass}`}>
                        Start a new game
                    </button>
                    <button className={`border-4 border-green-500 bg-green-500 hover:bg-green-600 ${buttonClass}`}>
                        Join a game
                    </button>
                    <button className={`border-4 border-cyan-500 bg-cyan-500 hover:bg-cyan-600 ${buttonClass}`}>
                        Find a game
                    </button>
                </div>
            </div>
        </>
    );
}
