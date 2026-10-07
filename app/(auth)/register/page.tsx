import { GrainGradient } from "@paper-design/shaders-react";
import RegisterForm from "./_ui/RegisterForm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Register() {
    const session = await auth.api.getSession({ headers: await headers() });
    // console.log(session);
    if (session) {
        redirect('/dashboard')
    }
    return (
        <section className="h-screen max-h-screen overflow-hidden bg-white p-3 text-black antialiased [font-synthesis:none] dark:bg-[#050505] dark:text-white">
            <div className="grid h-full max-h-[calc(100vh-1.5rem)] gap-4 lg:grid-cols-[0.94fr_1.06fr]">
                {/* Form Card */}
                <div className="flex h-full flex-col justify-center overflow-y-auto rounded-xl border border-black/15 bg-white px-6 py-6 sm:px-10 lg:px-12 dark:border-white/10 dark:bg-[#0a0a0a]">
                    <div className="mx-auto w-full max-w-md">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[34px] lg:leading-tight text-black dark:text-white">
                                Create an account
                            </h1>
                            <p className="mt-1 text-sm text-black/60 dark:text-white/55 sm:text-base">
                                Brainstorm in chat, build in cowork
                            </p>
                        </div>

                        <RegisterForm />
                    </div>
                </div>

                {/* Visual / Shader Card */}
                <div className="relative hidden lg:flex h-full overflow-hidden rounded-xl bg-black p-8 lg:p-10 text-white flex-col justify-between">
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
                        <h2 className="max-w-md text-4xl font-medium tracking-tight text-white lg:text-5xl xl:text-6xl lg:leading-[1.02]">
                            Think fast,
                            <br />
                            Build faster
                        </h2>


                    </div>
                </div>
            </div>
        </section>
    );
}