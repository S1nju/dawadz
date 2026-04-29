"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, MapPin, Search, PlusCircle, ShoppingBag, Truck, CheckCircle2, ShieldCheck, Pill, Syringe, Building2, Stethoscope, BriefcaseMedical, FileText, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "next-themes"

export default function LandingPage() {
    const { isLoaded, isSignedIn } = useAuth()
    const { resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div className="flex flex-col min-h-[100dvh] bg-background text-foreground overflow-hidden selection:bg-blue-500/30">
            {/* Soft Ambient Background Elements */}
            <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            <div className="fixed left-[-10%] top-[-5%] -z-10 h-[50vw] w-[50vw] rounded-full bg-blue-500/10 blur-[120px]"></div>
            <div className="fixed right-[-10%] bottom-[-5%] -z-10 h-[50vw] w-[50vw] rounded-full bg-indigo-500/10 blur-[120px]"></div>

            {/* Header */}
            <header className="px-6 lg:px-14 h-24 flex items-center border-b border-border/40 backdrop-blur-3xl bg-background/60 sticky top-0 z-50">
                <Link className="flex items-center justify-center gap-3 group" href="/">
                    <img src="/logo.png" alt="DawaDz Logo" className="h-15 w-auto group-hover:scale-105 transition-transform drop-shadow-sm" />
                    <span className="font-extrabold text-2xl tracking-tight hidden sm:block text-foreground group-hover:text-blue-600 transition-colors">
                        DawaDz
                    </span>
                </Link>
                <nav className="ml-auto flex gap-6 sm:gap-10 items-center">
                    <Link className="text-sm font-semibold text-muted-foreground hover:text-blue-600 transition-colors hidden md:block" href="#features">
                        Capabilities
                    </Link>
                    <Link className="text-sm font-semibold text-muted-foreground hover:text-blue-600 transition-colors hidden md:block" href="#pricing">
                        Pricing
                    </Link>
                    <Link className="text-sm font-semibold text-muted-foreground hover:text-blue-600 transition-colors hidden md:block" href="#marketplace">
                        Marketplace
                    </Link>
                    <Link className="text-sm font-semibold hover:text-blue-600 transition-colors hidden md:flex items-center gap-2 group" href="/map">
                        <MapPin className="size-4 text-blue-600 group-hover:-translate-y-0.5 transition-transform" /> Pharmacy Finder
                    </Link>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-full border-border/70 bg-background/60 hover:bg-muted/80"
                        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                        aria-label="Toggle dark mode"
                    >
                        {!mounted || resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    </Button>
                    <div className="h-8 w-px bg-border hidden sm:block"></div>
                    {isLoaded && isSignedIn ? (
                        <Link
                            className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-6 py-2 text-sm font-bold text-background shadow-lg transition-all hover:bg-blue-600 hover:text-white hover:scale-105 active:scale-95"
                            href="/dashboard/profile"
                        >
                            Profile
                        </Link>
                    ) : (
                        <>
                            <Link className="text-sm font-bold text-foreground hover:text-blue-600 transition-colors" href="/login">
                                Sign In
                            </Link>
                            <Link
                                className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-6 py-2 text-sm font-bold text-background shadow-lg transition-all hover:bg-blue-600 hover:text-white hover:scale-105 active:scale-95"
                                href="/register"
                            >
                                Join Network
                            </Link>
                        </>
                    )}
                </nav>
            </header>

            <main className="flex-1">
                {/* 1. Hero Section - Map Integration Theme */}
                <section className="relative w-full pt-20 pb-24 md:pt-32 md:pb-36 overflow-hidden">
                    <div className="container px-4 md:px-8 mx-auto max-w-7xl">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                            {/* Text Content */}
                            <div className="flex flex-col space-y-8 text-center lg:text-left relative z-10">
                                <div className="inline-flex mx-auto lg:mx-0 items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 backdrop-blur-md">
                                    <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                                    Algeria's Leading Pharmaceutical Hub
                                </div>
                                <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl lg:text-7xl !leading-[1.1]">
                                    Connecting the <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-400 dark:to-indigo-500">
                                        Supply Chain.
                                    </span>
                                </h1>
                                <p className="max-w-[600px] mx-auto lg:mx-0 text-muted-foreground text-lg md:text-xl leading-relaxed">
                                    The ultimate unified platform bridging the gap between national suppliers and local pharmacies. Execute wholesale orders, pinpoint local pharmacies via dynamic medical maps, and manage stock via real-time tracking.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto items-center justify-center lg:justify-start">
                                    <Link
                                        href="/sign-up"
                                        className="w-full sm:w-auto inline-flex h-14 w-full sm:w-auto items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1 hover:shadow-blue-500/40"
                                    >
                                        Access Dashboard <ArrowRight className="ml-2 size-5" />
                                    </Link>
                                    <Link
                                        href="/"
                                        className="w-full sm:w-auto inline-flex h-14 items-center justify-center rounded-xl border-2 border-border bg-background/50 backdrop-blur-md px-8 font-bold shadow-sm transition-colors hover:border-blue-500/50 hover:bg-blue-500/5"
                                    >
                                        <MapPin className="mr-2 size-5 text-blue-600" /> Open Pharmacy Map
                                    </Link>
                                </div>
                            </div>

                            {/* Hero Imagery - Isometric City Map */}
                            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 blur-3xl rounded-full"></div>
                                {/* Added Logo in the hero photo grouping */}
                                <div className="absolute -top-10 -right-6 md:right-10 z-20 animate-bounce [animation-duration:3s]">
                                    <img src="/logo.png" alt="Hero Logo" className="h-20 w-auto filter drop-shadow-2xl opacity-90" />
                                </div>
                                <div className="relative rounded-[2rem] border border-white/10 bg-black/5 shadow-2xl overflow-hidden group">
                                    <img
                                        src="/main.jpg"
                                        alt="City Medical Network Mapping"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    {/* Overlay UI elements to mimic app functionality */}
                                    <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-background/90 backdrop-blur-xl border shadow-xl flex items-center justify-between pointer-events-none transform translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                <Building2 className="size-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">Oran Central Health</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <CheckCircle2 className="size-3 text-blue-600" /> Active Inventory
                                                </div>
                                            </div>
                                        </div>
                                        <Button size="sm" className="rounded-full bg-blue-600 text-white pointer-events-auto">View Stock</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Features Grid - Focusing on Medical themes */}
                <section id="features" className="w-full py-24 bg-muted/40 border-y">
                    <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                            <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase">System Features</h2>
                            <h3 className="text-3xl font-black md:text-5xl tracking-tight text-balance">Built for the future of digital health outfitting.</h3>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Card 1 */}
                            <div className="group rounded-[2rem] bg-background border p-8 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all">
                                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                                    <Search className="size-7 text-blue-600" />
                                </div>
                                <h4 className="text-xl font-bold mb-3">Live Pharmacy Mapping</h4>
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    Civilians and patients can utilize our interactive public map platform to securely pinpoint available pharmacies spanning multiple wilayas. Get real-time availability of critical medications, calculate distances, and find emergency contact details instantly.
                                </p>
                            </div>
                            {/* Card 2 */}
                            <div className="group rounded-[2rem] bg-background border p-8 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all lg:-translate-y-4">
                                <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                                    <ShoppingBag className="size-7 text-indigo-600" />
                                </div>
                                <h4 className="text-xl font-bold mb-3">B2B Wholesale Hub</h4>
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    Pharmacies securely browse bulk listings posted by registered suppliers. Filter by DCI, therapeutic class, and brand automatically. Streamline procurement by grouping entire monthly stocks into one unified, trackable delivery operation securely.
                                </p>
                            </div>
                            {/* Card 3 */}
                            <div className="group rounded-[2rem] bg-background border p-8 shadow-sm hover:shadow-xl hover:border-cyan-500/30 transition-all">
                                <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                                    <ShieldCheck className="size-7 text-cyan-600" />
                                </div>
                                <h4 className="text-xl font-bold mb-3">Authorized Integrity</h4>
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    Stringent document validations (RC, License) guard the platform, digitally enforcing that only verified, established healthcare organizations can process heavy supply chain transactions, stopping counterfeit medical fraud entirely.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Deep Dive Marketplace - Medication imagery  */}
                <section id="marketplace" className="w-full py-24 md:py-32">
                    <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            {/* Imagery Left */}
                            <div className="relative order-2 lg:order-1">
                                <div className="absolute inset-0 max-w-sm ml-auto bg-gradient-to-bl from-blue-500/30 to-indigo-500/20 blur-3xl rounded-full"></div>
                                <img
                                    src="/main.jpg"
                                    alt="Pharmaceutical Medications"
                                    className="relative rounded-[2.5rem] w-full max-w-lg mx-auto shadow-2xl ring-1 ring-border"
                                />
                                {/* Floating Badges */}
                                <div className="absolute top-10 -left-6 md:-left-12 p-4 rounded-2xl bg-background/90 backdrop-blur shadow-xl border flex items-center gap-3 animate-pulse">
                                    <Pill className="text-blue-500 size-6" />
                                    <div><p className="font-bold text-sm">Amoxicillin 500mg</p><p className="text-xs text-muted-foreground">In Stock</p></div>
                                </div>
                                <div className="absolute bottom-10 -right-6 md:-right-12 p-4 rounded-2xl bg-background/90 backdrop-blur shadow-xl border flex items-center gap-3">
                                    <Syringe className="text-indigo-500 size-6" />
                                    <div><p className="font-bold text-sm">Vaccine Lots</p><p className="text-xs text-muted-foreground">Shipped Yesterday</p></div>
                                </div>
                            </div>

                            {/* Text Right */}
                            <div className="order-1 lg:order-2 space-y-8">
                                <div className="space-y-4">
                                    <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase">Seamless Marketplace</h2>
                                    <h3 className="text-3xl font-black md:text-5xl tracking-tight text-balance">The definitive wholesale transaction manager.</h3>
                                    <p className="text-lg text-muted-foreground leading-relaxed">
                                        Browse active pharmaceutical products posted by country-wide suppliers. DawaDz converts accepted deals instantaneously into legally compliant "Factures" and "Bons de Commande" ready for physical PDF printouts.
                                    </p>
                                </div>

                                <ul className="space-y-4">
                                    <li className="flex items-start gap-4">
                                        <div className="p-2.5 rounded-xl bg-muted shrink-0 text-foreground">
                                            <FileText className="size-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">Instant Invoices</p>
                                            <p className="text-muted-foreground">Never manually enter a command again, click print immediately.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="p-2.5 rounded-xl bg-muted shrink-0 text-foreground">
                                            <Truck className="size-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">Batch Pipeline</p>
                                            <p className="text-muted-foreground">Monitor deliveries progressing from "Ordered" to "Delivered".</p>
                                        </div>
                                    </li>
                                </ul>

                                <Link href="/register" className="inline-flex items-center font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                    Start procuring today <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Pricing / Billing Segment */}
                <section id="pricing" className="w-full py-24 bg-muted/40 border-y">
                    <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                            <div className="space-y-2">
                                <div className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
                                    Pricing Architecture
                                </div>
                                <h2 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">Fair scaling for everyone.</h2>
                                <p className="max-w-[700px] text-muted-foreground md:text-xl leading-relaxed mx-auto">
                                    Simple, transparent tariffs adjusted per node in the supply chain to ensure equal infrastructure sustainability.
                                </p>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Free / Users */}
                            <div className="flex flex-col rounded-[2.5rem] border bg-background p-10 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:border-blue-500/30 transition-all duration-300">
                                <div className="space-y-4 flex-1">
                                    <div className="inline-flex items-center justify-center rounded-xl bg-slate-500/10 w-14 h-14 mb-4">
                                        <Search className="size-6 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold">Public Users</h3>
                                    <div className="flex items-baseline text-4xl font-extrabold pb-4 border-b">
                                        Free
                                    </div>
                                    <ul className="space-y-4 mt-6 text-muted-foreground">
                                        <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-blue-600" /> Full Pharmacy Tracker</li>
                                        <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-blue-600" /> Search DCI Availabilities</li>
                                        <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-blue-600" /> AI Patient Assistant</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Pharmacies Pricing */}
                            <div className="relative flex flex-col rounded-[2.5rem] border-2 border-blue-600 bg-background p-10 shadow-xl shadow-blue-500/10 transition-all duration-300 scale-100 lg:scale-105 z-10 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-2 lg:hover:-translate-y-4">
                                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-[2rem]"></div>
                                <div className="absolute top-0 right-8 transform -translate-y-1/2">
                                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>
                                </div>
                                <div className="space-y-4 flex-1 mt-2">
                                    <div className="inline-flex items-center justify-center rounded-xl bg-blue-500/10 w-14 h-14 mb-4">
                                        <Building2 className="size-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-bold">Pharmacies</h3>
                                    <div className="flex items-baseline text-4xl font-extrabold pb-4 border-b">
                                        2,000 <span className="text-2xl font-bold ml-1.5 opacity-80">DA</span>
                                        <span className="ml-2 text-lg font-medium text-muted-foreground">/mo</span>
                                    </div>
                                    <ul className="space-y-4 mt-6 text-muted-foreground">
                                        <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-blue-600" /> Order directly from Suppliers</li>
                                        <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-blue-600" /> Interactive Stock UI</li>
                                        <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-blue-600" /> Generate compliant Invoices</li>
                                        <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-blue-600" /> Priority marketplace priority</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Suppliers Pricing */}
                            <div className="flex flex-col rounded-[2.5rem] border bg-background p-10 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:border-indigo-500/30 transition-all duration-300">
                                <div className="space-y-4 flex-1">
                                    <div className="inline-flex items-center justify-center rounded-xl bg-indigo-500/10 w-14 h-14 mb-4">
                                        <Truck className="size-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-bold">Suppliers</h3>
                                    <div className="flex items-baseline text-4xl font-extrabold pb-4 border-b">
                                        3,000 <span className="text-2xl font-bold ml-1.5 opacity-80">DA</span>
                                        <span className="ml-2 text-lg font-medium text-muted-foreground">/mo</span>
                                    </div>
                                    <ul className="space-y-4 mt-6 text-muted-foreground">
                                        <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-blue-600" /> Publish vast catalogues</li>
                                        <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-blue-600" /> Full logistics CRM</li>
                                        <li className="flex items-center gap-3"><CheckCircle2 className="size-5 text-blue-600" /> Regional bulk sales data</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. CTA Block */}
                <section className="container mx-auto px-4 md:px-8 max-w-6xl py-24">
                    <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-blue-700 to-indigo-900 px-8 py-20 text-center shadow-2xl">
                        {/* Overlay pattern */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                        <img src="/logo.png" alt="DawaDz Action" className="mx-auto h-24 mb-6 opacity-30 invert" />

                        <div className="relative z-10 space-y-6 max-w-2xl mx-auto text-white">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Deploy your digital pharmacy today.</h2>
                            <p className="text-blue-100/90 md:text-xl">
                                Join hundreds of certified hospitals and pharmacies streamlining their medical stock. Free enrollment for public pharmacy viewers.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                                <Link
                                    href="/register"
                                    className="inline-flex h-14 items-center justify-center rounded-xl bg-white px-8 font-bold text-blue-800 shadow-xl transition-transform hover:scale-105"
                                >
                                    Register Account
                                </Link>
                                <Link
                                    href="/"
                                    className="inline-flex h-14 items-center justify-center rounded-xl border border-white/30 bg-white/10 backdrop-blur-md px-8 font-bold text-white shadow-sm transition-colors hover:bg-white/20"
                                >
                                    Browse Map
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="w-full py-10 border-t border-border/40 bg-muted/20">
                <div className="container px-4 md:px-8 mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Logo" className="h-6 w-auto grayscale" />
                        <span className="font-bold text-lg">DawaDz</span>
                        <span className="text-sm text-muted-foreground ml-2">© 2026. All rights reserved.</span>
                    </div>
                    <nav className="flex gap-6 text-sm font-medium text-muted-foreground">
                        <Link className="hover:text-foreground transition-colors" href="/">Pharmacy Finder</Link>
                        <Link className="hover:text-foreground transition-colors" href="#features">Features</Link>
                        <Link className="hover:text-foreground transition-colors" href="/login">Dashboard</Link>
                    </nav>
                </div>
            </footer>
        </div>
    )
}