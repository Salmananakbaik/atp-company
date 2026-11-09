
import React from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Menu,
  Network,
  RadioTower,
  Cable,
  Wrench,
  ClipboardList,
  ShieldCheck,
  Activity,
  HardHat,
  Mail,
  Phone,
  MapPin,
  Globe,
  Play,
  ChevronRight,
} from "lucide-react";

interface HomeProps {
  onLogin: () => void;
}

const services = [
  {
    number: "01",
    icon: Network,
    title: "FTTH Network",
    description:
      "Pembangunan dan pengembangan infrastruktur Fiber To The Home untuk konektivitas pelanggan.",
  },
  {
    number: "02",
    icon: RadioTower,
    title: "HFC Network",
    description:
      "Operasional dan pemeliharaan jaringan Hybrid Fiber Coaxial.",
  },
  {
    number: "03",
    icon: Cable,
    title: "Fiber Optic Installation",
    description:
      "Instalasi, penarikan, penyambungan, dan terminasi kabel fiber optik.",
  },
  {
    number: "04",
    icon: Wrench,
    title: "Network Maintenance",
    description:
      "Pemeliharaan jaringan dan penanganan gangguan untuk menjaga kualitas layanan.",
  },
  {
    number: "05",
    icon: ClipboardList,
    title: "Work Order Management",
    description:
      "Pengelolaan pekerjaan lapangan melalui proses Work Order yang terstruktur.",
  },
  {
    number: "06",
    icon: Activity,
    title: "Network Operations",
    description:
      "Pemantauan dan pengawasan aktivitas operasional jaringan.",
  },
];

const strengths = [
  {
    icon: ShieldCheck,
    title: "Operational Excellence",
    description: "Proses kerja terstruktur dan terukur.",
  },
  {
    icon: Network,
    title: "Network Reliability",
    description: "Menjaga ketersediaan dan kualitas jaringan.",
  },
  {
    icon: HardHat,
    title: "Technical Expertise",
    description: "Didukung kompetensi tenaga teknis.",
  },
  {
    icon: Activity,
    title: "Operational Monitoring",
    description: "Pemantauan operasional berbasis data.",
  },
];

const projects = [
  {
    category: "FTTH",
    title: "Pembangunan Jaringan FTTH",
    description: "Dokumentasi pekerjaan infrastruktur jaringan fiber optik.",
    image:
      "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=900&q=85",
  },
  {
    category: "HFC",
    title: "Operasional Jaringan HFC",
    description: "Aktivitas operasional dan pemeliharaan perangkat jaringan.",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85",
  },
  {
    category: "INSTALASI",
    title: "Instalasi Fiber Optic",
    description: "Pekerjaan instalasi dan penanganan infrastruktur kabel.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85",
  },
  {
    category: "MAINTENANCE",
    title: "Pemeliharaan Jaringan",
    description: "Kegiatan pemeriksaan dan pemeliharaan infrastruktur.",
    image:
      "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=85",
  },
];

