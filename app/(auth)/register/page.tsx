
import { GrainGradient } from "@paper-design/shaders-react";
import RegisterForm from "./_ui/RegisterForm";

export default function Register() {

    return (
        <div>
            <section className="min-h-screen bg-white p-3 text-black antialiased [font-synthesis:none] dark:bg-[#050505] dark:text-white">
                <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
                    <div className="flex min-h-190 items-start rounded-md border border-black/20 bg-white px-6 py-12 sm:px-10 dark:border-white/10 dark:bg-[#0a0a0a] lg:min-h-0 lg:px-14 lg:py-28 xl:px-20">
                        <div className="mx-auto w-full max-w-147.5">
                            <div>
                                <h1 className="whitespace-nowrap text-3xl font-medium tracking-[-0.04em] sm:text-4xl lg:text-[42px] lg:leading-[1.05] xl:text-[50px]">
                                    Create an account
                                </h1>
                                <p className="mt-3 whitespace-nowrap text-lg leading-snug text-black/60 dark:text-white/55 sm:text-xl lg:text-2xl xl:text-3xl">
                                    Brainstrom in chat, build in cowork
                                </p>
                            </div>

                            <div className="my-10 text-center text-xl font-medium text-black/60 dark:text-white/50">or</div>

                            <RegisterForm />
                        </div>
                    </div>

                    <div className="relative flex min-h-180 overflow-hidden rounded-md bg-black p-8 text-white sm:p-12 lg:min-h-0">
                        <GrainGradient
                            speed={1}
                            scale={1}
                            rotation={0}
                            offsetX={0}
                            offsetY={0}
                            softness={0.5}
                            intensity={0.5}
                            noise={0.25}
                            shape="corners"
                            frame={2854.5}
                            colors={["#FFFFFF", "#FC7819", "#FC7819", "#FFFFFF"]}
                            colorBack="#00000000"
                            className="absolute inset-0 bg-black"
                        />

                        <div className="relative z-10 flex h-full w-full flex-col justify-between">
                            <h2 className="max-w-155 pt-0 text-5xl font-medium tracking-tighter text-white sm:text-6xl lg:pt-16 lg:text-[64px] lg:leading-[0.98] xl:text-[70px]">
                                Think fast,
                                <br />
                                Build faster
                            </h2>

                            <a
                                href="#"
                                className="mb-0 inline-flex h-12 max-w-full items-center gap-3 rounded-[10px] border border-white/25 px-5 text-base font-medium text-white/85 backdrop-blur-sm transition-colors hover:border-white/45 hover:text-white xl:mb-32 xl:px-6 xl:text-2xl"
                            >
                                <span className="truncate whitespace-nowrap">Download the windows app</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}