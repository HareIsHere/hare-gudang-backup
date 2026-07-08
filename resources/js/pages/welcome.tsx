import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';
import { register } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user && (
                            <Link
                                href={dashboard()}
                                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                            >
                                Dashboard
                            </Link>
                        )}
                    </nav>
                </header>
                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <main className="flex w-full max-w-[335px] flex-col-reverse lg:max-w-4xl lg:flex-row">
                        <div className="flex items-center justify-center lg:w-1/2 w-full rounded-br-lg rounded-bl-lg bg-white p-6 pb-12 text-[13px] leading-[20px] shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-tl-lg lg:rounded-br-none lg:p-20 dark:bg-[#161615] dark:text-[#EDEDEC] dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]">
                            <div className="flex gap-3 text-sm leading-normal w-full justify-center">
                                {auth.user ? (
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Link
                                            href={dashboard()}
                                            className="inline-block rounded-sm border border-black bg-[#1b1b18] px-5 py-1.5 text-sm leading-normal text-white hover:border-black hover:bg-black dark:border-[#eeeeec] dark:bg-[#eeeeec] dark:text-[#1C1C1A] dark:hover:border-white dark:hover:bg-white"
                                        >
                                            Dashboard
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3 w-full text-center">
                                        <Link
                                            href={login()}
                                            className="block w-full rounded-full border border-indigo-600 text-indigo-600 px-6 py-2.5 text-sm font-medium hover:bg-indigo-600 hover:text-white transition-colors duration-200"
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            href={register()}
                                            className="block w-full rounded-full border border-indigo-600 text-indigo-600 px-6 py-2.5 text-sm font-medium hover:bg-indigo-600 hover:text-white transition-colors duration-200"
                                        >
                                            Register
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="relative -mb-px flex aspect-[335/364] w-full shrink-0 items-center justify-center overflow-hidden rounded-t-lg bg-[#fff2f2] p-6 lg:mb-0 lg:-ml-px lg:aspect-auto lg:w-1/2 lg:rounded-t-none lg:rounded-r-lg dark:bg-[#1D0002]">
                            {/* 
                                LOGO / IMAGE CONTAINER:
                                You can put your logo or large illustration inside this div. 
                                The image below is configured to fit the box size beautifully.
                            */}
                            <div className="flex h-full w-full items-center justify-center">
                                <img
                                    src="/images/PTRimau.jpeg"
                                    alt="Logo"
                                    className="max-h-[300px] max-w-full rounded-lg object-contain shadow-sm lg:max-h-[400px]"
                                />
                            </div>
                            <div className="pointer-events-none absolute inset-0 rounded-t-lg shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-t-none lg:rounded-r-lg dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]"></div>
                        </div>
                    </main>
                </div>
                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