const Home: React.FC<HomeProps> = ({ onLogin }) => {
  const navigation = [
    { label: "Beranda", href: "#home" },
    { label: "Tentang Kami", href: "#about" },
    { label: "Layanan", href: "#services" },
    { label: "Proyek", href: "#projects" },
    { label: "Dokumentasi", href: "#documentation" },
    { label: "Kontak", href: "#contact" },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 lg:px-12">
          <a href="#home" className="flex items-center gap-3">
            <div className="text-3xl font-black italic tracking-tighter text-blue-700">
              ATP
            </div>
            <div className="hidden border-l border-slate-200 pl-3 sm:block">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-900">
                PT. Anugerah Terang Persada
              </p>
              <p className="text-[10px] text-slate-500">
                Telecommunication & Network Operation
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {navigation.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                className={`text-[12px] font-semibold transition-colors hover:text-blue-600 ${
                  index === 0 ? "text-blue-700" : "text-slate-600"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="hidden items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:flex"
            >
              Login Sistem
              <ArrowUpRight size={15} />
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("mobile-navigation")
                  ?.classList.toggle("hidden")
              }
              className="rounded-lg border border-slate-200 p-2 lg:hidden"
              aria-label="Buka navigasi"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        <nav
          id="mobile-navigation"
          className="hidden border-t border-slate-100 bg-white px-5 py-4 lg:hidden"
        >
          <div className="flex flex-col gap-4">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-slate-700"
              >
                {item.label}
              </a>
            ))}
            <button
              onClick={onLogin}
              className="rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white"
            >
              Login Sistem NOC
            </button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section
        id="home"
        className="relative overflow-hidden bg-slate-50"
      >
        <div className="mx-auto grid min-h-[540px] max-w-[1440px] items-center gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 lg:py-20">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-800">
                PT. Anugerah Terang Persada
              </span>
            </div>

            <h1 className="max-w-[650px] text-4xl font-black leading-[1.12] tracking-tight text-slate-950 md:text-5xl xl:text-[60px]">
              Integrated Telecommunication &{" "}
              <span className="text-blue-700">
                Network Operation Solutions.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-600 md:text-base">
              Mendukung konektivitas melalui pembangunan infrastruktur
              jaringan, operasional lapangan profesional, dan pemantauan
              operasional yang terintegrasi.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#services"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-700/15 transition hover:-translate-y-0.5 hover:bg-blue-800"
              >
                Jelajahi Layanan
                <ArrowRight size={15} />
              </a>

              <a
                href="#projects"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-xs font-bold text-slate-800 transition hover:border-blue-500 hover:text-blue-700"
              >
                Lihat Proyek
                <ArrowUpRight size={15} />
              </a>
            </div>

            <div className="mt-12 flex flex-wrap gap-8 border-t border-slate-200 pt-7">
              <div>
                <p className="text-xs font-bold text-slate-900">FTTH & HFC</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Network Infrastructure
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Field Operations
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Technical Services
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Network Monitoring
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Operational Support
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-5 -top-5 h-40 w-40 rounded-full bg-blue-100 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1400&q=90"
                alt="Ilustrasi kegiatan teknis dan infrastruktur"
                className="h-[350px] w-full object-cover md:h-[450px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">
                  Network Infrastructure
                </p>
                <h2 className="mt-2 max-w-md text-2xl font-bold text-white md:text-3xl">
                  Connecting People Through Reliable Networks.
                </h2>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-slate-100 bg-white p-5 shadow-xl md:block">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
                  <RadioTower size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Network Operations
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    FTTH · HFC · Infrastructure
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="scroll-mt-24 py-24">
        <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1100&q=85"
              alt="Ilustrasi gedung perusahaan"
              className="h-[340px] w-full rounded-2xl object-cover md:h-[430px]"
            />
            <div className="absolute -bottom-5 -right-5 hidden rounded-xl bg-blue-700 p-6 text-white shadow-xl md:block">
              <p className="text-2xl font-black">ATP</p>
              <p className="mt-1 text-[10px] text-blue-100">
                Telecommunication & Network Operation
              </p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">
              About Our Company
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
              Mengenal PT. Anugerah Terang Persada
            </h2>
            <p className="mt-6 text-sm leading-7 text-slate-600">
              PT. Anugerah Terang Persada merupakan perusahaan yang
              berfokus pada bidang telekomunikasi dan operasional jaringan.
              Kegiatan yang ditampilkan pada halaman ini mencakup
              infrastruktur FTTH dan HFC, instalasi, pengoperasian, serta
              pemeliharaan jaringan.
            </p>

            <div className="mt-9 grid gap-6 border-t border-slate-200 pt-7 sm:grid-cols-2">
              <div>
                <p className="text-sm font-bold text-slate-950">Visi</p>
                <p className="mt-2 text-xs leading-6 text-slate-600">
                  Menjadi mitra terpercaya dalam penyediaan infrastruktur
                  dan operasional jaringan telekomunikasi.
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-950">Misi</p>
                <p className="mt-2 text-xs leading-6 text-slate-600">
                  Memberikan layanan operasional jaringan yang profesional,
                  berkualitas, dan berorientasi pada kepuasan pelanggan.
                </p>
              </div>
            </div>

            <div className="mt-7">
              <p className="text-sm font-bold text-slate-950">
                Nilai Perusahaan
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                Profesionalisme, integritas, kolaborasi, dan peningkatan
                kualitas berkelanjutan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="scroll-mt-24 bg-slate-50 py-24">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-12">
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">
                What We Do
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Solusi Infrastruktur & Operasional Jaringan
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Ruang lingkup layanan dan kegiatan dalam bidang
                telekomunikasi serta infrastruktur jaringan.
              </p>
            </div>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900"
            >
              Hubungi Kami <ArrowUpRight size={15} />
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article
                  key={service.number}
                  className="group rounded-xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                      <Icon size={23} />
                    </div>
                    <span className="text-xs font-bold text-slate-300">
                      {service.number}
                    </span>
                  </div>
                  <h3 className="mt-7 text-base font-bold text-slate-900">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-xs leading-6 text-slate-500">
                    {service.description}
                  </p>
                  <div className="mt-6 flex items-center text-xs font-semibold text-blue-700">
                    Detail layanan
                    <ChevronRight
                      size={15}
                      className="ml-1 transition group-hover:translate-x-1"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* STRENGTHS */}
      <section className="py-20">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">
              Our Strengths
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Pendekatan Operasional yang Terintegrasi
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              Fokus pada proses kerja, keandalan infrastruktur, kompetensi
              teknis, dan pengelolaan operasional jaringan.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-7 gap-y-9">
            {strengths.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4">
                  <div className="h-fit rounded-lg bg-blue-50 p-3 text-blue-700">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROJECT PORTFOLIO */}
      <section id="projects" className="scroll-mt-24 border-y border-slate-100 py-24">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-12">
          <div className="mb-12 flex items-end justify-between gap-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">
                Selected Projects
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Dokumentasi Pekerjaan
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                Galeri visual kegiatan dan pekerjaan infrastruktur jaringan.
              </p>
            </div>
            <span className="hidden text-xs font-semibold text-slate-400 sm:block">
              Project Portfolio / 2026
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {projects.map((project) => (
              <article key={project.title} className="group">
                <div className="relative overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-md bg-white px-3 py-1.5 text-[9px] font-bold tracking-wider text-blue-700">
                    {project.category}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 pt-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {project.description}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={18}
                    className="shrink-0 text-blue-700"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEO & DOCUMENTATION */}
      <section
        id="documentation"
        className="scroll-mt-24 bg-slate-50 py-24"
      >
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 lg:grid-cols-[1fr_0.8fr] lg:px-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">
              Company Video
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Profil & Aktivitas Perusahaan
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Ruang untuk menampilkan video profil dan dokumentasi kegiatan
              operasional perusahaan.
            </p>

            <div className="group relative mt-8 flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-slate-200">
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85"
                alt="Placeholder video perusahaan"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/35" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/20 text-white backdrop-blur-md transition group-hover:scale-110">
                <Play size={25} fill="currentColor" />
              </div>
              <span className="absolute bottom-5 left-5 text-xs font-semibold text-white">
                Video profil perusahaan — tambahkan video resmi ATP
              </span>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">
              Field Documentation
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
              Dokumentasi Kegiatan
            </h2>

            <div className="mt-8 space-y-5">
              {projects.slice(0, 3).map((project) => (
                <div
                  key={project.title}
                  className="flex items-center gap-5 border-b border-slate-200 pb-5"
                >
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-20 w-28 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <span className="text-[9px] font-bold tracking-wider text-blue-700">
                      {project.category}
                    </span>
                    <h3 className="mt-1 text-sm font-bold text-slate-900">
                      {project.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Dokumentasi pekerjaan lapangan
                    </p>
                  </div>
                  <ArrowUpRight size={17} className="text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-12">
          <div className="grid gap-10 rounded-2xl bg-blue-700 p-8 text-white md:grid-cols-[1fr_auto] md:items-center md:p-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">
                Get In Touch
              </p>
              <h2 className="mt-3 text-3xl font-black">
                Mari Terhubung dengan ATP.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
                Hubungi kami untuk mendapatkan informasi lebih lanjut
                mengenai layanan, kegiatan, dan kebutuhan kerja sama.
              </p>
            </div>
            <a
              href="mailto:info@atp.co.id"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-xs font-bold text-blue-800 transition hover:bg-blue-50"
            >
              Hubungi Kami
              <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="mt-12 grid gap-8 border-b border-slate-200 pb-12 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MapPin, title: "Alamat", value: "Tambahkan alamat resmi perusahaan" },
              { icon: Phone, title: "Telepon", value: "Tambahkan nomor resmi perusahaan" },
              { icon: Mail, title: "Email", value: "Tambahkan email resmi perusahaan" },
              { icon: Globe, title: "Website", value: "Tambahkan website resmi perusahaan" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4">
                  <div className="h-fit rounded-lg bg-blue-50 p-3 text-blue-700">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 py-12 text-white">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-12">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
            <div>
              <div className="text-3xl font-black italic tracking-tighter text-white">
                ATP
              </div>
              <p className="mt-3 text-sm font-bold">
                PT. Anugerah Terang Persada
              </p>
              <p className="mt-2 max-w-sm text-xs leading-6 text-slate-400">
                Telecommunication & Network Operation Solutions.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold">Navigasi</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {navigation.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-xs text-slate-400 transition hover:text-white"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold">Sistem Operasional</h3>
              <p className="mt-4 text-xs leading-6 text-slate-400">
                Akses sistem Network Operations Center untuk kebutuhan
                monitoring dan pengelolaan operasional.
              </p>
              <button
                onClick={onLogin}
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-300 hover:text-white"
              >
                Masuk Sistem NOC
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>

          <div className="mt-12 flex flex-col justify-between gap-3 border-t border-slate-800 pt-6 text-[10px] text-slate-500 sm:flex-row">
            <p>
              © {new Date().getFullYear()} PT. Anugerah Terang Persada.
              All Rights Reserved.
            </p>
            <p>Telecommunication & Network Operation</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Home;
